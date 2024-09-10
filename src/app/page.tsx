"use client";

import { useState } from "react";
import Image from 'next/image'
import styles from './page.module.css'
import { Center, Button, Box, Tabs, TabList, Tab, TabPanels, TabPanel, ChakraProvider, Select } from '@chakra-ui/react';
import { constants as SNconstants, shortString} from 'starknet';
import InteractContract from './components/client/Contract/InteractContract';
import { useStoreWallet } from './components/Wallet/walletContext';
import starknetJsImg from '../../public/Images/StarkNet-JS_logo.png';
import WalletApiTag from './components/client/WalletHandle/WalletApiTag';
import SelectWallet from './components/client/WalletHandle/SelectWallet';
import WalletAccountTag from './components/client/WalletHandle/WalletAccountTag';
import { useFrontendProvider } from './components/client/provider/providerContext';
import LowerBanner from "./components/client/LowerBanner";
// import { connect } from "get-starknet";

export default function Page() {

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


  const handleSelectChange = (event: any) => {
    const selectedValue = Number(event.target.value);
    setSelectedOption(selectedValue);
    const correspondingString=selectedValue == 0 ? "default" : walletApiList[selectedValue - 1];
    setSelectedApiVersion(correspondingString);
    console.log("selected value=", selectedValue, correspondingString);
  };

//   const handleConnect330Click = async () => {
//     console.log("open get-starknet. Do not work with v4.0.0!!!");
//     const getWalletSWO = await connect({ modalMode: "alwaysAsk", modalTheme: "light" });
//     console.log(getWalletSWO);
    
// }



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
                  onClick={() => setSelectWalletUI(true)}
                  // onClick={() => handleConnect330Click()}
                >
                  Connect a Wallet
                </Button>
                {displaySelectWalletUI && <SelectWallet></SelectWallet> } 
                

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
                    setSelectWalletUI(false)
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


