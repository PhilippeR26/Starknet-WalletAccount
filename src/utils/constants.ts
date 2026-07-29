import { ProviderInterface, RpcProvider, constants as SNconstants } from "starknet";
import { WALLET_API } from "@starknet-io/types-js";


export const addrETH = "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7";
export const addrSTRK = "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d";
export const addrTEST = "0x07394cBe418Daa16e42B87Ba67372d4AB4a5dF0B05C6e554D158458Ce245BC10";
export const addrLORDtestnet = "0x019c92fa87f4d5e3bE25C3DD6a284f30282a07e87cd782f5Fd387B82c8142017";
export const addrLORDmainnet = "0x0124aeb495b947201f5faC96fD1138E326AD86195B98df6DEc9009158A533B49";
export type CommandWallet = keyof WALLET_API.RpcTypeToMessageMap;

export type StarknetChainIdEntry = keyof typeof SNconstants.StarknetChainId;

export const myFrontendProviders: ProviderInterface[] = [
    new RpcProvider({ nodeUrl: "https://starknet-mainnet.g.alchemy.com/starknet/version/rpc/v0_10/" + process.env.NEXT_PUBLIC_PROVIDER_URL }),
    new RpcProvider({ nodeUrl: "https://starknet-testnet.public.blastapi.io/rpc/v0_7" }),
    new RpcProvider({ nodeUrl: "https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_10/" + process.env.NEXT_PUBLIC_PROVIDER_URL })];

// STRK20 echo invoke helper (Mainnet) — round-trips STRK through an open note.
export const Strk20EchoHelperAddress = "0x78ae662e0cc6d1ab2cfeaf2a51ba8783d88e31886f88a794d142f95a6f8735b";

// STRK20 sub-accounts : the DAPP name scoping this DAPP's sub-accounts. The wallet encodes
// it as a Cairo short string (31 chars max). Not whitelisted anywhere : any DAPP can claim
// any name, the wallet's approval UI is the only gate.
export const Strk20DappName = "wallet-account";

// STRK20 sub-account anonymizer, same index as myFrontendProviders. Its address is the
// deployer of the sub-accounts, so it is needed to resolve a sub-account address from a
// commitment — the wallet API does not expose it.
export const Strk20AnonymizerAddress: string[] = [
    "0x04f33230dc57855c6e7eabe66dfa0fde82c5458fd0e54827cdb7cb4c474888a7", // mainnet
    "0x00", // testnet deprecated
    "0x010a2285310c107c731d997afc147afb7495daff6397c2d242133d9fe8d9b147", // sepolia
];

export const RejectContractAddress: string[] = [
    "0x541b0409e65bf546ff6c3090f4c07c53938b20c1f659250b84ce5eb66d4485e", // mainnet
    "0x00", // testnet deprecated
    "0x4d0f60ba43be97d44257a77e6123f11df89350396480af6ed0cbc81c8179592", // sepolia
];

// OpenZeppelin 0.8.1. Exists in Mainnet & Sepolia
export const accountClass = "0x061dac032f228abef9c6626f995015233097ae253a7f72d68552db02f2971b8f";

export const compatibleApiVersions: string[] = ["0.7", "0.10"];
