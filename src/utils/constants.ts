import { ProviderInterface, RpcProvider, constants as SNconstants } from "starknet";

export const addrETH = "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7";
export const addrTEST = "0x07394cBe418Daa16e42B87Ba67372d4AB4a5dF0B05C6e554D158458Ce245BC10";
export const addrLORDtestnet = "0x019c92fa87f4d5e3bE25C3DD6a284f30282a07e87cd782f5Fd387B82c8142017"; 
export const addrLORDmainnet = "0x0124aeb495b947201f5faC96fD1138E326AD86195B98df6DEc9009158A533B49"; 
export enum CommandWallet {
    wallet_requestAccounts = "wallet_requestAccounts",
    wallet_watchAsset = "wallet_watchAsset",
    wallet_addStarknetChain = "wallet_addStarknetChain",
    wallet_switchStarknetChain = "wallet_switchStarknetChain",
    starknet_addInvokeTransaction = "starknet_addInvokeTransaction",
    starknet_addDeclareTransaction = "starknet_addDeclareTransaction",
    starknet_addDeployAccountTransaction = "starknet_addDeployAccountTransaction",
    starknet_signTypedData = "starknet_signTypedData",
    starknet_supportedSpecs = "starknet_supportedSpecs",
    wallet_requestChainId = "wallet_requestChainId",
    wallet_getPermissions = "wallet_getPermissions",
    wallet_deploymentData = "wallet_deploymentData",
}

export type StarknetChainIdEntry = keyof typeof SNconstants.StarknetChainId;

export const myFrontendProviders: ProviderInterface[] = [
    new RpcProvider({ nodeUrl: "https://starknet-mainnet.public.blastapi.io/rpc/v0_7" }),
    new RpcProvider({ nodeUrl: "https://starknet-testnet.public.blastapi.io/rpc/v0_7" }),
    new RpcProvider({ nodeUrl: "https://free-rpc.nethermind.io/sepolia-juno/v0_7" })];

export const Cairo1ContractAddress: string[] = [
    "0x02bd907b978f58cedf616cff5cda213d63daa3ad28dd3c1ea17ca6cf5e1d395f", // mainnet
    "0x002e9aB2D7DbD8eb3a3cBE628dB705ce5f797Dd256Bd3EAf57bb654f5dEc7512", // testnet
    "0x037bfdeb9c262566183211b89e85b871518eb0c32cbcb026dce9a486560a03e0", // sepolia
];
