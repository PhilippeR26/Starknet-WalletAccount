
import { useStoreWallet } from "../../Wallet/walletContext";
import { RpcMessage } from "get-starknet-core";

export type Response = Pick<RpcMessage, "result">["result"];

export async function callRequest(call: Omit<RpcMessage, "result">): Promise<Response | string> {
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
