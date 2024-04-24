import { encode } from "starknet";

export async function wait(delay: number) { // ms
    return new Promise((res) => {
        setTimeout(res, delay);
    });
}

export function formatBalance(qty: bigint, decimals: number): string {
    const balance = String("0").repeat(decimals) + qty.toString();
    const rightCleaned = balance.slice(-decimals).replace(/(\d)0+$/gm, '$1');
    const leftCleaned = BigInt(balance.slice(0, balance.length - decimals)).toString();
    return leftCleaned + "." + rightCleaned;
}