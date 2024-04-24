import type { StarknetWindowObject } from "../StarknetWindowObject"

export function scanObjectForWallets(
  obj: Record<string, any>,
  isWalletObject: (wallet: any) => boolean,
): StarknetWindowObject[] {
  return Object.values(
    Object.getOwnPropertyNames(obj).reduce<
      Record<string, StarknetWindowObject>
    >((wallets, key) => {
      if (key.startsWith("starknet")) {
        const wallet = obj[key]
        console.log("wallet=",wallet);
        if (isWalletObject(wallet) && !wallets[wallet.id]) {
          wallets[wallet.id] = wallet
        }
      }
      return wallets
    }, {}),
  )
}
