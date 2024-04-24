import { useEffect, useState } from 'react';
import { Contract, uint256, shortString } from "starknet";

import { useStoreBlock } from "../Block/blockContext";
import { useStoreWallet } from '../../Wallet/walletContext';

import { Text, Center, Spinner, } from "@chakra-ui/react";
import styles from '../../../page.module.css'

import { erc20Abi } from "../../../contracts/abis/ERC20abi"

type Props = { tokenAddress: string };

export default function GetBalance({ tokenAddress }: Props) {
    // wallet context
    const providerSN = useStoreWallet(state => state.provider);
    const accountAddressFromContext = useStoreWallet(state => state.address);

    // block context
    const blockFromContext = useStoreBlock(state => state.dataBlock);

    const [balance, setBalance] = useState<number | undefined>(undefined);
    const [decimals, setDecimals] = useState<number>(1)
    const [symbol, setSymbol] = useState<string>("");

    const myContract = new Contract(erc20Abi, tokenAddress, providerSN);
    useEffect(() => {
        myContract.decimals()
            .then((resp: any) => {
                const res2 = resp.decimals;
                console.log("resDecimals=", res2);
                setDecimals(Number(res2));
            })
            .catch((e: any) => { console.log("error getDecimals=", e) });

        myContract.symbol()
            .then((resp: any) => {
                const res2 = shortString.decodeShortString(resp.symbol);
                console.log("ressymbol=", res2);
                setSymbol(res2);
            })
            .catch((e: any) => { console.log("error getSymbol=", e) });

    }
        , []);

    useEffect(() => {
        myContract.balanceOf(accountAddressFromContext)
            .then((resp: any) => {
                const res2 = resp.balance;
                const res3 = Number(uint256.uint256ToBN(res2));
                console.log("res3=", res3);
                setBalance(res3 / Math.pow(10, decimals));
            }
            )
            .catch((e: any) => { console.log("error getBloc=", e) });

        return () => { }
    }
        , [blockFromContext.blockNumber, decimals]); // balance updated at each block

    return (
        <>
            {
                typeof (balance) !== "number" ? (
                    <>
                        <Center>
                            <Spinner color="blue" size="sm" mr={4} />  Fetching data ...
                        </Center>
                    </>
                ) : (
                    <>
                        <Text className={styles.text1}>Balance = {balance} {symbol} </Text>
                    </>
                )
            }
        </>

    )
}