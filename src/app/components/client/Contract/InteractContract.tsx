import { useEffect, useState } from 'react';
import { GetBlockResponse } from "starknet";

import { useStoreBlock, dataBlockInit } from "../Block/blockContext";
import { useStoreWallet } from '../../Wallet/walletContext';

import GetBalance from "./GetBalance";
import PlayWithCairo1 from "./PlayWithCairo1";
import * as constants from "../../../../utils/constants";

import { Text, Spinner, Center, Divider, Box } from "@chakra-ui/react";
import styles from '../../../page.module.css'

// Test a Cairo 1 contrat already deployed in testnet:

export default function InteractContract() {
    // wallet context
    const providerSN = useStoreWallet(state => state.provider);

    // read block
    const blockFromContext = useStoreBlock(state => state.dataBlock);
    const setBlockData = useStoreBlock((state) => state.setBlockData);
    const [timerId, setTimerId] = useState<NodeJS.Timer | undefined>(undefined);

    function catchBlock() {
        providerSN?.getBlock("latest").then((resp: GetBlockResponse) => {
            // console.log("end getBloc");
            if (resp.status !== 'PENDING') {
                setBlockData({
                    timeStamp: resp.timestamp,
                    blockHash: resp.block_hash ?? "",
                    blockNumber: resp.block_number,
                    gasPrice: resp.l1_gas_price.price_in_wei ?? ""
                }

                )
            }
        })
            .catch((e) => { console.log("error getBloc=", e) })
    }
    useEffect(() => {
        catchBlock()
        const tim = setInterval(() => {
            catchBlock()
            console.log("timerId=", tim);
        }
            , 5000 //ms
        );
        setTimerId(() => tim);

        console.log("startTimer", tim);

        return () => {
            clearInterval(tim);
            console.log("stopTimer", tim)
            setBlockData(dataBlockInit);
        }
    }
        , []);


    return (
        <>
            <Box bg='gray.300' color='black' borderWidth='1px' borderRadius='lg'>
                {!blockFromContext.blockNumber ? (
                    <Center>
                        <Spinner color="blue" size="sm" mr={4} />  Fetching data ...
                    </Center>
                ) :
                    (
                        <>
                            <Text className={styles.text1}>Last block number = {blockFromContext.blockNumber} timerId = {timerId ? "Set" : "Not set"} </Text>
                            <Text className={styles.text1}>BlockHash = {blockFromContext.blockHash}  </Text>
                            <Text className={styles.text1}>BlockTimeStamp = {blockFromContext.timeStamp}  </Text>
                            <Text className={styles.text1}>BlockGasprice = {blockFromContext.gasPrice}  </Text>
                            <Divider></Divider>
                        </>
                    )
                }
            </Box>
            {!!blockFromContext.blockNumber &&
                <Box bg='yellow.300' color='black' borderWidth='1px' borderRadius='lg'>
                    <Center> Updated each new block :</Center>
                    <GetBalance tokenAddress={constants.addrETH} ></GetBalance>
                    <Divider borderColor='gray.600'></Divider>
                    <GetBalance tokenAddress={constants.addrTEST} ></GetBalance>

                </Box>
            }
            {!!blockFromContext.blockNumber &&
                <Box bg='mediumaquamarine' color='black' borderWidth='3px' borderColor='green.800' borderRadius='xl' p={2}>
                    <>
                        <Text textAlign='center' fontSize={20}>Balance of Cairo 1 🦀 contract :  </Text>
                        <PlayWithCairo1></PlayWithCairo1>
                    </>

                </Box>
            }
        </>

    )
}