"use client";
import { create } from "zustand";
import { ProviderInterface, AccountInterface, type WalletAccount } from "starknet";
import {WALLET_API } from "@starknet-io/types-js";

// import { StarknetWindowObject } from "@/app/core/StarknetWindowObject";

export interface WalletState {
    StarknetWalletObject: WALLET_API.StarknetWindowObject | undefined,
    setMyStarknetWalletObject: (wallet: WALLET_API.StarknetWindowObject) => void,
    address: string,
    setAddressAccount: (address: string) => void,
    chain: string,
    setChain: (chain: string) => void,
    myWalletAccount: WalletAccount|undefined;
    setMyWalletAccount: (myWAccount:WalletAccount)=>void;
    account: AccountInterface | undefined,
    setAccount: (account: AccountInterface) => void,
    provider: ProviderInterface | undefined,
    setProvider: (provider: ProviderInterface) => void,
    isConnected: boolean,
    setConnected: (isConnected: boolean) => void,
    displaySelectWalletUI: boolean,
    setSelectWalletUI: (displaySelectWalletUI: boolean) => void,
    walletApiList: string[],
    setWalletApiList: (version: string[]) => void,
    selectedApiVersion: string,
    setSelectedApiVersion: (version: string) => void,

}

export const useStoreWallet = create<WalletState>()(set => ({
    StarknetWalletObject: undefined,
    setMyStarknetWalletObject: (wallet: WALLET_API.StarknetWindowObject) => { set(state => ({ StarknetWalletObject: wallet })) },
    address: "",
    setAddressAccount: (address: string) => { set(state => ({ address })) },
    chain: "",
    setChain: (chain: string) => { set(state => ({ chain: chain })) },
    myWalletAccount: undefined,
    setMyWalletAccount: (myWAccount: WalletAccount) => { set(state => ({ myWalletAccount: myWAccount })) },
    account: undefined,
    setAccount: (account: AccountInterface) => { set(state => ({ account })) },
    provider: undefined,
    setProvider: (provider: ProviderInterface) => { set(state => ({ provider: provider })) },
    isConnected: false,
    setConnected: (isConnected: boolean) => { set(state => ({ isConnected })) },
    displaySelectWalletUI: false,
    setSelectWalletUI: (displaySelectWalletUI: boolean) => { set(state => ({ displaySelectWalletUI })) },
    walletApiList: [],
    setWalletApiList: (walletApi: string[]) => { set(state => ({ walletApiList: walletApi })) },
    selectedApiVersion: "default",
    setSelectedApiVersion: (selectedApiVersion: string) => { set(state => ({ selectedApiVersion })) },
    }));
