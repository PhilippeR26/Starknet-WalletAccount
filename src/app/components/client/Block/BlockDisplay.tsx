import { useEffect, useState } from 'react';
import { ProviderInterface, GetBlockResponse } from "starknet";
import { useStoreBlock } from "./blockContext";
import { Text, Divider } from "@chakra-ui/react";
import styles from '../../../page.module.css'

type Props = { providerSN: ProviderInterface };

export default function BlockDisplay({ providerSN }: Props) {
    const blockFromContext = useStoreBlock(state => state.dataBlock);
    const setBlockData = useStoreBlock((state) => state.setBlockData);
    const [timerId, setTimerId] = useState<NodeJS.Timer | undefined>(undefined);

    useEffect(() => {
        const tim = setInterval(() => {
            providerSN.getBlock("latest").then((resp: GetBlockResponse) => {
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
            console.log("timerId=", tim);
        }
            , 5000 //ms
        );
        setTimerId(() => tim);

        console.log("startTimer", tim);

        return () => {
            clearInterval(tim);
            console.log("stopTimer", tim)
        }
    }
        , []);

    return (
        <>
            {
                !blockFromContext.blockNumber ? (
                    <Text>Fetching in progres ... </Text>
                ) : (
                    <>
                        <Text className={styles.text1}>BlockNumber = {blockFromContext.blockNumber} timerId = {timerId ? "Set" : "Not set"} </Text>
                        <Text className={styles.text1}>BlockHash = {blockFromContext.blockHash}  </Text>
                        <Text className={styles.text1}>BlockTimeStamp = {blockFromContext.timeStamp}  </Text>
                        <Text className={styles.text1}>BlockGasprice = {blockFromContext.gasPrice}  </Text>
                        <Divider></Divider>
                    </>
                )}
        </>

    )
}