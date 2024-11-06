import type { StarknetWindowObject } from "@starknet-io/types-js"

export interface VirtualWallet {
    id: string
    name: string
    icon: string
    windowKey: string
    loadWallet: (
      windowObject: Record<string, unknown>,
    ) => Promise<StarknetWindowObject>
    hasSupport: (windowObject: Record<string, unknown>) => Promise<boolean>
  }
  
