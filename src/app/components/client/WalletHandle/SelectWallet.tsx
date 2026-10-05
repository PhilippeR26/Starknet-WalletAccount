import { Center, Dialog, Image, Portal, StackSeparator, VStack } from "@chakra-ui/react";
import { Button } from "@chakra-ui/react";
import { useStoreWallet } from "../../Wallet/walletContext";
import { useFrontendProvider } from "../provider/providerContext";
import { Fragment, useEffect } from "react";
import { useState } from "react";
import { walletV6, validateAndParseAddress, constants as SNconstants, WalletAccountV6 } from "starknet";
import { WALLET_API } from "@starknet-io/types-js";
import { myFrontendProviders } from "@/utils/constants";
import { DIALOG_BACKDROP, DIALOG_CONTENT, DIALOG_HEADER } from "./dialogStyle";
import { createStore, type Store } from "@starknet-io/get-starknet-discovery";
import type {
  WalletWithStarknetFeatures,
  StandardEventsChangeProperties,
} from '@starknet-io/get-starknet-wallet-standard/features';


type ValidWallet = {
  wallet: WalletWithStarknetFeatures;
  isValid: boolean | undefined; // undefined while the compatibility check is running
}

const PERMISSIONS_RETRY_MS = 3000;
const PERMISSIONS_MAX_ATTEMPTS = 3;

// Asks the wallet for its permissions to find out whether it speaks the Wallet API, and reports the verdict through onVerdict.
// An extension still starting up may leave the request unanswered: it is sent again every PERMISSIONS_RETRY_MS, up to PERMISSIONS_MAX_ATTEMPTS times.
// The first answer wins (a rejection means "not compatible"). If nothing answers, the verdict is "not compatible", and a late answer still overrides it.
// Returns a function that cancels the check.
function startCompatibilityCheck(
  wallet: WalletWithStarknetFeatures,
  onVerdict: (isValid: boolean) => void
): () => void {
  const startTime = performance.now();
  const elapsed = () => Math.round(performance.now() - startTime) + " ms";
  let attempts = 0;
  let answered = false;
  let cancelled = false;
  let timerId: ReturnType<typeof setTimeout> | undefined;

  const answer = (isValid: boolean, detail: unknown = "") => {
    if (answered || cancelled) return;
    answered = true;
    clearTimeout(timerId);
    console.log("Wallet", wallet.name, isValid ? "is compatible" : "is NOT compatible", "(answer after " + elapsed() + ")", detail);
    onVerdict(isValid);
  };

  const sendRequest = () => {
    attempts += 1;
    console.log("Wallet", wallet.name, "- wallet_getPermissions, attempt", attempts);
    Promise.resolve()
      .then(() => wallet.features["starknet:walletApi"].request({ type: "wallet_getPermissions" }))
      .then(() => answer(true), (err: unknown) => answer(false, err));
    timerId = setTimeout(() => {
      if (attempts < PERMISSIONS_MAX_ATTEMPTS) {
        sendRequest();
      } else {
        console.log("Wallet", wallet.name, "- no answer after", elapsed());
        onVerdict(false);
      }
    }, PERMISSIONS_RETRY_MS);
  };

  sendRequest();
  return () => {
    cancelled = true;
    clearTimeout(timerId);
  };
}

// Fields required on a window.starknet* object to be taken for a wallet (same check as get-starknet-discovery, injected-wallet.ts).
const INJECTED_WALLET_FIELDS = ["id", "name", "version", "icon", "request", "on", "off"];
const INJECTED_WALLET_POLL_MS = 250;

// Keys of window holding a complete injected wallet (window.starknet, window.starknet_braavos, ...).
function listInjectedWalletKeys(): string[] {
  return Object.getOwnPropertyNames(window).filter((key: string) => {
    if (!key.startsWith("starknet")) return false;
    const candidate = (window as Record<string, any>)[key];
    return typeof candidate === "object" && candidate !== null
      && INJECTED_WALLET_FIELDS.every(field => field in candidate);
  });
}

export default function SelectWallet() {

  const myWallet = useStoreWallet(state => state.StarknetWalletObject);
  const setMyWallet = useStoreWallet(state => state.setMyStarknetWalletObject);

  const myWalletAccount = useStoreWallet(state => state.myWalletAccount);
  const setMyWalletAccount = useStoreWallet(state => state.setMyWalletAccount);
  const myFrontendProviderIndex = useFrontendProvider(state => state.currentFrontendProviderIndex);
  const { setCurrentFrontendProviderIndex } = useFrontendProvider(state => state);

  const isConnected = useStoreWallet(state => state.isConnected);
  const setConnected = useStoreWallet(state => state.setConnected);

  const setWalletApi = useStoreWallet(state => state.setWalletApiList);

  const setChain = useStoreWallet(state => state.setChain);
  const setAddressAccount = useStoreWallet(state => state.setAddressAccount);

  const [walletList, setWalletList] = useState<ValidWallet[]>([]);

  async function handleSelectedWallet(selectedWallet: WalletWithStarknetFeatures) {
    setMyWallet(selectedWallet); // zustand
    console.log("Trying to connect wallet=", selectedWallet);
    const myWA = await WalletAccountV6.connect(myFrontendProviders[2], selectedWallet);
    setMyWalletAccount(myWA);
    console.log("WalletAccount created=", myWA);
    const result = await walletV6.requestAccounts(selectedWallet);
    if (typeof (result) == "string") {
      console.log("This Wallet is not compatible.");
      return;
    }
    console.log("Current account addr =", result);
    if (Array.isArray(result)) {
      const addr = validateAndParseAddress(result[0]);
      setAddressAccount(addr); // zustand
    }
    const isConnectedWallet: boolean = await walletV6.getPermissions(selectedWallet).then((res: any) => (res as WALLET_API.Permission[]).includes(WALLET_API.Permission.ACCOUNTS));
    setConnected(isConnectedWallet); // zustand
    if (isConnectedWallet) {
      const chainId = (await walletV6.requestChainId(selectedWallet)) as string;
      setChain(chainId);
      setCurrentFrontendProviderIndex(chainId === SNconstants.StarknetChainId.SN_MAIN ? 0 : 2);
      console.log("change Provider index to :", myFrontendProviderIndex);
    }
    setWalletApi(await walletV6.supportedSpecs(selectedWallet));
  }

  useEffect(
    () => {
      console.log("Launch select wallet window.");
      const store: Store = createStore();
      const checks = new Map<WalletWithStarknetFeatures, () => void>(); // running compatibility checks, with their cancel function

      const onWalletsChange = (wallets: readonly WalletWithStarknetFeatures[]) => {
        console.log("List of starknet wallets", wallets);
        // Drop the wallets that left the store; new wallets go to the bottom of the list, still unchecked.
        // A replaced wallet keeps its place until its replacement has a verdict.
        setWalletList(prev => {
          const kept = prev.filter(item => wallets.some(w => w.name === item.wallet.name));
          const added = wallets
            .filter(w => !kept.some(item => item.wallet.name === w.name))
            .map((w): ValidWallet => ({ wallet: w, isValid: undefined }));
          return [...kept, ...added];
        });
        // Cancel the checks of wallet objects that left the store, start those of the new ones.
        checks.forEach((cancel, wallet) => {
          if (wallets.includes(wallet)) return;
          cancel();
          checks.delete(wallet);
        });
        wallets.filter(w => !checks.has(w)).forEach(wallet => {
          checks.set(wallet, startCompatibilityCheck(wallet, isValid => {
            setWalletList(prev => prev.map(item => item.wallet.name === wallet.name ? { wallet: wallet, isValid: isValid } : item));
          }));
        });
      };

      onWalletsChange(store.getWallets());
      const unsubscribe = store.subscribe(onWalletsChange);

      // The store scans window.starknet* only once, at creation, and emits nothing when a wallet is injected later.
      // Poll for new keys and ask the store to scan again; a refresh re-attaches listeners on every injected wallet, so only refresh on a new key.
      const knownKeys = new Set<string>(listInjectedWalletKeys()); // already scanned by createStore()
      const intervalId = setInterval(() => {
        const newKeys = listInjectedWalletKeys().filter(key => !knownKeys.has(key));
        if (newKeys.length === 0) return;
        newKeys.forEach(key => knownKeys.add(key));
        console.log("New injected wallet detected:", newKeys);
        store._refreshInjectedWallets();
      }, INJECTED_WALLET_POLL_MS);

      return () => {
        checks.forEach(cancel => cancel());
        clearInterval(intervalId);
        unsubscribe();
      }
    },
    []
  )

  return (
    <Dialog.Root
      placement={"center"}
      scrollBehavior={"inside"}
      size={"md"}
      closeOnInteractOutside={true}
    >
      <Dialog.Trigger asChild>
        <Center>
          <Button
            variant="surface"
            fontWeight='bold'
            mt={3}
            px={5}
          >
            Connect a Wallet
          </Button>
        </Center>
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop {...DIALOG_BACKDROP} />
        <Dialog.Positioner>
          <Dialog.Content {...DIALOG_CONTENT}>
            <Dialog.CloseTrigger />
            <Dialog.Header
              {...DIALOG_HEADER}
              fontSize='xl'
              fontWeight='bold'
              padding={"20px"}
              marginBottom={"10px"}
            >
              Select a wallet:
            </Dialog.Header>
            <Dialog.Body
              px={"20px"}
            >
              <VStack
                separator={<StackSeparator borderColor='gray.200' />}
                gap={3}
                marginBottom={"20px"}
                align='stretch'
              >
                {
                  walletList.map((wallet: ValidWallet, index: number) => {
                    const iconW: string = typeof (wallet.wallet.icon) == "string" ? wallet.wallet.icon : wallet.wallet.icon;
                    return <Fragment key={wallet.wallet.name}>
                      {wallet.isValid === undefined ? <>
                        <Button id={"wId" + index.toString()}
                          fontSize='lg'
                          fontWeight='bold'
                          variant="surface"
                          disabled={true}
                        >
                          <Image src={iconW} width={30} />
                          {wallet.wallet.name + ' ' + wallet.wallet.features["starknet:walletApi"].walletVersion + " checking..."}
                        </Button>
                      </> : wallet.isValid ? <>
                        <Button id={"wId" + index.toString()}
                          // backgroundColor="gray.100"
                          // color={"black"}
                          variant="surface"
                          fontSize='lg'
                          fontWeight='bold'
                          onClick={() => {
                            handleSelectedWallet(wallet.wallet);
                          }} >
                          <Image src={iconW} width={30} />
                          {wallet.wallet.name + ' ' + wallet.wallet.features["starknet:walletApi"].walletVersion}
                        </Button>
                      </> : <>
                        <Button id={"wId" + index.toString()}
                          fontSize='lg'
                          fontWeight='bold'
                          variant="surface"

                          backgroundColor="orange"
                          disabled={true}
                        >
                          <Image src={iconW} width={30} />
                          {wallet.wallet.name + ' ' + wallet.wallet.features["starknet:walletApi"].walletVersion + " not compatible!"}
                        </Button>
                      </>}
                    </Fragment>
                  })
                }
              </VStack>
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}