import { Center, Dialog, Image, Portal, StackSeparator, VStack } from "@chakra-ui/react";
import { Button } from "@chakra-ui/react";
import { useStoreWallet } from "../../Wallet/walletContext";
import { useFrontendProvider } from "../provider/providerContext";
import { useEffect } from "react";
import { useState } from "react";
import { walletV5, validateAndParseAddress, constants as SNconstants, WalletAccountV5 } from "starknet";
import { WALLET_API } from "@starknet-io/starknet-types-010";
import { myFrontendProviders } from "@/utils/constants";
import { createStore, type Store } from "@starknet-io/get-starknet-discovery";
import type {
  WalletWithStarknetFeatures,
  StandardEventsChangeProperties,
} from '@starknet-io/get-starknet-wallet-standard/features';


type ValidWallet = {
  wallet: WalletWithStarknetFeatures;
  isValid: boolean;
}

export async function scanObjectForWalletsCustom(
  obj: Record<string, any> // Browser window object
): Promise<ValidWallet[]> {
  const store: Store = createStore();
  const wallets: WalletWithStarknetFeatures[] = store.getWallets();
  console.log("List of starknet wallets", wallets);
  const validWallets: ValidWallet[] = await Promise.all(wallets.map(
    async (wallet: WalletWithStarknetFeatures) => {
      let isValid = await checkCompatibility(wallet);
      return { wallet: wallet, isValid: isValid } as ValidWallet;
    }
  ))
  console.log(validWallets);
  return validWallets;
}
async function checkCompatibility(myWallet: WalletWithStarknetFeatures) {
  let isCompatible: boolean = false;
  try {

    const _permissions = (await myWallet.features["starknet:walletApi"].request({ type: "wallet_getPermissions" })) as string[];
    isCompatible = true;
  } catch {
    (err: any) => { console.log("Wallet compatibility failed.\n", err) };
  }
  return isCompatible;
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
    setMyWallet(selectedWallet); // zustand
    const myWA = await WalletAccountV5.connect(myFrontendProviders[2], selectedWallet);
    setMyWalletAccount(myWA);
    console.log("WalletAccount created=", myWA);
    const result = await walletV5.requestAccounts(selectedWallet);
    if (typeof (result) == "string") {
      console.log("This Wallet is not compatible.");
      return;
    }
    console.log("Current account addr =", result);
    if (Array.isArray(result)) {
      const addr = validateAndParseAddress(result[0]);
      setAddressAccount(addr); // zustand
    }
    const isConnectedWallet: boolean = await walletV5.getPermissions(selectedWallet).then((res: any) => (res as WALLET_API.Permission[]).includes(WALLET_API.Permission.ACCOUNTS));
    setConnected(isConnectedWallet); // zustand
    if (isConnectedWallet) {
      const chainId = (await walletV5.requestChainId(selectedWallet)) as string;
      setChain(chainId);
      setCurrentFrontendProviderIndex(chainId === SNconstants.StarknetChainId.SN_MAIN ? 0 : 2);

      console.log("change Provider index to :", myFrontendProviderIndex);
    }
    setWalletApi(await walletV5.supportedSpecs(selectedWallet));
  }

  useEffect(
    () => {
      const fetchData = async () => {
        const res: ValidWallet[] = await scanObjectForWalletsCustom(window);
        return res
      }
      console.log("Launch select wallet window.");
      fetchData().then((wallets) => setWalletList(wallets));
      return () => { }
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
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.CloseTrigger />
            <Dialog.Header
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
                    return <>
                      {wallet.isValid ? <>
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
                          {wallet.wallet.name + ' ' + wallet.wallet.version}
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
                          {wallet.wallet.name + ' ' + wallet.wallet.version + " not compatible!"}
                        </Button>
                      </>}
                    </>
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