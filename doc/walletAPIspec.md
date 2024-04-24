> version : v1.1.0 xx/xx/2024, in accordance with official spec https://github.com/starkware-libs/starknet-specs/pull/203/files
> version : v1.0.2 08/feb/2024
> version : v1.0.1 07/feb/2024

This temporary document has to be considered as the documentation of the new interface between DAPPS and Starknet browser wallets.

# Connect the wallet :
You have first to select which wallet to use.
```typescript
import { StarknetWindowObject, connect } from "get-starknet";

const myWallet: StarknetWindowObject = await connect({ modalMode: "alwaysAsk", modalTheme: "light" });
```

You can now use the commands proposed by the wallet :
```typescript
const myCalldata = myContractCallData.compile(
  "increase_balance", 
  { amount: 200 });
const myParams: AddInvokeTransactionParameters = {
    calls: [{
        contract_address: contractAddress,
        entrypoint: "increase_balance",
        calldata: myCalldata,
    }]
}
const myRequest = {
    type: "starknet_addInvokeTransaction",
    params: myParams,
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
const handleNetwork: NetworkChangeEventHandler = (chainId?: StarknetChainId, accounts?: string[]) => {
    if (!!chainId) { setRespChangedNetwork(chainId) }; // from a useState
    setTime2(getTime());
}
myWallet?.on("networkChanged", handleNetwork);
```
with :
```typescript
enum StarknetChainId {
  SN_MAIN = "0x534e5f4d41494e",
  SN_GOERLI = "0x534e5f474f45524c49",
  SN_SEPOLIA = "0x534e5f5345504f4c4941",
}
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
- The optional parameters are useless, as they are automatically recovered from the blockchain. Whatever you provide, only the blockchain data are used.
- If the address is not an ERC20, the method fails.
- If the token is already displayed, the result is `true`.
- If there is no ERC20 at this address, fails an error 111 "Asset is not an ERC20".
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
  chainId: string // A 0x-prefixed hexadecimal string
  chainName: string
  rpcUrls?: string[]
  blockExplorerUrls?: string[]
  nativeCurrency?: {
    address: string // A 0x-prefixed hexadecimal string
    name: string
    symbol: string // 2-6 characters long
    decimals: number
  } 
  iconUrls?: string[] 
}
```
### Output :
```typescript
response : boolean
```
### Behavior :
- The wallet opens a window to ask if you agree to add this network in the wallet. If you agree, returns `true`. 
- If something is inconsistent in the input data, the result is `false`.
- If the network is already displayed, the result is `true`.
- If the network is not existing, fails with Error 112 "Network details are incorrect".
- If declined by the user, fails with Error 113 "User refused the operation".

### Example :
```typescript
const myChain: AddStarknetChainParameters = {
    id: "ZORG",
    chainId: shortString.encodeShortString("ZORG"),  
    chainName: "ZORG",
    rpcUrls: ["http://192.168.1.44:6060"],
    nativeCurrency: {
        address: "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
        name: "ETHER",
        symbol: "ETH",
        decimals: 18,
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
- If something is inconsistent in the input data, the result is `false`.
- If the network is already the current one, the result is `true`.
- If the network is not existing, fails with Error 112 "Network details are incorrect".
- If declined by the user, fails with Error 113 "User refused the operation".
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
response : StarknetChainId

enum StarknetChainId {
  SN_MAIN = "0x534e5f4d41494e",
  SN_GOERLI = "0x534e5f474f45524c49",
  SN_SEPOLIA = "0x534e5f5345504f4c4941",
}
```
### Behavior :
- In case of network not listed in `StarknetChainId`, the function throw an Error TBD.
### Example :
```typescript
const resp = await myWallet.request(type: "wallet_requestChainId");
// resp = "0x534e5f5345504f4c4941"
```

## wallet_deploymentData :
### Usage :
Request from the current wallet the data required to deploy the account at the current address. 
### Input :
No parameters.
### Output :
```typescript
response : interface GetDeploymentDataResult {
  address: FELT // the expected address, used to double-check the returned data
  class_hash: FELT // The class hash of the contract to deploy
  salt: FELT // The salt used for the computation of the account address
  calldata: FELT[] // An array of felts
  sigdata?: FELT[] // An optional array of felts to be added in the signature
  version: 0 | 1 // Cairo version (an integer)
}
```
### Behavior :
Provides the necessary data to create an account proposed by the wallet.
### Example :
```typescript
const resp = await myWallet.request(type: "wallet_deploymentData");
// resp = TBD
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
  contract_address: FELT
  entrypoint: string
  calldata?: FELT[]
}
```
### Output :
```typescript
response : interface AddInvokeTransactionResult {
  transaction_hash: FELT
}
```
### Behavior :
- If the user approved the transaction in the wallet, the response is the transaction hash.
- If an error occurred in the network, fails with Error 163 "An unexpected error occurred".
- If declined by the user, fails with Error 113 "User refused the operation".

### Example :
```typescript
const contractAddress = "0x697d3bc2e38d57752c28be0432771f4312d070174ae54eef67dd29e4afb174";
const contractCallData = new CallData(test1Abi);
const funcName = "increase_balance";
const myCalldata = contractCallData.compile(funcName, {
    amount: 200
});
const myParams: AddInvokeTransactionParameters = {
    calls: [{
        contract_address: contractAddress,
        entrypoint: funcName,
        calldata: myCalldata
    }]
}
const resp = await myWallet.request(type: "wallet_addInvokeTransaction", params: myParams);
// resp = {transaction_hash: "0x067f5a62ec72010308cee6368a8488c8df74f1d375b989f96d48cde1c88c7929"}
```

## wallet_addDeclareTransaction :
### Usage :
Declare a new class in the current network. 
### Input :
```typescript
interface AddDeclareTransactionParameters {
  compiled_class_hash: FELT // The hash of the Cairo assembly resulting from the Sierra compilation
  contract_class: {
    sierra_program: FELT[] // The list of Sierra instructions of which the program consists
    contract_class_version: string // The version of the contract class object. Currently, the Starknet OS supports version 0.1.0
    entry_points_by_type: { // Entry points by type
      CONSTRUCTOR: SIERRA_ENTRY_POINT[]
      EXTERNAL: SIERRA_ENTRY_POINT[]
      L1_HANDLER: SIERRA_ENTRY_POINT[]
    }
    abi?: string // The stringified class ABI, as supplied by the user declaring the class
  }
}
```
### Output :
```typescript
response : interface AddDeclareTransactionResult {
  transaction_hash: FELT // The hash of the declare transaction
  class_hash: FELT // The hash of the declared class
}
```
### Behavior :
- If the user approved the declaration in the wallet, the response type is `AddDeclareTransactionResult`.
- If the user approved the declaration in the wallet, and if the class is already declared, the function throw an error TBD.
- If an error occurred in the network, fails with Error 163 "An unexpected error occurred".
- If declined by the user, fails with Error 113 "User refused the operation".

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

## wallet_addDeployAccountTransaction (DEPRECATED?):
### Usage :
Deploy a new account in the current network. It's not linked to the type of accounts provided by the wallet ; you have to define which class to use.
### Input :
```typescript
interface AddDeployAccountTransactionParameters {
  contract_address_salt: FELT // The salt for the address of the deployed contract
  constructor_calldata: FELT[] // The parameters passed to the constructor
  class_hash: FELT // The hash of the deployed contract's class
}
```
### Output :
```typescript
response : interface AddDeployAccountTransactionResult {
  transaction_hash: FELT // The hash of the deploy transaction
  contract_address: FELT // The address of the new contract
}
```
### Behavior :
- If the user approved the deployment of account in the wallet, the response type is `AddDeployAccountTransactionResult`.
- If an error occurred in the network, fails with Error 163 "An unexpected error occurred".
- If declined by the user, fails with Error 113 "User refused the operation".
- The account address do not needs to be pre-funded. The current account in wallet will pay the deployment fees.
- The address of deployment can NOT be pre-calculated. 
Ex :  
``` typescript 
const decClassHash = "0x2bfd9564754d9b4a326da62b2f22b8fea7bbeffd62da4fcaea986c323b7aeb"; // OZ cairo v2.1.0
const starkKeyPub = "0x03cb804773b6a237db952b1d4b651a90ee08651fbe74b5b05f8fabb2529acb45";
// calculate address
const OZaccountConstructorCallData = CallData.compile([starkKeyPub]);
const OZcontractAddress = hash.calculateContractAddressFromHash(starkKeyPub, decClassHash, OZaccountConstructorCallData, 0);
```
Expected address is `0x360ccaecfd9fb321de0b70da56bc9b96510b75a6ee21e8e9b547f4710ad007f` 
### Example :
```typescript
 const decClassHash = "0x2bfd9564754d9b4a326da62b2f22b8fea7bbeffd62da4fcaea986c323b7aeb"; // OZ cairo v2.1.0
const privateKey = stark.randomAddress();
const starkKeyPub = ec.starkCurve.getStarkKey(privateKey);
const OZaccountConstructorCallData = CallData.compile([starkKeyPub]);
const myParams: AddDeployAccountTransactionParameters = {
    class_hash: decClassHash,
    contract_address_salt: starkKeyPub,
    constructor_calldata: OZaccountConstructorCallData,
}
const resp = await myWallet.request(type: "wallet_addDeployAccountTransaction", params: myParams);
// resp = {transaction_hash: "0x067f5a62ec72010308cee6368a8488c8df74f1d375b989f96d48cde1c88c7929", contract_address: "0x360ccaecfd9fb321de0b70da56bc9b96510b75a6ee21e8e9b547f4710ad007f"}
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
    | StarknetMerkleType
type StarknetMerkleType = {
  name: string
  type: "merkletree"
  contains: string
}
interface StarknetDomain extends Record<string, unknown> {
  name?: string
  version?: string
  chainId?: string | number
}
```
### Output :
```typescript
response : string[] // Signature. Standard signature is 2 felts.
```
### Behavior :
- If the user accepted to sign, the response type is the signature.
- If an error occurred in the network, fails with Error 163 "An unexpected error occurred".
- If declined by the user, fails with Error 113 "User refused the operation".
### Example :
```typescript
const myTypedData: TypedData = {
      types: {
          StarkNetDomain: [
              { name: "name", type: "string" },
              { name: "version", type: "felt" },
              { name: "chainId", type: "felt" },
          ],
          Airdrop: [
              { name: "address", type: "felt" },
              { name: "amount", type: "felt" }
          ],
          Validate: [
              { name: "id", type: "felt" },
              { name: "from", type: "felt" },
              { name: "amount", type: "felt" },
              { name: "nameGamer", type: "string" },
              { name: "endDate", type: "felt" },
              { name: "itemsAuthorized", type: "felt*" }, // array of felt
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

## starknet_supportedSpecs :
### Usage :
Returns a list of rpc spec versions compatible with the wallet. 
### Input :
No parameters.
### Output :
```typescript
response : string[]
```
### Behavior :
- The response is an array of strings. Each string is the version of a supported starknet API version. Includes only the 2 main digits ; example : `0.5` 
### Example :
```typescript
const resp = await myWallet.request(type: "starknet_supportedSpecs");
// resp = ["0.4","0.5"]
``