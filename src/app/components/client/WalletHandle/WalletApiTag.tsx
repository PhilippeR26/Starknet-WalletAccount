import { useCallback } from 'react';
import { useEffect, useState } from 'react';
import { Center, Box, SimpleGrid, useDisclosure } from "@chakra-ui/react";
import { constants as SNconstants, validateAndParseAddress } from "starknet";
import type { StandardEventsChangeProperties } from "@wallet-standard/features";
import { useStoreWallet } from '../../Wallet/walletContext';
import * as constants from "../../../../utils/constants";
import RpcWalletCommand from './RpcWalletCommand';
import { useFrontendProvider } from '../provider/providerContext';
import { getStarknetChainId } from "@starknet-io/get-starknet-wallet-standard/chains";


export default function WalletApiTag() {
    // wallet context
    const {
        provider: providerSN,
        StarknetWalletObject: selectedWallet,
        myWalletAccount,
    } = useStoreWallet(state => state);

    const myFrontendProviderIndex = useFrontendProvider(state => state.currentFrontendProviderIndex);
    const setCurrentFrontendProviderIndex = useFrontendProvider(state => state.setCurrentFrontendProviderIndex);

    const chainFromContext = useStoreWallet(state => state.chain);
    const setChain = useStoreWallet(state => state.setChain);
    const addressAccountFromContext = useStoreWallet(state => state.address);
    const setAddressAccount = useStoreWallet(state => state.setAddressAccount);

    const { open, onOpen, onClose } = useDisclosure();
    const [respChangedAccount, setRespChangedAccount] = useState<string>("N/A");
    const [respChangedNetwork, setRespChangedNetwork] = useState<string>("N/A");


    const [time1, setTime1] = useState<string>("N/A");
    const [time2, setTime2] = useState<string>("N/A");

    const handleAccount = useCallback((change: StandardEventsChangeProperties) => {
        console.log("Event detected", change.accounts);
        if (change.accounts?.length) {
            console.log("account event=", change.accounts[0].address);
            const textAddr = validateAndParseAddress(change.accounts[0].address);
            setRespChangedAccount(textAddr);
            setAddressAccount(textAddr);
            setTime1(getTime());
            const network = change.accounts[0].chains[0];
            const chainId = getStarknetChainId(network);
            console.log("chainId=", chainId);
            setRespChangedNetwork(chainId);
            setChain(chainId); //zustand
            setCurrentFrontendProviderIndex(chainId === SNconstants.StarknetChainId.SN_MAIN ? 0 : 2);
            console.log("change Provider index to", chainId);
            setTime2(getTime())
        }
    }, []);

    useEffect(
        () => {
            console.log("subscribe to events.");
            myWalletAccount?.onChange(handleAccount);
            return () => {
                console.log("unsubscribe to events.");
                if (!!selectedWallet) {
                    myWalletAccount?.unsubscribeChange();
                    console.log("events OFF");
                }
            }
        },
        []

    )

    function getTime(): string {
        const date = new Date();
        return date.toLocaleTimeString();
    }

    return (
        <>
            <Center></Center>
            <SimpleGrid minChildWidth="250px" gap="20px" paddingBottom="20px">
                <Box bg="pink.200" color='black' borderWidth='1px' borderRadius='lg'>
                    <Center> Last accountsChanged event : </Center>
                    <Center>Time: {time1} </Center>
                    <Center>Response: {!!respChangedAccount ? respChangedAccount.slice(0, 20) + "..." : "undefined"} </Center>
                </Box>
                <Box bg="pink.200" color='black' borderWidth='1px' borderRadius='lg'>
                    <Center> Last networkChanged event : </Center>
                    <Center>Time: {time2} </Center>
                    <Center>Response: {respChangedNetwork} </Center>
                </Box>
            </SimpleGrid>

            <SimpleGrid minChildWidth="305px" gap="20px" paddingBottom="20px">
                <RpcWalletCommand
                    command={"wallet_requestAccounts"}
                    param=""
                    symbol="silentMode"
                />
                <RpcWalletCommand
                    command={"wallet_requestAccounts"}
                    param=""
                    symbol="noSilentMode"
                />
                <RpcWalletCommand
                    command={"wallet_requestChainId"}
                    param=""
                />
                <RpcWalletCommand
                    command={"wallet_watchAsset"}
                    param={chainFromContext === SNconstants.StarknetChainId.SN_MAIN ? constants.addrLORDmainnet : constants.addrLORDtestnet}
                    symbol={"LORD"}
                />
                <RpcWalletCommand
                    command={"wallet_switchStarknetChain"}
                    param={SNconstants.StarknetChainId.SN_MAIN}
                />
                <RpcWalletCommand
                    command={"wallet_addStarknetChain"}
                    param="ZORG"
                />

                <RpcWalletCommand
                    command={"wallet_addInvokeTransaction"}
                    param="100"
                />
                <RpcWalletCommand
                    command={"wallet_addDeclareTransaction"}
                    param="Object"
                    tip="2 transactions to accept, separated by few seconds"
                />
                {/* <RpcWalletCommand
                    command={constants.CommandWallet.starknet_addDeployAccountTransaction}
                    param="Object"
                /> */}
                <RpcWalletCommand
                    command={"wallet_signTypedData"}
                    param="Object"
                />
                <RpcWalletCommand
                    command={"wallet_supportedWalletApi"}
                    param=""
                />

                <RpcWalletCommand
                    command={"wallet_supportedSpecs"}
                    param=""
                />
                <RpcWalletCommand
                    command={"wallet_getPermissions"}
                    param=""
                />
                <RpcWalletCommand
                    command={"wallet_deploymentData"}
                    param=""
                />
            </SimpleGrid>

            <SimpleGrid minChildWidth="320px" gap="20px" paddingBottom="40px">
                <Box bg="green.200" color='black' borderWidth='1px' borderRadius='lg'>
                    <Center>.name : {selectedWallet?.name} </Center>
                    <Center>.version : {selectedWallet?.version} </Center>
                    <Center>.icon : {typeof (selectedWallet?.icon) === "string" && selectedWallet?.icon.slice(0, 30)  } </Center>
                </Box>
                {/*<Box bg="green.200" color='black' borderWidth='1px' borderRadius='lg'>*/}
                {/*    <Center>.selectedAddress : {wallet?.selectedAddress?.slice(0, 20) + "..."} </Center>*/}
                {/*    <Center>.chainId : {!!(wallet?.chainId) ? wallet.chainId : "undefined"} </Center>*/}
                {/*    <Center>.isConnected : {!!(wallet?.isConnected) ? wallet.isConnected.toString() : "undefined"} </Center>*/}
                {/*</Box>*/}
            </SimpleGrid>
        </>

    )
}

function useMyWallet(arg0: (state: any) => any) {
    throw new Error('Function not implemented.');
}
