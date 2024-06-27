# Starknet Wallet API

> version : v1.2.1 14/june/2024, details for invoke params with Starknet.js v6
> version : v1.2.0 27/may/2024, in accordance with official spec https://github.com/starkware-libs/starknet-specs/wallet-api/wallet_rpc.json  
> version : v1.1.0 02/may/2024 
> version : v1.0.2 08/feb/2024  
> version : v1.0.1 07/feb/2024  

This document is a documentation of the new interface between DAPPS and Starknet browser wallets.

- [Starknet Wallet API](#starknet-wallet-api)
- [Connect the wallet :](#connect-the-wallet-)
- [Subscription to events :](#subscription-to-events-)
    - [Subscription :](#subscription-)
      - [accountsChanged :](#accountschanged-)
      - [networkChanged :](#networkchanged-)
    - [Un-subscription :](#un-subscription-)
- [Available commands :](#available-commands-)
  - [wallet\_getPermissions :](#wallet_getpermissions-)
    - [Usage :](#usage-)
    - [Input :](#input-)
    - [Output :](#output-)
    - [Behavior :](#behavior-)
    - [Example :](#example-)
  - [wallet\_requestAccounts :](#wallet_requestaccounts-)
    - [Usage :](#usage--1)
    - [Input :](#input--1)
    - [Output :](#output--1)
    - [Behavior :](#behavior--1)
    - [Example :](#example--1)
  - [wallet\_watchAsset :](#wallet_watchasset-)
    - [Usage :](#usage--2)
    - [Input :](#input--2)
    - [Output :](#output--2)
    - [Behavior :](#behavior--2)
    - [Example :](#example--2)
  - [wallet\_addStarknetChain :](#wallet_addstarknetchain-)
    - [Usage :](#usage--3)
    - [Input :](#input--3)
    - [Output :](#output--3)
    - [Behavior :](#behavior--3)
    - [Example :](#example--3)
  - [wallet\_switchStarknetChain :](#wallet_switchstarknetchain-)
    - [Usage :](#usage--4)
    - [Input :](#input--4)
    - [Output :](#output--4)
    - [Behavior :](#behavior--4)
    - [Example :](#example--4)
  - [wallet\_requestChainId :](#wallet_requestchainid-)
    - [Usage :](#usage--5)
    - [Input :](#input--5)
    - [Output :](#output--5)
    - [Behavior :](#behavior--5)
    - [Example :](#example--5)
  - [wallet\_deploymentData :](#wallet_deploymentdata-)
    - [Usage :](#usage--6)
    - [Input :](#input--6)
    - [Output :](#output--6)
    - [Behavior :](#behavior--6)
    - [Example :](#example--6)
  - [wallet\_addInvokeTransaction :](#wallet_addinvoketransaction-)
    - [Usage :](#usage--7)
    - [Input :](#input--7)
    - [Output :](#output--7)
    - [Behavior :](#behavior--7)
    - [Example :](#example--7)
  - [wallet\_addDeclareTransaction :](#wallet_adddeclaretransaction-)
    - [Usage :](#usage--8)
    - [Input :](#input--8)
    - [Output :](#output--8)
    - [Behavior :](#behavior--8)
    - [Example :](#example--8)
  - [wallet\_signTypedData :](#wallet_signtypeddata-)
    - [Usage :](#usage--9)
    - [Input :](#input--9)
    - [Output :](#output--9)
    - [Behavior :](#behavior--9)
    - [Example :](#example--9)
  - [wallet\_supportedSpecs :](#wallet_supportedspecs-)
    - [Usage :](#usage--10)
    - [Input :](#input--10)
    - [Output :](#output--10)
    - [Behavior :](#behavior--10)
    - [Example :](#example--10)
  - [wallet\_supportedWalletApi :](#wallet_supportedwalletapi-)
    - [Usage :](#usage--11)
    - [Input :](#input--11)
    - [Output :](#output--11)
    - [Behavior :](#behavior--11)
    - [Example :](#example--11)
- [Wallet API version :](#wallet-api-version-)
  - [Example :](#example--12)
  - [Error :](#error-)


# Connect the wallet :
You have first to select which wallet to use.
```typescript
import { StarknetWindowObject, connect } from "get-starknet"; // v4.0.0 mini

const myWallet: StarknetWindowObject = await connect({ modalMode: "alwaysAsk", modalTheme: "light" });
```

You can now use the commands proposed by the wallet (here with Starknet.js v6.8.0 mini) :
```typescript
const myCall: Call = myContract.populate(
  "increase_balance", 
  { amount: 200 });

const myRequest = {
    type: "wallet_addInvokeTransaction",
    params: [myCall],
}
const response = await myWallet.request(myRequest);
```

# Subscription to events :
You can subscribe to 2 events : 
- `accountsChanged` : Triggered each time you change the current account in the wallet.
- `networkChanged` : Triggered each time you change the current network in the wallet.

At each change of network, both account and network events are occurring.  
At each change of account, only the account event is occurring.  

### Subscription :  
#### accountsChanged :
```typescript
const handleAccount: AccountChangeEventHandler = (accounts: string[] | undefined) => {
    if (accounts?.length) {
        const textAddr = accounts[0] // hex string
        setChangedAccount(textAddr); // from a useState
    };
};
myWallet?.on("accountsChanged", handleAccount);
```

#### networkChanged :
```typescript
const handleNetwork: NetworkChangeEventHandler = (chainId?: string, accounts?: string[]) => {
    if (!!chainId) { setRespChangedNetwork(chainId) }; // from a useState
}
myWallet?.on("networkChanged", handleNetwork);
```

### Un-subscription :
Similar to subscription, using `.off` method.
```typescript
wallet.off("accountsChanged", handleAccount);
wallet.off('networkChanged', handleNetwork);
```

# Available commands : 
All these commands can be used with `myWallet.request()` :

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
- If not authorized, the response is an empty array.
### Example :
```typescript
const resp = await myWallet.request(type: "wallet_getPermissions");
// resp = ["accounts"]
```

## wallet_requestAccounts :
### Usage :
Get the account address of the wallet active account. 
### Input :
```typescript
interface RequestAccountsParameters {
  silentMode?: boolean
}
```
### Output :
```typescript
response : string[]
```
### Behavior :
- Returns an array of hex string ; just use the first element.
- Optional silentMode : if true, the wallet will not show the wallet-unlock UI in case of a locked wallet, nor the dApp-approve UI in case of a non-allowed dApp.
### Example :
```typescript
const resp = await myWallet.request(type: "wallet_requestAccounts");
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
}
message: 'An error occurred (NOT_ERC20)';
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
const resp = await myWallet.request(type: "wallet_watchAsset", params: myAsset);
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
  rpc_ urls?: string[]
  block_explorer_urls?: string[]
  native_currency?: {
    type: 'ERC20'; // The asset's interface, e.g. 'ERC20'
    options: {
      address: string // A 0x-prefixed hexadecimal string
      name?: string
      symbol?: string // 2-6 characters long
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
    chainId: shortString.encodeShortString("ZORG"),  
    chainName: "ZORG",
    rpcUrls: ["http://192.168.1.44:6060"],
    nativeCurrency: {
        type: "ERC20",
        options: {
            address: "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
            name: "ETHER",
            symbol: "ETH",
            decimals: 18,
        }
    }
}
const resp = await myWallet.request(type: "wallet_addStarknetChain", params: myChain);
// resp = true
```
 
## wallet_switchStarknetChain :
### Usage :
Change the current network of the wallet. 
### Input :
```typescript
interface SwitchStarknetChainParameters {
  chainId: string // A 0x-prefixed hexadecimal string of an encoded text
}
```
### Output :
```typescript
response : boolean
```
### Behavior :
- The wallet opens a window to ask if you agree to change the current network in the wallet. If you agree, returns `true`. 
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
const resp = await myWallet.request(type: "wallet_switchStarknetChain", params: myChainId);
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
const resp = await myWallet.request(type: "wallet_requestChainId");
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
  code: TBD;
  message: 'An error occurred (ACCOUNT_ALREADY_DEPLOYED)';
}
``` 
### Example :
```typescript
const resp = await myWallet.request(type: "wallet_deploymentData");
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
Send one or several transaction(s) to the network. 
### Input :
```typescript
interface AddInvokeTransactionParameters {
  calls: Call[]
}
type Call = {
  contract_address: string
  entry_point: string
  calldata?: string[]
}
```
### Output :
```typescript
response : interface AddInvokeTransactionResult {
  transaction_hash: string
}
```
### Behavior :
- If the user approved the transaction in the wallet, the response is the transaction hash.
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
const resp = await myWallet.request(type: "wallet_addInvokeTransaction", params: [myCallAPI]);
// resp = {transaction_hash: "0x067f5a62ec72010308cee6368a8488c8df74f1d375b989f96d48cde1c88c7929"}
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
    contract_class_version: string // The version of the contract class object. Currently, the Starknet OS supports version 0.1.0
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
const resp = await myWallet.request(type: "wallet_addDeclareTransaction", params: myParams);
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
const resp = await myWallet.request(type: "wallet_signTypedData", params: myTypedData);
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
const resp = await myWallet.request(type: "wallet_supportedSpecs");
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
const resp = await myWallet.request(type: "wallet_supportedWalletApi");
// resp = ["0.7","0.8"]
```


# Wallet API version :

All entries of this Wallet API have an optional parameter to define the version of API used to create the request. 
## Example :
```typescript
const myParams = {
  api_version: "0.7"
}
const resp = await myWallet.request(type: "wallet_requestChainId", params: myParams);
// resp = "0x534e5f5345504f4c4941"
```
## Error :
In case of version not supported by the Wallet, an Error is returned : 
```typescript
interface API_VERSION_NOT_SUPPORTED {
  code: 162;
  message: 'An error occurred (API_VERSION_NOT_SUPPORTED)';
}
```

