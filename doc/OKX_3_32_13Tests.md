# Test report for OKX wallet 3.32.13 (Linux/Chrome, testnet)

Use of test DAPP https://starknet-wallet-account.vercel.app/  
Tests of conformity to get-starknet v4.0.4. (wallet spec 0.7).

- Event networkChanged : 🔶 (not applicable as the wallet can handle only Mainnet)
- Event accountsChanged: ✅.

Wallet |DAPP ||
|---:|:---:|:--:|
||**Not connected**|**Connected**|
|**Unlocked**|1|2|
|**Locked**|3|4|
<br>

| Function  |  wallet locked + not connected <br> (case 3) | Once unlocked + not connected <br> (case 1) |Once unlocked and connected <br> (case 2) | Connected + Wallet locked <br> (case 4)|
| :--------------------------------------------: | :------------------------------------------------: | :------------------------------------------------: | :---------------------------------: |:--:|
|wallet_getPermissions|expected: silent return []<br>OKX: ❌ ["account"] | expected: silent return []<br>OKX: ❌ ["account"] |expected: silent return ["accounts"] <br>OKX: ✅|expected: silent return []<br>OKX: ❌ ["account"] |
|wallet_requestAccounts <br> silentMode : true | expected: silent return []<br>OKX: ❌ [address] |expected: silent return []<br>OKX: ❌ [address] |expected: silent return [address]<br>OKX: ✅ | expected: silent return []<br>OKX: ❌ [address] 
| wallet_requestAccounts <br> silentMode : false |  expected: Unlock UI<br>OKX: ❌ [address] |expected: Unlock UI<br>OKX: ❌ [address] | expected: DAPP connect UI<br>OKX: ✅ | expected: Unlock UI<br>OKX: ❌ [address] |
|wallet_watchAsset|expected: Unlock UI<br>OKX: ❌ Error Not implemented|expected: DAPP connect UI<br>OKX: ❌ Error Not implemented|expected: UI proposing a new token<br>OKX: ❌ Error Not implemented| expected: Unlock UI<br>OKX: ❌ Error Not implemented|
|wallet_addStarknetChain| expected: Unlock UI<br>OKX: ❌ Error Not implemented| expected: DAPP connect UI<br>OKX: ❌ Error Not implemented| expected: UI proposing a new chain<br>OKX: ❌ Error Not implemented|expected: Unlock UI<br>OKX: ❌ Error Not implemented|
|wallet_switchStarknetChain| expected: Unlock UI<br>OKX: ❌ Error Not implemented| expected: DAPP connect UI<br>OKX: ❌ Error Not implemented| expected: UI proposing to change chain<br>OKX: ❌ Error Not implemented| expected: Unlock UI<br>OKX: ❌ Error Not implemented|
|wallet_requestChainId| expected: silent return a string<br>OKX: ✅|   expected: silent return a string<br>OKX: ✅| expected: silent return a string<br>OKX: ✅  |expected: silent return a string<br>OKX: ✅ |
|wallet_deploymentData|  expected: silent return of an error<br>OKX: ✅| expected: silent return of an error<br>OKX: ✅| expected: silent return an object or an error<br>OKX: ❌ Error Not implemented | expected: silent return of an error<br>OKX: ✅|
|wallet_addInvokeTransaction| expected: Unlock UI<br>OKX: ✅ | expected: DAPP connect UI<br>OKX: ❌ Error:4100 = The requested method and/or account has not been authorized by the user| expected: UI for transaction<br>OKX: ✅ | expected: Unlock UI<br>OKX: ✅ |
|wallet_addDeclareTransaction| expected: Unlock UI<br>OKX: ✅ | expected: DAPP connect UI<br>OKX: ❌ Error 4100 = The requested method and/or account has not been authorized by the user| expected: UI for class declaration<br>OKX: ❌ Error: Not implemented| expected: Unlock UI<br>OKX: ✅ |
|wallet_signTypedData| expected: Unlock UI<br>OKX: ✅ | expected: DAPP connect UI<br>OKX: ❌ Error 4100 = The requested method and/or account has not been authorized by the user| expected: UI for message signature<br>OKX: 🔶 quality of display is not conform to EIP 712 | expected: Unlock UI<br>OKX: ✅ |
|wallet_supportedSpecs|  expected: silent return [string]<br>OKX: 🔶 response is "0.7.0" instead of "0.7"|  expected: silent return [string]<br>OKX: 🔶 response is "0.7.0" instead of "0.7"|expected: silent return [string]<br>OKX: 🔶 response is "0.7.0" instead of "0.7"| expected: silent return [string]<br>OKX: 🔶 response is "0.7.0" instead of "0.7"|
|wallet_supportedWalletApi|expected: silent return [string]<br>OKX: 🔶 response is "0.7.0" instead of "0.7" |  expected: silent return [string]<br>OKX: 🔶 response is "0.7.0" instead of "0.7"|expected: silent return [string] <br>OKX: 🔶 response is "0.7.0" instead of "0.7"| expected: silent return [string]<br>OKX: 🔶 response is "0.7.0" instead of "0.7"|

