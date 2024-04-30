import { Box, Button, Center, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, useDisclosure, forwardRef, Tooltip } from "@chakra-ui/react";
import { CallData, GetBlockResponse, constants as SNconstants, TypedData, cairo, ec, encode, hash, json, shortString, stark, addAddressPadding, wallet } from "starknet";
import React, { useEffect, useState } from "react";

import * as constants from "@/utils/constants";
import { StarknetChainIdEntry } from "@/utils/constants";
import { useStoreWallet } from "../../Wallet/walletContext";
import { AddDeclareTransactionParameters, AddDeclareTransactionResult, AddInvokeTransactionParameters, AddInvokeTransactionResult, AddStarknetChainParameters, RequestAccountsParameters, SwitchStarknetChainParameters, WatchAssetParameters, type StarknetWindowObject } from "get-starknet-core";

import { test1Abi } from "../../../contracts/abis/test1";
import { contractSierra } from "@/app/contracts/tmpTest.sierra.json";
import { contractCasm } from "@/app/contracts/tmpTest.casm.json";
import { wait } from "@/utils/utils";
import { resolve } from "path";



type Props = {
    command: constants.CommandWallet,
    symbol?: string,
    param: string,
    tip?: string
};
type Request = {
    type: any,
    params: any
}

export default function RpcWalletCommand({ command, symbol, param, tip }: Props) {
    //    export const RpcWalletCommand=forwardRef(({ command, symbol, param,tip }: Props,ref)=> {
    const myWallet = useStoreWallet(state => state.StarknetWalletObject);
    const myWalletAccount = useStoreWallet(state => state.myWalletAccount);
    const { isOpen, onOpen, onClose } = useDisclosure()
    const [response, setResponse] = useState<string>("N/A");
    const walletFromContext = useStoreWallet(state => state.StarknetWalletObject);
    const getChainId = useStoreWallet(state => state.chain);

    async function callCommand(command: constants.CommandWallet, param: string) {
        switch (command) {
            case constants.CommandWallet.wallet_requestAccounts: {
                if (myWallet) {
                    const response = await wallet.requestAccounts(myWallet);
                    const txtResponse = addAddressPadding(response[0]);
                    setResponse(txtResponse);
                    onOpen();
                }
                break;
            }
            case constants.CommandWallet.wallet_requestChainId: {
                if (myWallet) {
                    const param: RequestAccountsParameters = {};
                    const response = await wallet.requestChainId(myWallet);
                    setResponse(response + " (" + shortString.decodeShortString(response) + ")");
                    onOpen();
                }
                break;
            }
            case constants.CommandWallet.wallet_watchAsset: {
                if (myWallet) {
                    const myAsset: WatchAssetParameters = {
                        type: "ERC20",
                        options: {
                            address: param,
                            decimals: 10,
                            name: "ZOZOZO",
                            symbol: "ZZZ"
                        } // decimals, name, symbol options are useless and are not taken into account by the Wallet
                    };
                    const myRequest = {
                        type: command,
                        params: myAsset
                    }
                    let response: string = "";
                    try {
                        response = (await wallet.watchAsset(myWallet, myAsset)) ? "true" : "false";
                    } catch (err: any) {
                        response = "Error = " + err.message
                    }
                    finally {
                        setResponse(response);
                        onOpen();
                    }
                }
                break;
            }
            case constants.CommandWallet.wallet_switchStarknetChain: {
                if (myWallet) {
                    let response: string = "";
                    try {
                        response = (await wallet.switchStarknetChain(myWallet, param as SNconstants.StarknetChainId)) ? "true" : "false";
                    } catch (err: any) {
                        response = "Error = " + err.message
                    }
                    finally {
                        setResponse(response);
                        onOpen();
                    }
                }
                break;
            }
            case constants.CommandWallet.wallet_addStarknetChain: {
                const myChainId: AddStarknetChainParameters = {
                    id: param,
                    chain_id: shortString.encodeShortString(param),  // A 0x-prefixed hexadecimal string
                    chain_name: param,
                    rpc_urls: ["http://192.168.1.44:6060"],
                    native_currency: {
                        type:"ERC20",
                        options:{address: constants.addrETH, // Not part of the standard, but required by StarkNet as it can work with any ERC20 token as the fee token
                        name: "ETHEREUM",
                        symbol: "ETH", // 2-6 characters long
                        decimals: 18,
                    }
                    }
                } // hex of string
                
                if (myWallet) {
                    let response: string = "";
                    try {
                        response = (await wallet.addStarknetChain(myWallet, myChainId)) ? "true" : "false";
                    } catch (err: any) {
                        response = "Error = " + err.message
                    }
                    finally {
                        setResponse(response);
                        onOpen();
                    }
                }
                break;
            }
            case constants.CommandWallet.starknet_addInvokeTransaction: {
                // param other than 100 will be reverted.
                const contractAddress = getChainId === SNconstants.StarknetChainId.SN_MAIN ?  "0x02bD907B978F58ceDf616cFf5CdA213d63Daa3AD28Dd3C1Ea17cA6CF5E1D395F" : "0x037BFDeB9c262566183211B89E85b871518eb0c32CBcb026dcE9A486560a03E0"; // Sepolia Testnet
                const contractCallData = new CallData(test1Abi);
                const funcName = "test_fail";
                const myCalldata = contractCallData.compile(funcName, {
                    p1: Number(param)
                });
                const myParams: AddInvokeTransactionParameters = {
                    calls: [{
                        contract_address: contractAddress,
                        entry_point: funcName,
                        calldata: myCalldata
                    }]
                }
                if (myWallet) {
                    let response: string = "";
                    try {
                        console.log("execute call =",myParams)
                        const resp = (await wallet.addInvokeTransaction(myWallet, myParams)) ;
                        response=json.stringify(resp,undefined,2);
                    } catch (err: any) {
                        response = "Error = " + err.message
                    }
                    finally {
                        setResponse(response);
                        onOpen();
                    }
                }
                break;
            }
            case constants.CommandWallet.starknet_addDeclareTransaction: {
                const myParams: AddDeclareTransactionParameters = {
                    
                    compiled_class_hash: hash.computeCompiledClassHash(contractCasm),
                    contract_class: contractSierra,
                    
                }
                
                if (myWallet) {
                    let response: string = "";
                    try {
                        const resp = (await wallet.addDeclareTransaction(myWallet, myParams)) ;
                        response=json.stringify(resp,undefined,2);
                    } catch (err: any) {
                        response = "Error = " + err.message
                    }
                    finally {
                        setResponse(response);
                        onOpen();
                    }
                }
                break;
            }
            case constants.CommandWallet.starknet_signTypedData: {
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
                if (myWallet) {
                    let response: string = "";
                    try {
                        const resp = (await wallet.signMessage(myWallet, myTypedData)) ;
                        response=json.stringify(resp,undefined,2);
                    } catch (err: any) {
                        response = "Error = " + err.message
                    }
                    finally {
                        setResponse(response);
                        onOpen();
                    }
                }
                break;
            }
            case constants.CommandWallet.starknet_supportedSpecs: {
                if (myWallet) {
                    let response: string = "";
                    try {
                        const resp = (await wallet.supportedSpecs(myWallet)) ;
                        response=json.stringify(resp,undefined,2);
                    } catch (err: any) {
                        response = "Error = " + err.message
                    }
                    finally {
                        setResponse(response);
                        onOpen();
                    }
                }
                break;
            }
            case constants.CommandWallet.wallet_getPermissions: {
                if (myWallet) {
                    let response: string = "";
                    try {
                        const resp = (await wallet.getPermissions(myWallet)) ;
                        response=json.stringify(resp,undefined,2);
                    } catch (err: any) {
                        response = "Error = " + err.message
                    }
                    finally {
                        setResponse(response);
                        onOpen();
                    }
                }
                break;
            }
            case constants.CommandWallet.wallet_deploymentData: {
                if (myWallet) {
                    let response: string = "";
                    try {
                        const resp = (await wallet.deploymentData(myWallet)) ;
                        response=json.stringify(resp,undefined,2);
                    } catch (err: any) {
                        response = "Error = " + err.message
                    }
                    finally {
                        setResponse(response);
                        onOpen();
                    }
                }
                break;
            }
            default: {
                console.log("wrong Wallet command :", command);
                break;
            }
        }


    }

    return (
        <>
            <Box color='black' borderWidth='px' borderRadius='lg'>
                <Center>
                    <Tooltip hasArrow label={tip} bg='yellow.100' color='black'>
                        <Button bg='blue.100' onClick={() => { callCommand(command, param) }
                        } >{command} {symbol}</Button>
                    </Tooltip>
                </Center>
                <Modal
                    isOpen={isOpen}
                    onClose={onClose}
                >
                    <ModalOverlay />

                    <ModalContent>
                        <ModalHeader fontSize='lg' fontWeight='bold'>
                            Command sent to Wallet.
                        </ModalHeader>
                        <ModalCloseButton />
                        <ModalBody>
                            Command : {command} <br />
                            Param : {param} <br />
                            Response : {response}
                        </ModalBody>

                        <ModalFooter>
                            {/* <Button ref={cancelRef} onClick={onClose}>
                                Cancel
                            </Button> */}
                            <Button colorScheme='red' onClick={onClose} ml={3}>
                                OK
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            </Box>
        </>
    );
}
