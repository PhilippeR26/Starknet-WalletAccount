"use client";

import { useState } from "react";
import Image from 'next/image'
import styles from './page.module.css'
import { Center, Button, Box, Tabs, TabList, Tab, TabPanels, TabPanel, ChakraProvider, Select } from '@chakra-ui/react';
import { constants as SNconstants, WalletAccount, shortString, validateAndParseAddress, wallet } from 'starknet';
import InteractContract from './components/client/Contract/InteractContract';
import { useStoreWallet } from './components/Wallet/walletContext';
import starknetJsImg from '../../public/Images/StarkNet-JS_logo.png';
import WalletApiTag from './components/client/WalletHandle/WalletApiTag';
import SelectWallet from './components/client/WalletHandle/SelectWallet';
import WalletAccountTag from './components/client/WalletHandle/WalletAccountTag';
import { useFrontendProvider } from './components/client/provider/providerContext';
import LowerBanner from "./components/client/LowerBanner";
import { connect } from "@starknet-io/get-starknet";
import { WALLET_API } from "@starknet-io/types-js";
import { myFrontendProviders } from "@/utils/constants";
// import { connect } from "get-starknet";

export default function Page() {
  const [isError, setError] = useState<boolean>(false);

  const displaySelectWalletUI = useStoreWallet(state => state.displaySelectWalletUI);
  const setSelectWalletUI = useStoreWallet(state => state.setSelectWalletUI);

  const addressAccountFromContext = useStoreWallet(state => state.address);
  const setAddressAccount = useStoreWallet(state => state.setAddressAccount);

  const myFrontendProviderIndex = useFrontendProvider(state => state.currentFrontendProviderIndex);
  const setCurrentFrontendProviderIndex = useFrontendProvider(state => state.setCurrentFrontendProviderIndex);

  const myWallet = useStoreWallet(state => state.StarknetWalletObject);
  const setMyWallet = useStoreWallet(state => state.setMyStarknetWalletObject);

  const chainFromContext = useStoreWallet(state => state.chain);
  const setChain = useStoreWallet(state => state.setChain);

  const accountFromContext = useStoreWallet(state => state.account);
  const setAccount = useStoreWallet(state => state.setAccount);

  const providerFromContext = useStoreWallet(state => state.provider);
  const setProvider = useStoreWallet(state => state.setProvider);

  const isConnected = useStoreWallet(state => state.isConnected);
  const setConnected = useStoreWallet(state => state.setConnected);

  const walletApiList = useStoreWallet(state => state.walletApiList);
  const selectedApiVersion = useStoreWallet(state => state.selectedApiVersion);
  const setSelectedApiVersion = useStoreWallet(state => state.setSelectedApiVersion);
  const [selectedOption, setSelectedOption] = useState<number>(0);

  const myWalletAccount = useStoreWallet(state => state.myWalletAccount);
  const setMyWalletAccount = useStoreWallet(state => state.setMyWalletAccount);
  const setWalletApi = useStoreWallet(state => state.setWalletApiList);


  async function selectW() {
    setError(false);
    const myWalletSWO = await connect({ modalMode: "alwaysAsk" });
    if (myWalletSWO) {
      const isValid = await checkCompatibility(myWalletSWO);
      setError(!isValid);
      if (isValid) {
        setMyWallet(myWalletSWO); // zustand
        await handleSelectedWallet(myWalletSWO);
      }
    }
  }

  const checkCompatibility = async (myWalletSWO: WALLET_API.StarknetWindowObject) => {
    // verify compatibility of wallet with the new API of get-starknet v4
    let isCompatible: boolean = false;
    try {
      await myWalletSWO.request({ type: "wallet_supportedSpecs" });
      isCompatible = true;
    } catch {
      (err: any) => { console.log("Wallet compatibility failed.") };
    }
    return isCompatible;
  }

  const handleSelectedWallet = async (selectedWallet: WALLET_API.StarknetWindowObject) => {
    console.log("Trying to connect wallet=", selectedWallet);
    setMyWallet(selectedWallet); // zustand
    setMyWalletAccount(new WalletAccount(myFrontendProviders[2], selectedWallet));

    const result = await wallet.requestAccounts(selectedWallet);
    if (typeof (result) == "string") {
      console.log("This Wallet is not compatible.");
      setSelectWalletUI(false);
      return;
    }
    console.log("Current account addr =", result);
    if (Array.isArray(result)) {
      const addr = validateAndParseAddress(result[0]);
      setAddressAccount(addr); // zustand
    }
    const isConnectedWallet: boolean = await wallet.getPermissions(selectedWallet).then((res: any) => (res as WALLET_API.Permission[]).includes(WALLET_API.Permission.ACCOUNTS));
    setConnected(isConnectedWallet); // zustand
    if (isConnectedWallet) {
      const chainId = (await wallet.requestChainId(selectedWallet)) as string;
      setChain(chainId);
      setCurrentFrontendProviderIndex(chainId === SNconstants.StarknetChainId.SN_MAIN ? 0 : 2);

      console.log("change Provider index to :", myFrontendProviderIndex);
    }
    // ********** TODO : replace supportedSpecs by api versions when available in SNJS
    setWalletApi(await wallet.supportedSpecs(selectedWallet));

    setSelectWalletUI(false);
  }


  const handleSelectChange = (event: any) => {
    const selectedValue = Number(event.target.value);
    setSelectedOption(selectedValue);
    const correspondingString = selectedValue == 0 ? "default" : walletApiList[selectedValue - 1];
    setSelectedApiVersion(correspondingString);
    console.log("selected value=", selectedValue, correspondingString);
  };


  return (
    <ChakraProvider>
      <div>
        <p className={styles.bgText}>
          Test WalletAccount of Starknet.js v6.11.0 <br></br>
          with get-starknet-core v4.0.1
        </p>
        <Center>
          <Image src={starknetJsImg} alt='starknet.js' width={150} />
        </Center>
        <div>
          {!isConnected ? (
            <>
              <Center>
                <Button
                  ml="4"
                  textDecoration="none !important"
                  outline="none !important"
                  boxShadow="none !important"
                  marginTop={3}
                  onClick={() => selectW()}
                // onClick={() => handleConnect330Click()}
                >
                  Connect a Wallet
                </Button>



              </Center>
            </>
          ) : (
            <>
              <Center>
                <Button
                  ml="4"
                  textDecoration="none !important"
                  outline="none !important"
                  boxShadow="none !important"
                  marginTop={3}
                  onClick={() => {
                    setConnected(false);
                    //setSelectWalletUI(false)
                  }}
                >
                  {addressAccountFromContext
                    ? `Your wallet : ${addressAccountFromContext?.slice(0, 7)}...${addressAccountFromContext?.slice(-4)} is connected`
                    : "No Account"}
                </Button>
              </Center>
              <Center mt={1}>
                Wallet API version :
                <Select
                  w={100}
                  ml={2}
                  onChange={handleSelectChange}
                  value={selectedOption}
                >
                  <option key={"idxApi0"} value={0}>default</option>
                  {walletApiList.map((apiVersion, idx) => <option key={"idxApi" + (idx + 1).toString()} value={idx + 1}>{apiVersion}</option>)}
                </Select>
              </Center>
              <br />
              <Tabs variant="enclosed" colorScheme='facebook' size="lg" isFitted >
                <TabList >
                  <Tab> BlockChain</Tab>
                  <Tab>Wallet API</Tab>
                  <Tab>WalletAccount</Tab>
                </TabList>
                <TabPanels>
                  <TabPanel>
                    <Box bg='pink.200' color='black' borderWidth='1px' borderRadius='md'>
                      <p className={styles.text1}>
                        address = {addressAccountFromContext}<br />
                        chain = {chainFromContext != "" ? shortString.decodeShortString(chainFromContext) : ""}
                        <br />
                        provider = the frontend provider uses {Object.keys(SNconstants.StarknetChainId)[myFrontendProviderIndex]
                        }
                        <br />
                        isConnected={isConnected ? "Yes" : "No"}

                      </p>
                    </Box>
                    {!!providerFromContext &&
                      <InteractContract ></InteractContract>}
                  </TabPanel>
                  <TabPanel>
                    <p></p>
                    <WalletApiTag></WalletApiTag>
                  </TabPanel>
                  <TabPanel>
                    <WalletAccountTag></WalletAccountTag>
                  </TabPanel>
                </TabPanels>
              </Tabs>

            </>
          )
          }
        </div>
        <LowerBanner></LowerBanner>
      </div >
    </ChakraProvider>
  )
}


