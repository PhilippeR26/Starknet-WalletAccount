"use client";

import Image from 'next/image'
import styles from './page.module.css'
import { Center, Box, Tabs } from '@chakra-ui/react';
import { Button } from "@chakra-ui/react";
import { Provider } from "@/components/ui/provider";
import { CairoBytes31 } from 'starknet';
import InteractContract from './components/client/Contract/InteractContract';
import { useStoreWallet } from './components/Wallet/walletContext';
import starknetJsImg from '../../public/Images/StarkNet-JS_logo.png';
import WalletApiTag from './components/client/WalletHandle/WalletApiTag';
import SelectWallet from './components/client/WalletHandle/SelectWallet';
import WalletAccountTag from './components/client/WalletHandle/WalletAccountTag';
import { useFrontendProvider } from './components/client/provider/providerContext';
import LowerBanner from "./components/client/LowerBanner";

export default function Page() {
  const addressAccountFromContext = useStoreWallet(state => state.address);
  const { setAddressAccount } = useStoreWallet(state => state);

  const myFrontendProviderIndex = useFrontendProvider(state => state.currentFrontendProviderIndex);
  const { setCurrentFrontendProviderIndex } = useFrontendProvider(state => state);

  const myWallet = useStoreWallet(state => state.StarknetWalletObject);
  const setMyWallet = useStoreWallet(state => state.setMyStarknetWalletObject);

  const chainFromContext = useStoreWallet(state => state.chain);
  const { setChain } = useStoreWallet(state => state);

  
  const providerFromContext = useStoreWallet(state => state.provider);
  const { setProvider } = useStoreWallet(state => state);

  const { isConnected, setConnected } = useStoreWallet(state => state);


  return (
    <Provider>
      <div>
        <p className={styles.bgText}>
          Test WalletAccountV5 of Starknet.js v9.0.0B <br></br>
          with get-starknet v5.0.0
        </p>
        <Center>
          <Image src={starknetJsImg} alt='starknet.js' width={150} />
        </Center>
        <div>
          {!isConnected ? (
            <>
              
                 <SelectWallet></SelectWallet>
              
            </>
          ) : (
            <>
              <Center>
                <Button
                  variant="surface"
                  textDecoration="none !important"
                  fontWeight='bold'
                  outline="none !important"
                  boxShadow="none !important"
                  mt={3}
                  px={5}
                  onClick={() => {
                    setConnected(false);
                  }}
                >
                  {addressAccountFromContext
                    ? `Your wallet : ${addressAccountFromContext?.slice(0, 7)}...${addressAccountFromContext?.slice(-4)} is connected`
                    : "No Account"}
                </Button>
              </Center>
              <br />
              <Tabs.Root
                variant="enclosed"
                colorScheme='facebook'
                size="lg"
                defaultValue="blockChain"
                fitted >
                <Tabs.List bg="bg.muted" rounded="l3" p="1" >

                  <Tabs.Trigger fontWeight={"bold"} value="blockChain"> BlockChain</Tabs.Trigger>
                  <Tabs.Trigger fontWeight={"bold"} value="walletAPI"> Wallet API</Tabs.Trigger>
                  <Tabs.Trigger fontWeight={"bold"} value="walletAccount"> WalletAccount</Tabs.Trigger>
                </Tabs.List>
                <Tabs.Content value="blockChain">
                  <Box bg='pink.200' color='black' borderWidth='1px' borderRadius='md'>
                    <p className={styles.text1}>
                      address = {addressAccountFromContext}<br />
                      chain = {chainFromContext != "" ? new CairoBytes31(chainFromContext).decodeUtf8() : ""}
                      <br />
                      provider = the frontend provider uses {myFrontendProviderIndex == 0 ? "MAINNET" : "TESTNET"
                      }
                      <br />
                      isConnected={isConnected ? "Yes" : "No"}

                    </p>
                  </Box>
                  {!!providerFromContext &&
                    <InteractContract ></InteractContract>}
                </Tabs.Content>
                <Tabs.Content value="walletAPI">
                  <p></p>
                  <WalletApiTag></WalletApiTag>
                </Tabs.Content>
                <Tabs.Content value="walletAccount">
                  <WalletAccountTag></WalletAccountTag>
                </Tabs.Content>
              </Tabs.Root>
            </>
          )
          }
        </div>
        <LowerBanner></LowerBanner>
      </div >
    </Provider >
  )
}


