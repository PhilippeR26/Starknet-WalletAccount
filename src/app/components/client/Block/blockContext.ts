"use client";
import { create } from "zustand";

export interface DataBlock {
    timeStamp: number,
    blockHash: string,
    blockNumber: number,
    gasPrice: string,
}

export const dataBlockInit:DataBlock={
    timeStamp: 0,
    blockHash: "",
    blockNumber: 0,
    gasPrice: "",
}

export interface BlockState {
    dataBlock: DataBlock,
    setBlockData:(blockInfo:DataBlock) =>void,
}

export const useStoreBlock = create<BlockState>()(set => ({
    dataBlock:dataBlockInit ,
    setBlockData:(blockInfo:DataBlock)=>{set(state=>({dataBlock:blockInfo}))}
}));
