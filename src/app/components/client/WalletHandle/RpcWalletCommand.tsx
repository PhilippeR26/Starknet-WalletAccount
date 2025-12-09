import { Box, Center, Dialog, useDisclosure } from "@chakra-ui/react";
import { Button } from "@chakra-ui/react";
import { Tooltip } from "@/components/ui/tooltip";
import { CallData, GetBlockResponse, constants as SNconstants, TypedData, cairo, ec, encode, hash, json, shortString, stark, addAddressPadding, walletV5, Contract, type Call, type Calldata } from "starknet";
import { useEffect, useState } from "react";

import * as constants from "@/utils/constants";
import { RejectContractAddress } from "@/utils/constants";
import { useStoreWallet } from "../../Wallet/walletContext";

import { rejectAbi } from "../../../contracts/abis/rejectAbi";
import { getHelloTestSierra } from "@/app/contracts/declareHelloTestSierra";
import { getHelloTestCasm } from "@/app/contracts/declareHelloTestCasm";
import { useFrontendProvider } from "../provider/providerContext";
import { rejectContract } from "@/app/contracts/reject.sierra.json";
import type { WALLET_API } from "@starknet-io/types-js";




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
  const { open, onOpen, onClose } = useDisclosure()
  const [response, setResponse] = useState<string>("N/A");
  const walletFromContext = useStoreWallet(state => state.StarknetWalletObject);
  const getChainId = useStoreWallet(state => state.chain);
  const [testRejectContract, SetRejectContract] = useState<Contract>(new Contract({ abi: rejectContract.abi, address: "0x00" }));

  const selectedApiVersion = useStoreWallet(state => state.selectedApiVersion);


  const DefineRejectContract = () => {
    SetRejectContract(new Contract({
      abi: rejectContract.abi,
      address: RejectContractAddress[myFrontendProviderIndex],
      providerOrAccount: constants.myFrontendProviders[myFrontendProviderIndex]
    }))

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
      case "wallet_requestAccounts": {
        if (myWallet) {
          let txtResponse: string = "";
          try {
            let response: string[] = [""];
            if (symbol === "silentMode") {
              response = await walletV5.requestAccounts(myWallet, true);
            } else {
              response = await walletV5.requestAccounts(myWallet, false);
            }
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
      case "wallet_requestChainId": {
        if (myWallet) {
          const response = await walletV5.requestChainId(myWallet);
          const respText: string = response === null ? "null" : shortString.decodeShortString(response);
          setResponse(response + " (" + respText + ")");
          onOpen();
        }
        break;
      }
      case "wallet_watchAsset": {
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
            response = (await walletV5.watchAsset(myWallet, myAsset)) ? "true" : "false";
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
      case "wallet_switchStarknetChain": {
        if (myWallet) {
          let response: string = "";
          try {
            response = (await walletV5.switchStarknetChain(myWallet, param as SNconstants.StarknetChainId)) ? "true" : "false";
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
      case "wallet_addStarknetChain": {
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
            response = (await walletV5.addStarknetChain(myWallet, myChainId)) ? "true" : "false";
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

      case "wallet_addInvokeTransaction": {
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
        const myCall: Call = new Contract({ abi: rejectAbi, address: contractAddress }).populate(funcName, { p1: Number(param) });
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
            const resp = (await walletV5.addInvokeTransaction(myWallet, myParams));
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

      case "wallet_addDeclareTransaction": {
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
            const txH = await walletV5.addInvokeTransaction(myWallet, myParams0);

            await constants.myFrontendProviders[myFrontendProviderIndex].waitForTransaction(txH.transaction_hash);
            const myParams: WALLET_API.AddDeclareTransactionParameters = {

              compiled_class_hash: hash.computeCompiledClassHash(getHelloTestCasm(declareNonce)),
              contract_class: getHelloTestSierra(declareNonce),

            }
            const resp = await walletV5.addDeclareTransaction(myWallet, myParams);
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

      case "wallet_signTypedData": {
        const myTypedData: TypedData = {
          domain: {
            name: "Example DApp",
            chainId: SNconstants.StarknetChainId.SN_SEPOLIA,
            // chainId: '0x534e5f5345504f4c4941',
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
            const resp = (await walletV5.signMessage(myWallet, myTypedData));
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
      case "wallet_supportedWalletApi": {
        if (myWallet) {
          let response: string = "";
          try {
            // ************* TODO : change function name when implemented in Starknet.js *********
            const resp = (await walletV5.supportedSpecs(myWallet));
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
      case "wallet_supportedSpecs": {
        if (myWallet) {
          let response: string = "";
          try {
            const resp = (await walletV5.supportedSpecs(myWallet));
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
      case "wallet_getPermissions": {
        if (myWallet) {
          let response: string = "";
          try {
            const resp = (await walletV5.getPermissions(myWallet));
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
      case "wallet_deploymentData": {
        if (myWallet) {
          let response: string = "";
          try {
            const resp = (await walletV5.deploymentData(myWallet));
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
          {typeof tip === "undefined" ?
            (
              <>
                <Button
                  colorPalette={"blue"}
                  variant={"surface"}
                  color={"black"}
                  onClick={() => { callCommand(command, param) }
                  }
                >{command} {symbol}</Button>
              </>
            )
            :
            (
              <>
                <Tooltip openDelay={400} showArrow content={tip} >
                  <Button
                    colorPalette={"blue"}
                    variant={"surface"}
                    color={"black"}
                    onClick={() => { callCommand(command, param) }
                    }
                  >{command} {symbol}</Button>
                </Tooltip>
              </>
            )
          }

        </Center>
        <Dialog.Root
          placement={"center"}
          open={open}
          onOpenChange={onClose}
        >
          <Dialog.Positioner>
            <Dialog.Content
              margin={"20px"}
              padding={"10px"}>
              <Dialog.Header>
                <Dialog.Title fontSize='lg' fontWeight='bold'>
                  Command sent to Wallet.
                </Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                Command : {command} <br />
                Param : {param} <br />
                Response : {response}
              </Dialog.Body>

              <Dialog.Footer>
                <Dialog.ActionTrigger asChild>
                  {/* <Button ref={cancelRef} onClick={onClose}>
                                Cancel
                            </Button> */}
                  <Button
                    colorScheme='red'
                    onClick={onClose}
                    ml={3}
                    variant="surface"
                  >
                    OK
                  </Button>
                </Dialog.ActionTrigger>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Dialog.Root>
      </Box>
    </>
  );
}
