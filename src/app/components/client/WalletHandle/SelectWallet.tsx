import { Center, Dialog, Image, Portal, StackSeparator, VStack } from "@chakra-ui/react";
import { Button } from "@chakra-ui/react";
import { useStoreWallet } from "../../Wallet/walletContext";
import { useFrontendProvider } from "../provider/providerContext";
import { useEffect } from "react";
import { useState } from "react";
import { walletV6, validateAndParseAddress, constants as SNconstants, WalletAccountV6 } from "starknet";
import { WALLET_API } from "@starknet-io/types-js";
import { myFrontendProviders } from "@/utils/constants";
import { DIALOG_BACKDROP, DIALOG_CONTENT, DIALOG_HEADER } from "./dialogStyle";
import { createStore, type Store } from "@starknet-io/get-starknet-discovery";
import type { WalletWithStarknetFeatures } from '@starknet-io/get-starknet-wallet-standard/features';

const PERMISSIONS_RETRY_MS = 3000;
const PERMISSIONS_MAX_ATTEMPTS = 3;

const wait = (ms: number) => new Promise<"timeout">(resolve => setTimeout(() => resolve("timeout"), ms));

// Asks the wallet for its permissions to find out whether it speaks the Wallet API.
// An extension still starting up may never answer the first request, so the request is sent again after PERMISSIONS_RETRY_MS, up to PERMISSIONS_MAX_ATTEMPTS times.
async function checkCompatibility(wallet: WalletWithStarknetFeatures): Promise<boolean> {
  for (let attempt = 1; attempt <= PERMISSIONS_MAX_ATTEMPTS; attempt++) {
    try {
      const answer = await Promise.race([
        wallet.features["starknet:walletApi"].request({ type: "wallet_getPermissions" }),
        wait(PERMISSIONS_RETRY_MS),
      ]);
      if (answer !== "timeout") {
        console.log(`Wallet ${wallet.name} is compatible (attempt ${attempt})`);
        return true;
      }
    } catch (err) {
      console.log(`Wallet ${wallet.name} is NOT compatible:`, err);
      return false; // the wallet answered with an error
    }
  }
  console.log(`Wallet ${wallet.name} did not answer after ${PERMISSIONS_MAX_ATTEMPTS} attempts`);
  return false;
}

const INJECTED_WALLET_POLL_MS = 250; // how often window is checked for a newly injected wallet

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

  const [wallets, setWallets] = useState<readonly WalletWithStarknetFeatures[]>([]);
  const [verdicts, setVerdicts] = useState<Map<WalletWithStarknetFeatures, boolean>>(new Map()); // no verdict yet = still checking

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

  // Wallet discovery, done with the get-starknet-discovery store. A wallet reaches the page in one of three ways:
  // - a window.starknet* object, scanned once when the store is created;
  // - a wallet-standard or EIP-6963 registration, reported to store.subscribe() whenever it happens;
  // - a window.starknet* object injected after that scan, which the store does not report: see the polling below.
  // Every wallet is then tested with wallet_getPermissions and listed in the dialog as soon as the store reports it.
  useEffect(
    () => {
      console.log("Launch select wallet window.");
      const store: Store = createStore();
      const checkedWallets = new Set<WalletWithStarknetFeatures>(); // wallet objects whose compatibility check was launched
      let cancelled = false;

      const onWalletsChange = (list: readonly WalletWithStarknetFeatures[]) => {
        console.log("List of starknet wallets", list);
        setWallets(list);
        list.filter(w => !checkedWallets.has(w)).forEach(async (wallet) => {
          checkedWallets.add(wallet);
          const isValid = await checkCompatibility(wallet);
          if (!cancelled) setVerdicts(prev => new Map(prev).set(wallet, isValid));
        });
      };

      onWalletsChange(store.getWallets()); // wallets already known
      const unsubscribe = store.subscribe(onWalletsChange); // wallets registering later

      // The store scans window.starknet* only once, at creation, and emits nothing when a wallet is injected later.
      // Poll the number of starknet* keys of window and ask the store to scan again when it changes.
      // (A scan re-attaches listeners on every injected wallet, so it is only done when a new key appears.)
      // _refreshInjectedWallets() carries an underscore (not documented), but it is part of the Store type of get-starknet-discovery 6.0.6.
      const countKeys = () => Object.getOwnPropertyNames(window).filter(key => key.startsWith("starknet")).length;
      let knownCount = countKeys(); // already scanned by createStore()
      const intervalId = setInterval(() => {
        const count = countKeys();
        if (count === knownCount) return;
        knownCount = count;
        console.log("New starknet* key detected on window, scanning again.");
        store._refreshInjectedWallets();
      }, INJECTED_WALLET_POLL_MS);

      return () => {
        cancelled = true;
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
                  // The store lists the newest wallet first (get-starknet-discovery 6.0.6): reverse it so that new wallets are added at the bottom and no button moves under the cursor.
                  [...wallets].reverse().map((wallet: WalletWithStarknetFeatures, index: number) => {
                    const isValid = verdicts.get(wallet); // undefined while the check is running
                    const status = isValid === undefined ? " checking..." : isValid ? "" : " not compatible!";
                    return <Button key={wallet.name} id={"wId" + index.toString()}
                      variant="surface"
                      fontSize='lg'
                      fontWeight='bold'
                      backgroundColor={isValid === false ? "orange" : undefined}
                      disabled={!isValid}
                      onClick={() => {
                        handleSelectedWallet(wallet);
                      }} >
                      <Image src={wallet.icon} width={30} />
                      {wallet.name + ' ' + wallet.features["starknet:walletApi"].walletVersion + status}
                    </Button>
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