
import { useStoreWallet } from "../../Wallet/walletContext";
import {WALLET_API } from "@starknet-io/types-js";

export type Response = Pick<WALLET_API.RpcMessage, "result">["result"];

export async function callRequest(call: Omit<WALLET_API.RpcMessage, "result">): Promise<Response | string> {
    const myWallet = useStoreWallet.getState().StarknetWalletObject;
    if (!myWallet) {
        console.log("No wallet connected.");
        return ("No wallet");
    }
    let resp: Response | undefined = undefined;
    let crash: boolean = false;
    try {
        resp = await myWallet.request(call);

    } catch {
        (err: any) => { console.log("Wallet request", call.type, " failed.\n", err) };
        crash = true;
    }
    console.log("request", call.type, "resp =", resp, ", crash =", crash);
    //let txtResponse: string;
    if (crash || !resp) { return "Error" }
    return resp;
}
