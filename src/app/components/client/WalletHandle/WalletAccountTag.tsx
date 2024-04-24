import { wait } from "@/utils/utils";
import { Box, Button, StackDivider, VStack, Text, Center, Tooltip } from "@chakra-ui/react";
import { useEffect } from "react";
import { useState } from "react";
import styles from '../../../page.module.css'
import { Contract, WalletAccount, json, num, shortString, validateAndParseAddress, type TypedData, constants as SNconstants } from "starknet";
import { rejectContract } from "@/app/contracts/reject.sierra.json";
import { Cairo1ContractAddress, myFrontendProviders } from "@/utils/constants";
import { useFrontendProvider } from "../provider/providerContext";
import { useStoreWallet } from "../../Wallet/walletContext";

export default function WalletAccountTag() {
    const DISPLAY_DURATION = 15 * 1000 // ms

    const myFrontendProviderIndex = useFrontendProvider(state => state.currentFrontendProviderIndex);
    const myWalletAccount = useStoreWallet(state => state.myWalletAccount);
    const chain = useStoreWallet(state => state.chain);
    const [chainIdWA, setChainIdWA] = useState<string>(chain);


    const [displayReadMyProv, setDisplayReadMyProv] = useState<Boolean>(false);
    const [displayReadWA, setDisplayReadWA] = useState<Boolean>(false);
    const [displayWriteWA, setDisplayWriteWA] = useState<Boolean>(false);
    const [displayDeployContractWA, setDisplayDeployContractWA] = useState<Boolean>(false);
    const [displaySignMessageWA, setDisplaySignMessageWA] = useState<Boolean>(false);

    const [resultReadMyProv, setResultReadMyProv] = useState<string>("");
    const [resultReadWA, setResultReadWA] = useState<string>("");
    const [resultWriteWA, setResultWriteWA] = useState<string>("");
    const [resultDeployContractWA, setResultDeployContractWA] = useState<string>("");
    const [resultSignMessageWA, setSignMessageWA] = useState<string>("");

    const [displayReadWalletAccount, setDisplayReadWalletAccount] = useState<Boolean>(false);
    const [resultReadWalletAccount, setResultReadWalletAccount] = useState<string>("");

    const [testContract, SetTestContract] = useState<Contract>(new Contract(rejectContract.abi, "0x00"));
    const [testContractWA, SetTestContractWA] = useState<Contract>(new Contract(rejectContract.abi, "0x00"));

    const handleReadMyProvider = () => {
        let response: string = "N/A";

        testContract.get_counter()
            .then(
                (result: any) => {
                    response = result.toString()
                })
            .catch((error: any) => { response = error.toString() })
            .finally(() => {
                setDisplayReadMyProv(true);
                setResultReadMyProv(response);
            });
    }

    const handleReadWalletAccount = () => {
        let response: string = "N/A";

        testContractWA.get_counter()
            .then(
                (result: any) => {
                    response = result.toString()
                })
            .catch((error: any) => { response = error.toString() })
            .finally(() => {
                setDisplayReadWA(true);
                setResultReadWA(response);
            });
    }

    const handleInvokeWalletAccount = () => {
        let response: string = "N/A";

        testContractWA.init_count(32)
            .then(
                async (result: any) => {
                    const txH = result.transaction_hash;
                    console.log("txH=", txH);
                    const txR = await myWalletAccount?.channel.waitForTransaction(txH);
                    console.log("txR=", txR);
                    response = json.stringify(txR, undefined, 2);
                })
            .catch((error: any) => { response = error.toString() })
            .finally(() => {
                setDisplayWriteWA(true);
                setResultWriteWA(response);
            });
    }

    const handleDeployContractWalletAccount = () => {
        let response: string = "N/A";

        myWalletAccount?.deployContract({classHash:"0x05f3614e8671257aff9ac38e929c74d65b02d460ae966cd826c9f04a7fa8e0d4"})
            .then(
                async (result: any) => {
                    const txH = result.transaction_hash;
                    console.log("txH=", txH);
                    const txR = await myWalletAccount?.channel.waitForTransaction(txH);
                    console.log("txR=", txR);
                    response = json.stringify(txR, undefined, 2);
                })
            .catch((error: any) => { response = error.toString() })
            .finally(() => {
                setDisplayDeployContractWA(true);
                setResultDeployContractWA(response);
            });
    }

    const handleSignMessageWalletAccount = () => {
        let response: string = "N/A";
        const myTypedData: TypedData = {
            domain: {
              name: "Example DApp",
              chainId: SNconstants.StarknetChainId.SN_SEPOLIA,
              version: "0.0.3",
            },
            types: {
              StarkNetDomain: [
                { name: "name", type: "string" },
                { name: "chainId", type: "felt" },
                { name: "version", type: "string" },
              ],
              Message: [{ name: "message", type: "felt" }],
            },
            primaryType: "Message",
            message: {
              message: "1234",
            },
          
        };

        myWalletAccount?.signMessage(myTypedData)
            .then(
                 (result: any) => {
                    response = (result as string[]).map(val=>num.toHex(val)).join(" ");
                })
            .catch((error: any) => { response = error.toString() })
            .finally(() => {
                setDisplaySignMessageWA(true);
                setSignMessageWA(response);
            });
    }


    const getWAchainId = () => {
        console.log("getWAchainId");
        myWalletAccount?.getChainId()
            .then(
                (result: any) => {
                    setChainIdWA(result.toString());
                });
    }

    useEffect(
        () => {
            let timeId: NodeJS.Timeout;
            if (displayReadMyProv) {
                timeId = setTimeout(() => { setDisplayReadMyProv(false) }, DISPLAY_DURATION);
            }
            return () => { clearTimeout(timeId) }
        }
        , [displayReadMyProv]
    );

    useEffect(
        () => {
            let timeId: NodeJS.Timeout;
            if (displayReadWA) {
                timeId = setTimeout(() => { setDisplayReadWA(false) }, DISPLAY_DURATION);
            }
            return () => { clearTimeout(timeId) }
        }
        , [displayReadWA]
    );

    const DefineContract = () => {
        SetTestContract(new Contract(
            rejectContract.abi,
            Cairo1ContractAddress[myFrontendProviderIndex],
            myFrontendProviders[myFrontendProviderIndex]
        ))
        SetTestContractWA(new Contract(
            rejectContract.abi,
            Cairo1ContractAddress[myFrontendProviderIndex],
            myWalletAccount
        ))
    }
    useEffect(
        () => { 
            DefineContract();
            getWAchainId();
         }
        , []
    )
    useEffect(
        () => { 
            DefineContract();
            getWAchainId();
        }
        , [myFrontendProviderIndex, chain]
    );


    return (
        <VStack
            divider={<StackDivider borderColor='gray.300' />}
            spacing={3}
        >
            <>
                <Center fontSize={16} fontWeight={700} color={"firebrick"}> Use of {Object.keys(SNconstants.StarknetChainId)[myFrontendProviderIndex]} network </Center>
                <Center fontSize={14} color={"darkred"}> my frontend provider Id : {myFrontendProviderIndex}  </Center>
                <Center fontSize={13} color={"darkred"}> contractAddress : {validateAndParseAddress(testContract.address)}  </Center>
                <Center fontSize={13} color={"darkred"}> WalletAccountAddress : {!!myWalletAccount ? validateAndParseAddress(myWalletAccount.address) : ""}  </Center>
                <Center fontSize={13} color={"darkred"}> WalletAccountChain : {shortString.decodeShortString(chainIdWA)}  </Center>
            </>
            <>
                <p>Read with my own frontend provider :</p>
                <Button
                    onClick={() => {
                        handleReadMyProvider()
                    }} >Read Contract
                </Button>
                {displayReadMyProv ? (
                    <Box bg='green.200' color='black' borderWidth='1px' borderColor='green.800' borderRadius='md' p={1} marginTop={2}>
                        <Text className={styles.text1}>result : {resultReadMyProv}</Text>

                    </Box>
                ) : null}
            </>
            <>
                <p>Read with a WalletAccount (that uses my own frontend provider) :</p>
                <Button
                    onClick={() => {
                        handleReadWalletAccount()
                    }} >Read Contract
                </Button>
                {displayReadWA ? (
                    <Box bg='green.200' color='black' borderWidth='1px' borderColor='green.800' borderRadius='md' p={1} marginTop={2}>
                        <Text className={styles.text1}>result : {resultReadWA}</Text>

                    </Box>
                ) : null}
            </>
            <>
                <p>Invoke with a WalletAccount :</p>
                <Button
                    onClick={() => {
                        setDisplayWriteWA(false);
                        handleInvokeWalletAccount()
                    }} >Invoke Contract
                </Button>
                {displayWriteWA ? (
                    <Box bg='green.200' color='black' borderWidth='1px' borderColor='green.800' borderRadius='md' p={1} marginTop={2}>
                        <Text className={styles.text1}>result : {resultWriteWA}</Text>

                    </Box>
                ) : null}
            </>
            <>
                <p>Declare with a WalletAccount :</p>
                <Tooltip hasArrow label="not supported by any wallet" bg='yellow.100' color='black'>
                <Button
                    backgroundColor="orange"
                    isDisabled={true}
                    onClick={() => {
                        handleInvokeWalletAccount()
                    }} >Declare Class
                </Button></Tooltip>
                
            </>
            <>
                <p>Deploy with a WalletAccount :</p>
                <Button
                    onClick={() => {
                        setDisplayDeployContractWA(false);
                        handleDeployContractWalletAccount()
                    }} >Deploy Contract
                </Button>
                {displayDeployContractWA ? (
                    <Box bg='green.200' color='black' borderWidth='1px' borderColor='green.800' borderRadius='md' p={1} marginTop={2}>
                        <Text className={styles.text1}>result : {resultDeployContractWA}</Text>
                    </Box>
                ) : null}
            </>
            <>
                <p>Deploy account with a WalletAccount :</p>
                <Tooltip hasArrow label="not supported by ArgentX" bg='yellow.100' color='black'>
                <Button
                    backgroundColor="orange"
                    isDisabled={true}
                    onClick={() => {
                        handleInvokeWalletAccount()
                    }} >Deploy account
                </Button></Tooltip>
            </>
            <>
                <p>Sign message with a WalletAccount :</p>
                <Button
                    onClick={() => {
                        setDisplaySignMessageWA(false);
                        handleSignMessageWalletAccount()
                    }} >Sign message
                </Button>
                {displaySignMessageWA ? (
                    <Box bg='green.200' color='black' borderWidth='1px' borderColor='green.800' borderRadius='md' p={1} marginTop={2}>
                        <Text className={styles.text1}>result : {resultSignMessageWA}</Text>
                    </Box>
                ) : null}
            </>
        </VStack>
    )
}