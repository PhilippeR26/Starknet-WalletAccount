# Test report for ArgentX wallet 5.20.5 (Linux/Chrome, testnet)

Use of test DAPP https://starknet-wallet-account.vercel.app/  
Tests of conformity to get-starknet v4.0.4 (wallet spec 0.7).

- Event networkChanged : ✅
- Event accountsChanged: ✅

|Wallet |DAPP ||
|---:|:---:|:--:|
||**Not connected**|**Connected**|
|**Unlocked**|1|2|
|**Locked**|3|4|
<br>

| Function  |  wallet locked + not connected <br> (case 3) | Once unlocked + not connected <br> (case 1) |Once unlocked and connected <br> (case 2) | Connected + Wallet locked <br> (case 4)|
| :--------------------------------------------: | :------------------------------------------------: | :------------------------------------------------: | :-------------------------------: | :--:|
|             wallet_getPermissions              |     expected: silent return []<br>ArgentX: ✅      |     expected: silent return []<br>ArgentX: ✅      |    expected: silent return ["accounts"] <br>ArgentX: ✅   | expected: silent return []<br>ArgentX: ✅   |
| wallet_requestAccounts <br> silentMode : true  |  expected: silent return []<br>ArgentX: ❌ Error: User aborted  |     expected: silent return []<br>ArgentX: ❌ Error: User aborted  |   expected: silent return [address]<br>ArgentX: ✅   |  expected: silent return []<br>ArgentX: ❌ Error: User aborted  |
| wallet_requestAccounts <br> silentMode : false |   expected: Unlock UI<br>ArgentX: ✅    |    expected: DAPP connect UI<br>ArgentX: ✅  |    expected: silent return [address]<br>ArgentX: ✅  | expected: Unlock UI<br>ArgentX: ✅  | expected: Unlock UI<br>ArgentX: ✅  |
|               wallet_watchAsset                |   expected: Unlock UI<br>ArgentX: ❌ Error: Timeout  | expected: DAPP connect UI<br>ArgentX: ❌ Error: Timeout  | expected: UI proposing a new token<br>ArgentX:  ✅  |  expected: Unlock UI<br>ArgentX: ❌ Error: Timeout  |
|            wallet_addStarknetChain             | expected: Unlock UI<br>ArgentX: ❌ Error: Timeout  |  expected: DAPP connect UI<br>ArgentX: ❌ Error: Timeout  | expected: UI proposing a new chain<br>ArgentX: ✅  |  expected: Unlock UI<br>ArgentX: ❌ Error: Timeout  |
|           wallet_switchStarknetChain           |  expected: Unlock UI<br>ArgentX: ❌ Error: Timeout  | expected: DAPP connect UI<br>ArgentX: ❌ Error: Timeout  |  expected: UI proposing to change chain<br>ArgentX: ✅   |  expected: Unlock UI<br>ArgentX: ❌ Error: Timeout  |
|             wallet_requestChainId              |  expected: silent return a string<br>ArgentX: ❌ Error: Not preauthorized   |  expected: silent return a string<br>ArgentX: ❌ Error: Not preauthorized   |  expected: silent return a string<br>ArgentX: ✅  |  expected: silent return a string<br>ArgentX: ❌ Error: Not preauthorized   |
|             wallet_deploymentData              | expected: silent return of an error<br>ArgentX: ✅ | expected: silent return of an error<br>ArgentX: ✅ | expected: silent return an object or an error<br>ArgentX: ✅  | expected: silent return of an error<br>ArgentX: ✅ |
|          wallet_addInvokeTransaction           | expected: Unlock UI<br>ArgentX: ❌ Error: Timeout | expected: DAPP connect UI<br>ArgentX: ❌ Error: Timeout failed | expected: UI for transaction<br>ArgentX: ✅ | expected: Unlock UI<br>ArgentX: ❌ Error: Timeout |
|          wallet_addDeclareTransaction          | expected: Unlock UI<br>ArgentX: ❌ Error: Timeout  |  expected: DAPP connect UI<br>ArgentX: ❌ Error: Timeout | expected: UI for class declaration<br>ArgentX: ✅   | expected: Unlock UI<br>ArgentX: ❌ Error: Timeout  |
|              wallet_signTypedData              |  expected: Unlock UI<br>ArgentX: ❌ Error: Timeout | expected: DAPP connect UI<br>ArgentX: ❌ Error: Timeout | expected: UI for message signature<br>ArgentX: 🔶 do not process if the account is not deployed | expected: Unlock UI<br>ArgentX: ❌ Error: Timeout |
|             wallet_supportedSpecs              |  expected: silent return [string]<br>ArgentX: 🔶 response is ["0.7.1"] instead of ["0.7"]  |  expected: silent return [string]<br>ArgentX: 🔶 response is ["0.7.1"] instead of ["0.7"]   |   expected: silent return [string]<br>ArgentX: 🔶 response is ["0.7.1"] instead of ["0.7"]   |  expected: silent return [string]<br>ArgentX: 🔶 response is ["0.7.1"] instead of ["0.7"]  |
|           wallet_supportedWalletApi            |  expected: silent return [string]<br>ArgentX: 🔶 response is ["0.7.1"] instead of ["0.7"]   |  expected: silent return [string]<br>ArgentX: 🔶 response is ["0.7.1"] instead of ["0.7"]   |  expected: silent return [string] <br>ArgentX: 🔶 response is ["0.7.1"] instead of ["0.7"] |  expected: silent return [string]<br>ArgentX: 🔶 response is ["0.7.1"] instead of ["0.7"]  |

