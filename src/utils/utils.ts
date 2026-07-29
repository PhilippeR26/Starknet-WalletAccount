import { encode, num } from "starknet";

// Shorten a felt/hex for display, like the wallet address ("0x1dc5a1c...1927a").
export function shortHex(h: string): string {
    const hex = num.toHex(h);
    return hex.length <= 13 ? hex : `${hex.slice(0, 7)}...${hex.slice(-4)}`;
}

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