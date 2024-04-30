"use client";
import { useState } from "react";
import Image from 'next/image'
import styles from './page.module.css'
import { Center, Spinner, Text, Button, Divider, Box, Tabs, TabList, Tab, TabPanels, TabPanel, useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter, VStack, StackDivider, ChakraProvider } from '@chakra-ui/react';
import { constants as SNconstants, shortString } from 'starknet';
import InteractContract from './components/client/Contract/InteractContract';
import { useStoreWallet } from './components/Wallet/walletContext';
import starknetJsImg from '../../public/Images/StarkNet-JS_logo.png';
import WalletApiTag from './components/client/WalletHandle/WalletApiTag';
import SelectWallet from './components/client/WalletHandle/SelectWallet';
import WalletAccountTag from './components/client/WalletHandle/WalletAccountTag';
import { useFrontendProvider } from './components/client/provider/providerContext';

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





    return (
        <ChakraProvider>
            <div>
                <p className={styles.bgText}>
                    Test WalletAccount of Starknet.js v6.8.0 <br></br>
                    with get-starknet-core v4.0.0-next.5
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
                                >
                                    Connect a Wallet
                                </Button>
                                {displaySelectWalletUI ? <SelectWallet></SelectWallet> : null}

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
                                                chain = {chainFromContext!=""? shortString.decodeShortString(chainFromContext):""}
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
            </div >
        </ChakraProvider>
    )
}


