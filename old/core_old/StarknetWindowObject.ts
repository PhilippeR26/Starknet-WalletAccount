import { num, shortString } from "starknet"

export enum StarknetChainId {
  SN_MAIN = "0x534e5f4d41494e",
  SN_GOERLI = "0x534e5f474f45524c49",
  SN_SEPOLIA = "0x534e5f5345504f4c4941",
}

export enum Permission {
  Accounts = "accounts",
}

type FELT = string

type Call = {
  contract_address: FELT
  entrypoint: string
  calldata?: FELT[]
}

type SIERRA_ENTRY_POINT = {
  selector: FELT
  function_idx: number
}

type StarknetMerkleType = {
  name: string
  type: "merkletree"
  contains: string
}

/**
 * A single type, as part of a struct. The `type` field can be any of the EIP-712 supported types.
 *
 * Note that the `uint` and `int` aliases like in Solidity, and fixed point numbers are not supported by the EIP-712
 * standard.
 */
type StarknetType =
    | {
  name: string
  type: string
}
    | StarknetMerkleType

/**
 * The EIP712 domain struct. Any of these fields are optional, but it must contain at least one field.
 */
interface StarknetDomain extends Record<string, unknown> {
  name?: string
  version?: string
  chainId?: string | number
}

/**
 * The complete typed data, with all the structs, domain data, primary type of the message, and the message itself.
 */
export interface TypedData {
  types: Record<string, StarknetType[]>
  primaryType: string
  domain: StarknetDomain
  message: Record<string, unknown>
}

export type AccountChangeEventHandler = (accounts?: string[]) => void

export type NetworkChangeEventHandler = (
    chainId?: StarknetChainId,
    accounts?: string[],
) => void

export type WalletEvents =
    | {
  type: "accountsChanged"
  handler: AccountChangeEventHandler
}
    | {
  type: "networkChanged"
  handler: NetworkChangeEventHandler
}

/**
 * INVOKE_TXN_V1
 * @see https://github.com/starkware-libs/starknet-specs/blob/master/api/starknet_api_openrpc.json
 */
export interface AddInvokeTransactionParameters {
  /**
   * Calls to invoke by the account
   */
  calls: Call[]
}
export interface AddInvokeTransactionResult {
  /**
   * The hash of the invoke transaction
   */
  transaction_hash: FELT
}

/**
 * BROADCASTED_DECLARE_TXN_V2
 * @see https://github.com/starkware-libs/starknet-specs/blob/master/api/starknet_api_openrpc.json
 */
export interface AddDeclareTransactionParameters {
  /**
   * The hash of the Cairo assembly resulting from the Sierra compilation
   */
  compiled_class_hash: FELT
  contract_class: {
    /**
     * The list of Sierra instructions of which the program consists
     */
    sierra_program: FELT[]
    /**
     * The version of the contract class object. Currently, the Starknet OS supports version 0.1.0
     */
    contract_class_version: string
    /**
     * Entry points by type
     */
    entry_points_by_type: {
      CONSTRUCTOR: SIERRA_ENTRY_POINT[]
      EXTERNAL: SIERRA_ENTRY_POINT[]
      L1_HANDLER: SIERRA_ENTRY_POINT[]
    }
    /**
     * The class ABI, as supplied by the user declaring the class
     */
    abi?: any[]
  }
}
export interface AddDeclareTransactionResult {
  /**
   * The hash of the declare transaction
   */
  transaction_hash: FELT
  /**
   * The hash of the declared class
   */
  class_hash: FELT
}

/**
 * DEPLOY_ACCOUNT_TXN_V1
 * @see https://github.com/starkware-libs/starknet-specs/blob/master/api/starknet_api_openrpc.json
 */
export interface AddDeployAccountTransactionParameters {
  /**
   * The salt for the address of the deployed contract
   */
  contract_address_salt: FELT
  /**
   * The parameters passed to the constructor
   */
  constructor_calldata: FELT[]
  /**
   * The hash of the deployed contract's class
   */
  class_hash: FELT
}
export interface AddDeployAccountTransactionResult {
  /**
   * The hash of the deploy transaction
   */
  transaction_hash: FELT
  /**
   * The address of the new contract
   */
  contract_address: FELT
}

/**
 * EIP-1102:
 * @see https://eips.ethereum.org/EIPS/eip-1102
 */
export interface RequestAccountsParameters {
  /**
   * If true, the wallet will not show the wallet-unlock UI in case of a locked wallet,
   * nor the dApp-approve UI in case of a non-allowed dApp.
   */
  silentMode?: boolean
}

/**
 * EIP-747:
 * @see https://github.com/ethereum/EIPs/blob/master/EIPS/eip-747.md
 */
export interface WatchAssetParameters {
  type: "ERC20" // The asset's interface, e.g. 'ERC20'
  options: {
    address: string // The hexadecimal Starknet address of the token contract
    symbol?: string // A ticker symbol or shorthand, up to 5 alphanumerical characters
    decimals?: number // The number of asset decimals
    image?: string // A string url of the token logo
    name?: string // The name of the token - not in spec
  }
}

/**
 * EIP-3085:
 * @see https://github.com/ethereum/EIPs/blob/master/EIPS/eip-3085.md
 */
export interface AddStarknetChainParameters {
  id: string
  chainId: string // A 0x-prefixed hexadecimal string
  chainName: string
  rpcUrls?: string[]
  blockExplorerUrls?: string[]

  nativeCurrency?: {
    address: string // Not part of the standard, but required by Starknet as it can work with any ERC20 token as the fee token
    name: string
    symbol: string // 2-6 characters long
    decimals: number
  } // Currently ignored.
  iconUrls?: string[] // Currently ignored.
}

export interface SwitchStarknetChainParameters {
  chainId: string // A 0x-prefixed hexadecimal string
}

// see https://community.starknet.io/t/snip-deployment-interface-between-dapps-and-wallets/101923
export interface GetDeploymentDataResult {
  address: FELT // the expected address, used to double-check the returned data
  class_hash: FELT // The class hash of the contract to deploy
  salt: FELT // The salt used for the computation of the account address
  calldata: FELT[] // An array of felts
  sigdata?: FELT[] // An optional array of felts to be added in the signature
  version: 0 | 1 // Cairo version (an integer)
}

export type RpcMessage =
    | {
  type: "wallet_getPermissions"
  result: Permission[]
}
    | {
  type: "wallet_requestAccounts"
  params?: RequestAccountsParameters
  result: string[]
}
    | {
  type: "wallet_watchAsset"
  params: WatchAssetParameters
  result: boolean
}
    | {
  type: "wallet_addStarknetChain"
  params: AddStarknetChainParameters
  result: boolean
}
    | {
  type: "wallet_switchStarknetChain"
  params: SwitchStarknetChainParameters
  result: boolean
}
    | {
  type: "wallet_requestChainId"
  result: StarknetChainId // returns the chain ID of the current network
}
    | {
  type: "wallet_deploymentData"
  result: GetDeploymentDataResult
}
    | {
  type: "starknet_addInvokeTransaction"
  params: AddInvokeTransactionParameters
  result: AddInvokeTransactionResult
}
    | {
  type: "starknet_addDeclareTransaction"
  params: AddDeclareTransactionParameters
  result: AddDeclareTransactionResult
}
    | {
  type: "starknet_addDeployAccountTransaction"
  params: AddDeployAccountTransactionParameters
  result: AddDeployAccountTransactionResult
}
    | {
  type: "starknet_signTypedData"
  params: TypedData
  result: string[]
}
    | {
  type: "starknet_supportedSpecs"
  result: string[] // supported starknet specs' tags (see https://github.com/starkware-libs/starknet-specs)
}

export interface StarknetWindowObject {
  id: string
  name: string
  version: string
  icon: string | { dark: string; light: string }
  request: <T extends RpcMessage>(
      call: Omit<T, "result">,
  ) => Promise<T["result"]>
  on: <E extends WalletEvents>(
      event: E["type"],
      handleEvent: E["handler"],
  ) => void
  off: <E extends WalletEvents>(
      event: E["type"],
      handleEvent: E["handler"],
  ) => void
}

declare global {
  interface Window {
    [key: `starknet_${string}`]: StarknetWindowObject | undefined
  }
}
