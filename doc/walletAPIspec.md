# Starknet Wallet API

> version : v1.4.1 17/june/2026, in accordance with spec 0.10.3-rc1 and rc2: STRK20_TRANSFER_ACTION.amount now accepts the literal `"OPEN"` to transfer the full opened note balance (rc1); wallet_strk20Balances now accepts an empty tokens array to return all shielded balances (rc2).  
> version : v1.4.0 05/june/2026, in accordance with spec 0.10.3-rc0, add STRK20 privacy protocol (wallet_strk20InvokeTransaction, wallet_strk20PrepareInvoke, wallet_strk20Balances) and related types, add errors NOT_REGISTERED/INSUFFICIENT_PRIVATE_BALANCE/PRIVACY_LEAK, update wallet_addInvokeTransaction with optional proof field, fix silent_mode naming (was silentMode) in wallet_requestAccounts and wallet_switchStarknetChain, fix snake_case field names in wallet_addStarknetChain. Note: get-starknet V5 is not compatible with this spec; use get-starknet V6 (Starknet.js v10.x) or later.  
> version : v1.3.0 23/dec/2024, to be in accordance with spec 0.8rc2, add errors DEPLOYMENT_DATA_NOT_AVAILABLE & CHAIN_ID_NOT_SUPPORTED, add silentMode in wallet_switchStarknetChain.  
> version : v1.2.4 06/dec/2024, add case unlocked&connect to behavior table.  
> version : v1.2.3 06/nov/2024, precision about message signature of non deployed account.  
> version : v1.2.2 02/nov/2024, behavior table added and clarify no need of first usage pre-requires.  
> version : v1.2.1 14/june/2024, details for invoke params with Starknet.js v6.  
> version : v1.2.0 27/may/2024, in accordance with official spec https://github.com/starkware-libs/starknet-specs/blob/master/wallet-api/wallet_rpc.json  
> version : v1.1.0 02/may/2024  
> version : v1.0.2 08/feb/2024  
> version : v1.0.1 07/feb/2024  

This document is a documentation of the new interface between DAPPS and Starknet browser wallets.

- [Starknet Wallet API](#starknet-wallet-api)
- [Connect the wallet :](#connect-the-wallet-)
- [Subscription to events :](#subscription-to-events-)
- [Available commands :](#available-commands-)
  - [wallet\_getPermissions :](#wallet_getpermissions-)
  - [wallet\_requestAccounts :](#wallet_requestaccounts-)
  - [wallet\_watchAsset :](#wallet_watchasset-)
  - [wallet\_addStarknetChain :](#wallet_addstarknetchain-)
  - [wallet\_switchStarknetChain :](#wallet_switchstarknetchain-)
  - [wallet\_requestChainId :](#wallet_requestchainid-)
  - [wallet\_deploymentData :](#wallet_deploymentdata-)
  - [wallet\_addInvokeTransaction :](#wallet_addinvoketransaction-)
  - [wallet\_addDeclareTransaction :](#wallet_adddeclaretransaction-)
  - [wallet\_signTypedData :](#wallet_signtypeddata-)
  - [wallet\_supportedSpecs :](#wallet_supportedspecs-)
  - [wallet\_supportedWalletApi :](#wallet_supportedwalletapi-)
  - [wallet\_strk20InvokeTransaction :](#wallet_strk20invoketransaction-)
  - [wallet\_strk20PrepareInvoke :](#wallet_strk20prepareinvoke-)
  - [wallet\_strk20Balances :](#wallet_strk20balances-)
- [STRK20 Privacy Protocol types :](#strk20-privacy-protocol-types-)
- [Behavior summary table :](#behavior-summary-table-)
- [Wallet API version :](#wallet-api-version-)
  - [Error :s](#error-s)


# Connect the wallet :
You have first to select which wallet to use. With get-starknet v6 discovery :
```typescript
import { createStore, type Store } from '@starknet-io/get-starknet/discovery'; // v6.0.0 min
import type { WalletWithStarknetFeatures } from '@starknet-io/get-starknet-wallet-standard/features'; // v6

const store: Store = createStore();
const walletsList: WalletWithStarknetFeatures[] = store.getWallets();
// Create your own UI component to let the user select one of these wallets.
const myWallet: WalletWithStarknetFeatures = walletsList[1]; // example: 2nd wallet
```

Once you have `myWallet`, you can call any wallet API command via the `walletV6` helpers from Starknet.js v10 :
```typescript
import { walletV6, type Call } from 'starknet'; // v10.x.x min

const myCall: Call = myContract.populate("increase_balance", { amount: 200 });
// Convert starknet.js Call (camelCase) to wallet API Call (snake_case):
const myCallAPI = { contract_address: myCall.contractAddress, entry_point: myCall.entrypoint, calldata: myCall.calldata };
const response = await walletV6.addInvokeTransaction(myWallet, { calls: [myCallAPI] });
```

> [!WARNING]
> **get-starknet V5 is not compatible with wallet API spec 0.10.3-rc0.** Use get-starknet V6 or later.

> [!TIP]
> Starknet.js v10 proposes also the `WalletAccountV6` class to code at a higher and more comfortable level.

# Subscription to events :
With get-starknet v6, both account and network changes are delivered through a single `change` event. The callback receives a `StandardEventsChangeProperties` object whose `accounts` array reflects the new wallet state.

At each change of network, both address and chain info are updated.  
At each change of account, only the address is updated.  

### Subscription :
```typescript
import type { StandardEventsChangeProperties } from '@wallet-standard/features';
import { walletV6 } from 'starknet'; // v10.x.x min

const handleChange = (change: StandardEventsChangeProperties) => {
    if (change.accounts?.length) {
        const address = change.accounts[0].address; // hex string
        const chainId = change.accounts[0].chains[0]; // e.g. "starknet:SN_SEPOLIA"
        setChangedAccount(address); // from a useState
        setChangedNetwork(chainId);
    }
};
// subscribeWalletEvent returns an unsubscribe function — store it to cancel the subscription later
const unsubscribe = walletV6.subscribeWalletEvent(myWallet, handleChange);
```

### Un-subscription :
```typescript
unsubscribe(); // call the function returned by subscribeWalletEvent to stop receiving events
```

# Available commands : 
All these commands can be called via the `walletV6` helpers from Starknet.js v10. The function name mirrors the command name in camelCase (exception: `wallet_signTypedData` is wrapped as `signMessage`) :

> [!NOTE]
> **Spec vs library naming**: The official JSON-RPC spec uses snake_case for all parameter names. `@starknet-io/types-js` and Starknet.js generally follow the same naming, with one exception: the spec parameter `invoke_transaction` in `wallet_addInvokeTransaction` is mapped to `calls` in `@starknet-io/types-js`. Input sections below use spec parameter names; code examples use the types-js/Starknet.js names.

## wallet_getPermissions :
### Usage :
Indicate if the active account is authorized by the wallet to interact with the DAPP. 
### Input :
No parameters.
### Output :
```typescript
response : Permission[]

enum Permission {
  Accounts = "accounts",
}

```
### Behavior :
- If authorized, returns an array of strings. The first item content is  `accounts` (equal to `Permission.Accounts` enum).
- If the DAPP is not authorized for the current Wallet account, the response is an empty array.
- If the Wallet is locked, the response is also an empty array.
- This command is silent on Wallet side. No display on UI.
### Example :
```typescript
const resp = await walletV6.getPermissions(myWallet);
// resp = ["accounts"]
```

## wallet_requestAccounts :
### Usage :
Get the account address of the wallet active account. 
### Input :
```typescript
silent_mode?: boolean
```
### Output :
```typescript
response : string[]
```
### Behavior :
- Returns an array of hex strings ; just use the first element.
- Default optional silent_mode : false -> if the Wallet is locked, or if the DAPP is not connected, the Wallet will ask to the user to unlock the Wallet or/and connect the DAPP to the current account. If the user rejects these requests, the answer is an empty array.
- Optional silent_mode : if true, the wallet will not show the wallet-unlock UI in case of a locked wallet, nor the dApp-connect UI in case of a non-connected dApp. If the Wallet is unlocked and the DAPP connected, the response is the array of strings ; otherwise, the response is an empty array.
### Example :
```typescript
const resp = await walletV6.requestAccounts(myWallet);
// resp = ["0x067f5a62ec72010308cee6368a8488c8df74f1d375b989f96d48cde1c88c7929"]
```
  
## wallet_watchAsset :
### Usage :
Add a token in the list of assets displayed by the wallet. 
### Input :
```typescript
interface WatchAssetParameters {
  type: "ERC20" // The asset's interface, e.g. 'ERC20'
  options: {
    address: string // The hexadecimal Starknet address of the token contract
    symbol?: string // A ticker symbol or shorthand, up to 5 alphanumerical characters
    decimals?: number // The number of asset decimals
    image?: string // A string url of the token logo
    name?: string // The name of the token - not in spec
  }
}
```
### Output :
```typescript
response : boolean
```
### Behavior :
- The wallet opens a window to ask if you agree to add this token in the display list. If you agree, returns `true`. 
- The optional parameters are rather useless, as they are automatically recovered by the blockchain data. Whatever you provide, the blockchain data are priority.
- If the address is not an ERC20, the method fails with this error : 
```typescript
interface NOT_ERC20 {
  code: 111;
  message: 'An error occurred (NOT_ERC20)';
}
```
- If the token is already displayed, the result is `true`.
- If the user decline the proposal, the method fails with this error : 
```typescript
interface USER_REFUSED_OP {
  code: 113;
  message: 'An error occurred (USER_REFUSED_OP)';
}
``` 
- Other errors :
```typescript
interface INVALID_REQUEST_PAYLOAD {
  code: 114;
  message: 'An error occurred (INVALID_REQUEST_PAYLOAD)';
}
interface UNKNOWN_ERROR {
  code: 163;
  message: 'An error occurred (UNKNOWN_ERROR)';
}
```

### Example :
```typescript
const addrxASTR = "0x005EF67D8c38B82ba699F206Bf0dB59f1828087A710Bad48Cc4d51A2B0dA4C29";
const myAsset: WatchAssetParameters = {
  type: "ERC20",
  options: {
      address: addrxASTR,
      decimals: 10,
      name: "xAstraly",
      symbol: "xASTR"
  }
}
const resp = await walletV6.watchAsset(myWallet, myAsset);
// resp = true
```
  
## wallet_addStarknetChain :
### Usage :
Add a new network in the list of networks of the wallet. 
### Input :
```typescript
interface AddStarknetChainParameters {
  id: string
  chain_id: string // A 0x-prefixed hexadecimal string
  chain_name: string
  rpc_urls?: string[]
  block_explorer_url?: string[]
  native_currency?: {
    type: 'ERC20'; // The asset's interface, e.g. 'ERC20'
    options: {
      address: string // A 0x-prefixed hexadecimal string
      name?: string
      symbol?: string // 1-6 characters long
      decimals?: number
      image?: string // A string url of the token logo
    }
  } 
  icon_urls?: string[] // Currently ignored.
}
```
### Output :
```typescript
response : boolean
```
### Behavior :
- The wallet opens a window to ask if you agree to add this network in the wallet. If you agree, returns `true`. 
- If something is inconsistent in the input data, fails with error :
```typescript
interface INVALID_REQUEST_PAYLOAD {
  code: 114;
  message: 'An error occurred (INVALID_REQUEST_PAYLOAD)';
}
```
- If the network is already listed, the result is `true`.
- If the user decline the proposal, the method fails with this error : 
```typescript
interface USER_REFUSED_OP {
  code: 113;
  message: 'An error occurred (USER_REFUSED_OP)';
}
``` 
- Other error :
```typescript
interface UNKNOWN_ERROR {
  code: 163;
  message: 'An error occurred (UNKNOWN_ERROR)';
}
```
### Example :
```typescript
const myChain: AddStarknetChainParameters = {
    id: "ZORG",
    chain_id: shortString.encodeShortString("ZORG"),  
    chain_name: "ZORG",
    rpc_urls: ["http://192.168.1.44:6060"],
    native_currency: {
        type: "ERC20",
        options: {
            address: "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
            name: "ETHER",
            symbol: "ETH",
            decimals: 18,
        }
    }
}
const resp = await walletV6.addStarknetChain(myWallet, myChain);
// resp = true
```
 
## wallet_switchStarknetChain :
### Usage :
Change the current network of the wallet. 
### Input :
```typescript
chainId: string       // A 0x-prefixed hexadecimal string of an encoded text (required)
silent_mode?: boolean
```
### Output :
```typescript
response : boolean
```
### Behavior :
- The wallet opens a window to ask if you agree to change the current network in the wallet. If you agree, returns `true`. 
- Optional silent_mode : if true, the wallet will not show the wallet-unlock UI in case of a locked wallet, nor the dApp-connect UI in case of a non-connected dApp. If the Wallet is unlocked and the DAPP connected, the wallet shows the change chain UI ; otherwise, the response is an error :
```typescript
interface CHAIN_ID_NOT_SUPPORTED {
  code: 117;
  message: "An error occurred (CHAIN_ID_NOT_SUPPORTED)";
}
```
- If something is inconsistent in the input data, the method fails with this error :
```typescript
interface UNLISTED_NETWORK {
  code: 112;
  message: 'An error occurred (UNLISTED_NETWORK)';
}
```
- If the network is already the current one, the result is `true`.
- If the network is not existing, fails with Error 112 "Network details are incorrect".
- If the user decline the proposal, the method fails with this error : 
```typescript
interface USER_REFUSED_OP {
  code: 113;
  message: 'An error occurred (USER_REFUSED_OP)';
}
```
- Other error :
```typescript
interface UNKNOWN_ERROR {
  code: 163;
  message: 'An error occurred (UNKNOWN_ERROR)';
}
```
### Example :
```typescript
const myChainId: SwitchStarknetChainParameters = {
    chainId: "0x534e5f5345504f4c4941" // SN_SEPOLIA
}
const resp = await walletV6.switchStarknetChain(myWallet, myChainId.chainId);
// resp = true
```

## wallet_requestChainId :
### Usage :
Returns the chainId of the current network of the wallet. 
### Input :
No parameters.
### Output :
```typescript
response : string
```
common chainId :
  SN_MAIN = "0x534e5f4d41494e",
  SN_SEPOLIA = "0x534e5f5345504f4c4941",
### Behavior :
- No errors possible for this method.
### Example :
```typescript
const resp = await walletV6.requestChainId(myWallet);
// resp = "0x534e5f5345504f4c4941"
```

## wallet_deploymentData :
### Usage :
Request the deployment data of an account created, but not yet deployed. 
### Input :
No parameters.
### Output :
```typescript
response : interface AccountDeploymentData {
  address: string // the expected address, used to double-check the returned data
  class_hash: string // The class hash of the contract to deploy
  salt: string // The salt used for the computation of the account address
  calldata: string[] // An array of felts
  sigdata?: string[] // An optional array of felts to be added in the signature
  version: 0 | 1 // Cairo version (an integer)
}
```
### Behavior :
Provides the data that will be used by the wallet to deploy an existing account (existing in the wallet, but not yet in the network).  
- If the current account is already deployed, the method fails with this error : 
```typescript
interface ACCOUNT_ALREADY_DEPLOYED {
  code: 115;
  message: 'An error occurred (ACCOUNT_ALREADY_DEPLOYED)';
}
``` 
- If the wallet is locked and the DAPP not connected, the method fails with this error :
```typescript
interface DEPLOYMENT_DATA_NOT_AVAILABLE {
  code: 116;
  message: "An error occurred (DEPLOYMENT_DATA_NOT_AVAILABLE)";
}
``` 
### Example :
```typescript
const resp = await walletV6.deploymentData(myWallet);
// resp = {
//   address: "0x0111fb83be44a70468d51cfcf8bccd4190cf119e4b2f83530ea13b5d35b9849d",
//   class_hash: "0x03a5029a79d1849f58229e22f7f2b96bdd1dc8680e6cd5530a3122839f2ab878",
//   salt: ""0xd3d12fb38fcc210966bcecd2ed83ba44b67e794209b994d1bac08f37f78e8e",
//   calldata: [ "0xd3d12fb38fcc210966bcecd2ed83ba44b67e794209b994d1bac08f37f78e8e", "0x0" ],
//   version:  1,
// }
```

## wallet_addInvokeTransaction :
### Usage :
Send one or several transaction(s) to the network. Can also submit a STRK20 privacy protocol transaction when a ZK proof (produced by `wallet_strk20PrepareInvoke`) is provided. 
### Input :
```typescript
invoke_transaction: Call[]  // A list of calls to invoke (required)
proof?: STRK20_PROOF        // Optional ZK proof, required when submitting a STRK20 call from wallet_strk20PrepareInvoke
api_version?: string

type Call = {
  contract_address: string
  entry_point: string
  calldata?: string[]
}
type STRK20_PROOF = {
  data: string        // Serialized proof. Empty string in simulate mode.
  output: string[]    // L2-to-L1 message payload felts. Empty array in simulate mode.
  proof_facts: string[] // Proof facts to include with the transaction. Empty array in simulate mode.
}
```
> [!NOTE]
> **types-js / Starknet.js naming**: `@starknet-io/types-js` maps the spec parameter `invoke_transaction` to the property `calls` in `AddInvokeTransactionParameters`. When using types-js or Starknet.js, pass `params: { calls: [...] }` instead of `params: { invoke_transaction: [...] }`.
### Output :
```typescript
response : interface AddInvokeTransactionResult {
  transaction_hash: string
}
```
### Behavior :
- If the user approved the transaction in the wallet, the response is the transaction hash.
- If a `proof` is provided, it must have been generated by `wallet_strk20PrepareInvoke` for the same set of calls; pass the `call` and `proof` from its result directly.
- If an error occurred with these parameters, fails with Error :
```typescript
interface INVALID_REQUEST_PAYLOAD {
  code: 114;
  message: 'An error occurred (INVALID_REQUEST_PAYLOAD)';
}
```
- If the user decline the proposal, the method fails with this error : 
```typescript
interface USER_REFUSED_OP {
  code: 113;
  message: 'An error occurred (USER_REFUSED_OP)';
}
```
- Other error :
```typescript
interface UNKNOWN_ERROR {
  code: 163;
  message: 'An error occurred (UNKNOWN_ERROR)';
}
```
### Example :
```typescript
const contractAddress = "0x697d3bc2e38d57752c28be0432771f4312d070174ae54eef67dd29e4afb174";
const funcName = "increase_balance";
const myCall = myContract.populate(funcName, {
    amount: 200
});
const myCallAPI = {
  contract_address: myCall.contractAddress,
  entry_point: myCall.entrypoint,
  calldata: myCall.calldata as Calldata
};
// Using types-js / Starknet.js: 'calls' is the types-js mapping for spec param 'invoke_transaction'
const resp = await walletV6.addInvokeTransaction(myWallet, { calls: [myCallAPI] });
// resp = {transaction_hash: "0x067f5a62ec72010308cee6368a8488c8df74f1d375b989f96d48cde1c88c7929"}
```
> [!WARNING]
> The Calldata requested by this API is different from the one provided by Starknet.js.  
> So a conversion is needed when using this endpoint.

### High-level example (WalletAccountV6) :
`WalletAccountV6.execute()` accepts starknet.js `Call` directly — the conversion to wallet API format is handled internally :
```typescript
import { WalletAccountV6, type Call } from 'starknet'; // v10.x.x min

// myWalletAccount is a WalletAccountV6 instance
const myCall: Call = myContract.populate("increase_balance", { amount: 200 });
const resp = await myWalletAccount.execute(myCall);
// resp = {transaction_hash: "0x067f5a62ec72010308cee6368a8488c8df74f1d375b989f96d48cde1c88c7929"}
```

### Example with STRK20 proof :
```typescript
// Step 1 — prepare (generates ZK proof)
const prepared = await walletV6.strk20PrepareInvoke(myWallet, [
  { type: "transfer", token: "0x...", amount: "1000", recipient: "0x..." }
]);
// Step 2 — submit with the proof (types-js: 'calls' maps to spec 'invoke_transaction')
const resp = await walletV6.addInvokeTransaction(myWallet, {
  calls: [prepared.call],
  proof: prepared.proof
});
// resp = {transaction_hash: "0x..."}
```

## wallet_addDeclareTransaction :
### Usage :
Declare a new class in the current network. 
### Input :
```typescript
interface AddDeclareTransactionParameters {
  compiled_class_hash: string // The hash of the Cairo assembly resulting from the Sierra compilation
  contract_class: {
    sierra_program: string[] // The list of Sierra instructions of which the program consists
    contract_class_version: string // The version of the contract class object. Currently, the Starknet OS supports version "0.1.0"
    entry_points_by_type: { // Entry points by type
      CONSTRUCTOR: SIERRA_ENTRY_POINT[]
      EXTERNAL: SIERRA_ENTRY_POINT[]
      L1_HANDLER: SIERRA_ENTRY_POINT[]
    },
    abi: string // The stringified class ABI, as supplied by the user declaring the class
    }
  class_hash?: string;
};
type SIERRA_ENTRY_POINT = {
  selector: string; // selector of the function name = selector.getSelectorFromName(funcName: string);
  function_idx: number;
};
```
### Output :
```typescript
response : interface AddDeclareTransactionResult {
  transaction_hash: string // The hash of the declare transaction
  class_hash: string // The hash of the declared class
}
```
### Behavior :
- If the user approved the declaration in the wallet, the response type is `AddDeclareTransactionResult`.
- If the user approved the declaration in the wallet, and if the class is already declared, the function throw an error :
```typescript
interface INVALID_REQUEST_PAYLOAD {
  code: 114;
  message: 'An error occurred (INVALID_REQUEST_PAYLOAD)';
}
```
  same error if an error occurred in the network.
- If the user decline the proposal, the method fails with this error : 
```typescript
interface USER_REFUSED_OP {
  code: 113;
  message: 'An error occurred (USER_REFUSED_OP)';
}
```
- Other error :
```typescript
interface UNKNOWN_ERROR {
  code: 163;
  message: 'An error occurred (UNKNOWN_ERROR)';
}
```
### Example :
```typescript
const myParams: AddDeclareTransactionParameters = {
    compiled_class_hash: hash.computeCompiledClassHash(contractCasm),
    contract_class: {
        sierra_program: contractSierra.sierra_program,
        contract_class_version: "0x01",
        entry_points_by_type: contractSierra.entry_points_by_type,
        abi:json.stringify(contractSierra.abi),
    },
}
const resp = await walletV6.addDeclareTransaction(myWallet, myParams);
// resp = {transaction_hash: "0x067f5a62ec72010308cee6368a8488c8df74f1d375b989f96d48cde1c88c7929", class_hash: "0x2bfd9564754d9b4a326da62b2f22b8fea7bbeffd62da4fcaea986c323b7aeb"}
```

## wallet_signTypedData : 
### Usage :
Returns the signature of an EIP712 "like" message, made by the current account of the wallet. 
### Input :
```typescript
interface TypedData {
  types: Record<string, StarknetType[]>
  primaryType: string
  domain: StarknetDomain
  message: Record<string, unknown>
}
type StarknetType =
    | {
  name: string
  type: string
}
    | StarknetEnumType
    | StarknetMerkleType;
type StarknetMerkleType = {
  name: string
  type: "merkletree"
  contains: string
};
export type StarknetEnumType = {
  name: string;
  type: 'enum';
  contains: string;
};
interface StarknetDomain extends Record<string, unknown> {
  name?: string
  version?: string
  chainId?: string | number
  revision?: string;
}
```
### Output :
```typescript
response : string[] // Signature. Standard signature is 2 felts, but depending of the wallet, response length can be different.
```
### Behavior :
- If the user accepted to sign, the response type is the signature.
- If an error occurred in the network, fails with Error :
```typescript
interface INVALID_REQUEST_PAYLOAD {
  code: 114;
  message: 'An error occurred (INVALID_REQUEST_PAYLOAD)';
}
```
- If the user decline the proposal, the method fails with this error : 
```typescript
interface USER_REFUSED_OP {
  code: 113;
  message: 'An error occurred (USER_REFUSED_OP)';
}
```
- Other error :
```typescript
interface UNKNOWN_ERROR {
  code: 163;
  message: 'An error occurred (UNKNOWN_ERROR)';
}
```
- The wallet send back the signature, whatever the account is deployed or not. It's a Wallet choice to alert or not that the account is not yet deployed, but in all cases it sign and send the response.
### Example :
```typescript
const myTypedData: TypedData = {
      types: {
          StarkNetDomain: [
              { name: "name", type: "string" },
              { name: "version", type: "string" },
              { name: "chainId", type: "string" },
          ],
          Airdrop: [
              { name: "address", type: "string" },
              { name: "amount", type: "string" }
          ],
          Validate: [
              { name: "id", type: "string" },
              { name: "from", type: "string" },
              { name: "amount", type: "string" },
              { name: "nameGamer", type: "string" },
              { name: "endDate", type: "string" },
              { name: "itemsAuthorized", type: "string*" }, // array of string
              { name: "chkFunction", type: "selector" }, // name of function
              { name: "rootList", type: "merkletree", contains: "Airdrop" } // root of a merkle tree
          ]
      },
      primaryType: "Validate",
      domain: {
          name: "myDapp", 
          version: "1",
          chainId: shortString.encodeShortString("SN_GOERLI"), 
      },
      message: {
          id: "0x0000004f000f",
          from: "0x2c94f628d125cd0e86eaefea735ba24c262b9a441728f63e5776661829a4066",
          amount: "400",
          nameGamer: "Hector26",
          endDate: "0x27d32a3033df4277caa9e9396100b7ca8c66a4ef8ea5f6765b91a7c17f0109c",
          itemsAuthorized: ["0x01", "0x03", "0x0a", "0x0e"],
          chkFunction: "check_authorization",
          rootList: [
              {
                  address: "0x69b49c2cc8b16e80e86bfc5b0614a59aa8c9b601569c7b80dde04d3f3151b79",
                  amount: "1554785",
              }
          ]
      },
  }
}
// Note: the walletV6 wrapper for wallet_signTypedData is named signMessage
const resp = await walletV6.signMessage(myWallet, myTypedData);
// resp = ["0x490864293786342333657489548354947743460397232672997805795441858116745355019", "0x2855273948349341532300559537680769749551471477465497884530979636925080056604"]
```

## wallet_supportedSpecs :
### Usage :
Returns a list of rpc spec versions compatible with the wallet. 
### Input :
No parameters.
### Output :
```typescript
response : string[]
```
### Behavior :
- The response is an array of strings. Each string is the version of a supported starknet API version. Includes only the 2 main digits, with the`.` as separator ; example : `0.7`.
### Example :
```typescript
const resp = await walletV6.supportedSpecs(myWallet);
// resp = ["0.6","0.7"]
```

## wallet_supportedWalletApi :
### Usage :
Returns a list of Wallet API versions compatible with the wallet. 
### Input :
No parameters.
### Output :
```typescript
response : string[]
```
### Behavior :
- The response is an array of strings. Each string is the version of a supported Wallet API version. Includes only the 2 main digits, with the `.` as separator ; example : `0.7`.
### Example :
```typescript
// walletV6 does not expose a helper for this command; use the raw request:
const resp = await myWallet.features['starknet:walletApi'].request({type: "wallet_supportedWalletApi"});
// resp = ["0.7","0.8"]
```

## wallet_strk20InvokeTransaction :
### Usage :
Execute one or more STRK20 privacy protocol actions in a single transaction. The wallet builds the calldata, generates the ZK proof and submits the transaction. This is the all-in-one alternative to the `wallet_strk20PrepareInvoke` + `wallet_addInvokeTransaction` two-step flow.
> [!WARNING]
> ZK proof generation is required. This call can take significantly longer than `wallet_addInvokeTransaction`. The dApp must tolerate long-running calls.
### Input :
```typescript
actions: STRK20_ACTION[]  // Ordered list of actions to execute atomically (required, minimum 1)
api_version?: string
```
See [STRK20 Privacy Protocol types](#strk20-privacy-protocol-types-) for the `STRK20_ACTION` union type.
### Output :
```typescript
response : { transaction_hash: string }
```
### Behavior :
- The wallet shows an approval UI for the privacy actions. If the user approves, the wallet generates the ZK proof, submits the transaction and returns the transaction hash.
- Registration into the privacy pool is handled transparently by the wallet. If the account is not registered :
```typescript
interface NOT_REGISTERED {
  code: 118;
  message: 'An error occurred (NOT_REGISTERED)';
}
```
- If the private balance is insufficient for a withdraw or transfer action :
```typescript
interface INSUFFICIENT_PRIVATE_BALANCE {
  code: 119;
  message: 'An error occurred (INSUFFICIENT_PRIVATE_BALANCE)';
}
```
- If completing the operation may compromise user privacy :
```typescript
interface PRIVACY_LEAK {
  code: 120;
  message: 'An error occurred (PRIVACY_LEAK)';
}
```
- If an error occurred with these parameters :
```typescript
interface INVALID_REQUEST_PAYLOAD {
  code: 114;
  message: 'An error occurred (INVALID_REQUEST_PAYLOAD)';
}
```
- If the user decline the proposal :
```typescript
interface USER_REFUSED_OP {
  code: 113;
  message: 'An error occurred (USER_REFUSED_OP)';
}
```
- Other error :
```typescript
interface UNKNOWN_ERROR {
  code: 163;
  message: 'An error occurred (UNKNOWN_ERROR)';
}
```
### Example :
```typescript
const resp = await walletV6.strk20InvokeTransaction(myWallet, [
  {
    type: "transfer",
    token: "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
    amount: "1000000000000000000",
    recipient: "0x067f5a62ec72010308cee6368a8488c8df74f1d375b989f96d48cde1c88c7929"
  }
]);
// resp = { transaction_hash: "0x..." }
```

## wallet_strk20PrepareInvoke :
### Usage :
Prepare a STRK20 privacy protocol transaction by building the calldata and generating a ZK proof, without submitting it to the network. The dApp is responsible for submitting the result via `wallet_addInvokeTransaction` (passing the returned `call` as `calls[0]` and the returned `proof`). Use `simulate: true` to skip ZK proof generation for fee estimation or UI previews — the returned call is **not submittable on-chain** in that case.
> [!WARNING]
> When `simulate` is false (default), ZK proof generation is required. This call can take significantly longer than `wallet_addInvokeTransaction`. The dApp must tolerate long-running calls.
### Input :
```typescript
actions: STRK20_ACTION[]  // Ordered list of actions to bundle (required, minimum 1)
simulate?: boolean        // If true, skip ZK proof generation. Default: false.
api_version?: string
```
See [STRK20 Privacy Protocol types](#strk20-privacy-protocol-types-) for the `STRK20_ACTION` union type.
### Output :
```typescript
response : STRK20_CALL_AND_PROOF
// type STRK20_CALL_AND_PROOF = {
//   call: Call           // The Starknet call to submit (typically targeting the privacy pool contract)
//   proof: STRK20_PROOF  // ZK proof material. All fields empty when simulate was true.
// }
```
### Behavior :
- Returns the assembled `call` and its `proof`. Pass both directly to `wallet_addInvokeTransaction` to submit the transaction.
- When `simulate: true`, the proof fields (`data`, `output`, `proof_facts`) are present but empty — the returned call cannot be submitted on-chain.
- Errors are the same as `wallet_strk20InvokeTransaction` (NOT_REGISTERED, INSUFFICIENT_PRIVATE_BALANCE, PRIVACY_LEAK, INVALID_REQUEST_PAYLOAD, USER_REFUSED_OP, API_VERSION_NOT_SUPPORTED, UNKNOWN_ERROR).
### Example :
```typescript
// Step 1 — prepare (generates ZK proof)
const prepared = await walletV6.strk20PrepareInvoke(myWallet, [
  {
    type: "deposit",
    token: "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
    amount: "500000000000000000"
  }
]);
// prepared = { call: { contract_address: "0x...", entry_point: "...", calldata: [...] }, proof: { data: "...", output: [...], proof_facts: [...] } }

// Step 2 — submit (types-js: 'calls' maps to spec 'invoke_transaction')
const resp = await walletV6.addInvokeTransaction(myWallet, {
  calls: [prepared.call],
  proof: prepared.proof
});
// resp = { transaction_hash: "0x..." }
```

## wallet_strk20Balances :
### Usage :
Query the private STRK20 balances of the current account for a list of token addresses. Returns one balance entry per requested token, in the same order as the input.
### Input :
```typescript
tokens: string[]   // List of token contract addresses (required). An empty array returns the balances of all shielded tokens.
api_version?: string
```
### Output :
```typescript
response : STRK20_BALANCE_ENTRY[]
// type STRK20_BALANCE_ENTRY = {
//   token: string   // token contract address
//   balance: string // private balance in smallest unit, as felt
// }
```
### Behavior :
- Returns one `STRK20_BALANCE_ENTRY` per requested token, in the same order as the input `tokens` array.
- If `tokens` is an empty array, returns one entry per shielded token the wallet currently holds in the privacy pool (order unspecified).
- If the account is not registered in the STRK20 privacy protocol :
```typescript
interface NOT_REGISTERED {
  code: 118;
  message: 'An error occurred (NOT_REGISTERED)';
}
```
- If an error occurred with these parameters :
```typescript
interface INVALID_REQUEST_PAYLOAD {
  code: 114;
  message: 'An error occurred (INVALID_REQUEST_PAYLOAD)';
}
```
- If the user decline the query :
```typescript
interface USER_REFUSED_OP {
  code: 113;
  message: 'An error occurred (USER_REFUSED_OP)';
}
```
- Other error :
```typescript
interface UNKNOWN_ERROR {
  code: 163;
  message: 'An error occurred (UNKNOWN_ERROR)';
}
```
### Example :
```typescript
const ETH = "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7";
const STRK = "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d";
const resp = await walletV6.strk20Balances(myWallet, [ETH, STRK]);
// resp = [
//   { token: "0x049d...", balance: "500000000000000000" },
//   { token: "0x0471...", balance: "0" }
// ]
```

# STRK20 Privacy Protocol types :

The STRK20 privacy protocol enables private token operations using ZK proofs. It supports four action types (deposit, withdraw, transfer, invoke). All amounts are expressed in the token's smallest unit.

```typescript
// ZK proof produced by wallet_strk20PrepareInvoke
type STRK20_PROOF = {
  data: string          // Serialized proof. Empty string in simulate mode.
  output: string[]      // L2-to-L1 message payload: [class_hash, ...serialized_server_actions]. Empty array in simulate mode.
  proof_facts: string[] // Proof facts to include with the transaction. Empty array in simulate mode.
}

// Result of wallet_strk20PrepareInvoke
type STRK20_CALL_AND_PROOF = {
  call: Call          // The Starknet call to submit (typically targets the privacy pool contract)
  proof: STRK20_PROOF // ZK proof material (all fields empty when produced in simulate mode)
}

// Wallet-resolved placeholder substituted by the wallet during action assembly.
// Allowed patterns:
//   ${openNoteIds[N]} — expands to the Nth note ID created by openNote actions in the same transaction (0-based index)
//   ${poolAddress}    — expands to the privacy pool contract address
type STRK20_CALLDATA_PLACEHOLDER = string

type STRK20_CALLDATA_ITEM = string | STRK20_CALLDATA_PLACEHOLDER

// Deposit public tokens from the user's account into the privacy pool (always to self)
type STRK20_DEPOSIT_ACTION = {
  type: 'deposit'
  token: string    // token contract address
  amount: string   // amount as felt
}

// Withdraw funds from the privacy pool to a public recipient address
type STRK20_WITHDRAW_ACTION = {
  type: 'withdraw'
  token: string
  amount: string
  recipient: string  // public Starknet address that receives the withdrawn funds
}

// Privately transfer funds inside the privacy pool to another registered user
type STRK20_TRANSFER_ACTION = {
  type: 'transfer'
  token: string
  amount: string | 'OPEN'  // Amount in smallest unit, or "OPEN" to transfer the full opened note balance
  recipient: string  // Starknet address of the registered recipient inside the privacy pool
}

// Invoke an arbitrary contract entry point as part of the same STRK20 transaction.
// Calldata items may be literal felts or wallet-resolved placeholders.
type STRK20_INVOKE_ACTION = {
  type: 'invoke'
  contract: string
  calldata: STRK20_CALLDATA_ITEM[]
}

type STRK20_ACTION =
  | STRK20_DEPOSIT_ACTION
  | STRK20_WITHDRAW_ACTION
  | STRK20_TRANSFER_ACTION
  | STRK20_INVOKE_ACTION

type STRK20_BALANCE_ENTRY = {
  token: string    // token contract address
  balance: string  // private balance in smallest unit, as felt
}
```

# Behavior summary table :
|Wallet |DAPP ||
|---:|:---:|:--:|
||**Not connected**|**Connected**|
|**Unlocked**|1|2|
|**Locked**|3|4|
<br>

Expected behavior:
| Function  |  wallet locked + not connected <br> (case 3) | Once unlocked + not connected <br> (case 1) |Once unlocked and connected <br> (case 2) | Connected + Wallet locked <br> (case 4)|
| :--------------------------------------------: | :-----------------------: | :---------------------------: | :---------------------------------: |:--:|
|             wallet_getPermissions              |     silent return []      |       silent return []        |     silent return ["accounts"]      |silent return [] |
| wallet_requestAccounts <br> silent_mode : false |         Unlock UI         |        DAPP connect UI        |       silent return [address] |Unlock UI |
| wallet_requestAccounts <br> silent_mode : true  |     silent return []      |       silent return []        |       silent return [address]       |silent return []  |
|               wallet_watchAsset                |         Unlock UI         |        DAPP connect UI        |      UI proposing a new token       |Unlock UI|
|            wallet_addStarknetChain             |         Unlock UI         |        DAPP connect UI        |      UI proposing a new chain       |Unlock UI|
|           wallet_switchStarknetChain <br> silent_mode : false          |         Unlock UI         |        DAPP connect UI        |    UI proposing to change chain     |Unlock UI |
| wallet_switchStarknetChain <br> silent_mode : true          |         silent return of an error 117         |        silent return of an error 117        |    UI proposing to change chain     |silent return of an error 117 |
|   wallet_requestChainId    |  silent return a string   |    silent return a string     |       silent return a string        |silent return a string     |
|             wallet_deploymentData              | silent return of an error 116 |   silent return of an error 116  | silent return an object or an error 115 |silent return of an error 116 |
|          wallet_addInvokeTransaction           |         Unlock UI         |        DAPP connect UI        |         UI for transaction   |Unlock UI |
|          wallet_addDeclareTransaction          |         Unlock UI         |        DAPP connect UI        |      UI for class declaration  |Unlock UI |
|              wallet_signTypedData              |         Unlock UI         |        DAPP connect UI        |      UI for message signature       |Unlock UI |
|             wallet_supportedSpecs              |  silent return [string]   |    silent return [string]     |       silent return [string]        |silent return [string]   |
|           wallet_supportedWalletApi            |  silent return [string]   |    silent return [string]     |       silent return [string]  |silent return [string]   |
|        wallet_strk20InvokeTransaction          |  Unlock UI  |  DAPP connect UI  |  UI for STRK20 transaction  |Unlock UI |
|          wallet_strk20PrepareInvoke            |  Unlock UI  |  DAPP connect UI  |  UI for STRK20 transaction preparation  |Unlock UI |
|            wallet_strk20Balances               |  Unlock UI  |  DAPP connect UI  |  silent return balance array  |Unlock UI |

# Wallet API version :

All entries of this Wallet API have an optional parameter to define the version of API used to create the request. 
## Example :<!-- omit from toc -->
```typescript
// walletV6 helpers do not expose api_version; use the raw request to pass it explicitly:
const resp = await myWallet.features['starknet:walletApi'].request({
  type: "wallet_requestChainId",
  params: { api_version: "0.7" }
});
// resp = "0x534e5f5345504f4c4941"
```
## Error :<!-- omit from toc -->s
In case of version not supported by the Wallet, an Error is returned : 
```typescript
interface API_VERSION_NOT_SUPPORTED {
  code: 162;
  message: 'An error occurred (API_VERSION_NOT_SUPPORTED)';
}
```
