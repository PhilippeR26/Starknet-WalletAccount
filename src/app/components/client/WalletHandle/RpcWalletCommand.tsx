import { Box, Button, Center, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, useDisclosure, forwardRef, Tooltip } from "@chakra-ui/react";
import { CallData, GetBlockResponse, constants as SNconstants, TypedData, cairo, ec, encode, hash, json, shortString, stark, addAddressPadding, wallet, Contract, type Call, type Calldata } from "starknet";
import React, { useEffect, useState } from "react";

import * as constants from "@/utils/constants";
import { RejectContractAddress } from "@/utils/constants";
import { useStoreWallet } from "../../Wallet/walletContext";
import {WALLET_API } from "@starknet-io/types-js";

import { rejectAbi } from "../../../contracts/abis/rejectAbi";
import { getHelloTestSierra } from "@/app/contracts/declareHelloTestSierra";
import { getHelloTestCasm } from "@/app/contracts/declareHelloTestCasm";
import { wait } from "@/utils/utils";
import { resolve } from "path";
import { useFrontendProvider } from "../provider/providerContext";
import { rejectContract } from "@/app/contracts/reject.sierra.json";



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
  const myFrontendProviderIndex = useFrontendProvider(state => state.currentFrontendProviderIndex);
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [response, setResponse] = useState<string>("N/A");
  const walletFromContext = useStoreWallet(state => state.StarknetWalletObject);
  const getChainId = useStoreWallet(state => state.chain);
  const [testRejectContract, SetRejectContract] = useState<Contract>(new Contract(rejectContract.abi, "0x00"));

  const selectedApiVersion = useStoreWallet(state => state.selectedApiVersion);


  const DefineRejectContract = () => {
    SetRejectContract(new Contract(
      rejectContract.abi,
      RejectContractAddress[myFrontendProviderIndex],
      constants.myFrontendProviders[myFrontendProviderIndex]
    ))

  }
  useEffect(
    () => {
      DefineRejectContract();
    }
    , []
  )
  useEffect(
    () => {
      DefineRejectContract();
    }
    , [myFrontendProviderIndex, myFrontendProviderIndex]
  );

  async function callCommand(command: constants.CommandWallet, param: string) {
    switch (command) {
      case constants.CommandWallet.wallet_requestAccounts: {
        if (myWallet) {
          let txtResponse: string = "";
          try {
            const response: string[] = await wallet.requestAccounts(myWallet, undefined);
            txtResponse = addAddressPadding(response[0]);
          } catch (err: any) {
            txtResponse = "Error " + err.code + " = " + err.message
          }
          finally {
            setResponse(txtResponse);
            onOpen();
          }

        }
        break;
      }
      case constants.CommandWallet.wallet_requestChainId: {
        if (myWallet) {
          const param: WALLET_API.RequestAccountsParameters = {};
          const response = await wallet.requestChainId(myWallet);
          setResponse(response + " (" + shortString.decodeShortString(response) + ")");
          onOpen();
        }
        break;
      }
      case constants.CommandWallet.wallet_watchAsset: {
        if (myWallet) {
          const myAsset: WALLET_API.WatchAssetParameters = {
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
            response = "Error " + err.code + " = " + err.message
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
            response = "Error " + err.code + " = " + err.message
          }
          finally {
            setResponse(response);
            onOpen();
          }
        }
        break;
      }
      case constants.CommandWallet.wallet_addStarknetChain: {
        const myChainId: WALLET_API.AddStarknetChainParameters = {
          id: param,
          chain_id: shortString.encodeShortString(param),  // A 0x-prefixed hexadecimal string
          chain_name: param,
          rpc_urls: ["http://192.168.1.44:6060"],
          native_currency: {
            type: "ERC20",
            options: {
              address: constants.addrETH, // Not part of the standard, but required by StarkNet as it can work with any ERC20 token as the fee token
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
            response = "Error " + err.code + " = " + err.message
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
        const contractAddress = RejectContractAddress[myFrontendProviderIndex];
        //const contractCallData = new CallData(rejectAbi);
        const funcName = "test_fail";
        //  const myCalldata = contractCallData.compile(funcName, {
        //    p1: Number(param)
        //  });

        // const myParams: AddInvokeTransactionParameters = {
        //   calls: [{
        //     contract_address: contractAddress,
        //     entry_point: funcName,
        //     calldata: myCalldata
        //   }]
        // }
        //const contract=new Contract(rejectAbi,contractAddress,undefined);
        const myCall: Call = new Contract(rejectAbi, contractAddress, undefined).populate(funcName, { p1: Number(param) });
        const myParams: WALLET_API.AddInvokeTransactionParameters = {
          calls: [{
            contract_address: myCall.contractAddress,
            entry_point: myCall.entrypoint,
            calldata: myCall.calldata as Calldata
          }]
        };
        if (myWallet) {
          let response: string = "";
          try {
            console.log("execute call =", myParams)
            const resp = (await wallet.addInvokeTransaction(myWallet, myParams));
            response = json.stringify(resp, undefined, 2);
          } catch (err: any) {
            response = "Error " + err.code + " = " + err.message
          }
          finally {
            setResponse(response);
            onOpen();
          }
        }
        break;
      }

      case constants.CommandWallet.starknet_addDeclareTransaction: {
        if (myWallet) {

          let response: string = "";
          try {
            // TODO : read nonce, increase nonce
            const declareNonce = await testRejectContract.get_nonce() as number;
            const contractCallData = new CallData(rejectAbi);
            const funcName = "process_nonce";
            const myParams0: WALLET_API.AddInvokeTransactionParameters = {
              calls: [{
                contract_address: testRejectContract.address,
                entry_point: funcName,
                calldata: []
              }]
            }
            const txH = await wallet.addInvokeTransaction(myWallet, myParams0);

            await constants.myFrontendProviders[myFrontendProviderIndex].waitForTransaction(txH.transaction_hash);
            const myParams: WALLET_API.AddDeclareTransactionParameters = {

              compiled_class_hash: hash.computeCompiledClassHash(getHelloTestCasm(declareNonce)),
              contract_class: getHelloTestSierra(declareNonce),

            }
            const resp = await wallet.addDeclareTransaction(myWallet, myParams);
            response = json.stringify(resp, undefined, 2);
          } catch (err: any) {
            response = "Error " + err.code + " = " + err.message
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
            //chainId: SNconstants.StarknetChainId.SN_SEPOLIA,
            chainId: '0x534e5f5345504f4c4941',
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
            const resp = (await wallet.signMessage(myWallet, myTypedData));
            response = json.stringify(resp, undefined, 2);
          } catch (err: any) {
            response = "Error " + err.code + " = " + err.message
          }
          finally {
            setResponse(response);
            onOpen();
          }
        }
        break;
      }
      case constants.CommandWallet.wallet_supportedWalletApi: {
        if (myWallet) {
          let response: string = "";
          try {
            // ************* TODO : change function name when implemented in Starknet.js *********
            const resp = (await wallet.supportedSpecs(myWallet));
            response = json.stringify(resp, undefined, 2);
          } catch (err: any) {
            response = "Error " + err.code + " = " + err.message
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
            const resp = (await wallet.supportedSpecs(myWallet));
            response = json.stringify(resp, undefined, 2);
          } catch (err: any) {
            response = "Error " + err.code + " = " + err.message
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
            const resp = (await wallet.getPermissions(myWallet));
            response = json.stringify(resp, undefined, 2);
          } catch (err: any) {
            response = "Error " + err.code + " = " + err.message
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
            const resp = (await wallet.deploymentData(myWallet));
            response = json.stringify(resp, undefined, 2);
          } catch (err: any) {
            response = "Error " + err.code + " = " + err.message
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
