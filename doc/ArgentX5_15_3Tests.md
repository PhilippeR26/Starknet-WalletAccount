# Test report for ArgentX wallet 5.15.3 (Linux/Chrome, testnet)

Use of test DAPP https://starknet-wallet-account.vercel.app/ 
Tests of conformity to get-starknet v4 (wallet spec 0.7).

- Event networkChanged : ✅
- Event accountsChanged: ✅

|                    Function                    |                   wallet locked + not connected                    |           Once unlocked + not connected            |                                           once unlocked and connected                                           |
| :--------------------------------------------: | :------------------------------------------------: | :------------------------------------------------: | :-------------------------------------------------------------------------------------------------------------: |
|             wallet_getPermissions              |     expected: silent return []<br>ArgentX: ✅      |     expected: silent return []<br>ArgentX: ✅      |                                expected: silent return ["accounts"] <br>ArgentX: ✅                                |
| wallet_requestAccounts <br> silentMode : true  |     expected: silent return []<br>ArgentX: ❌ Error: User aborted      |     expected: silent return []<br>ArgentX: ❌ Error: User aborted      |                                  expected: silent return [address]<br>ArgentX: ✅                                  |
| wallet_requestAccounts <br> silentMode : false |          expected: Unlock UI<br>ArgentX: ✅           |       expected: DAPP connect UI<br>ArgentX: ✅        |                                  expected: silent return [address]<br>ArgentX: ✅                                  |
|               wallet_watchAsset                |          expected: Unlock UI<br>ArgentX: ❌ Error: Timeout           |       expected: DAPP connect UI<br>ArgentX: ❌ Error: Timeout        |              expected: UI proposing a new token<br>ArgentX:  ✅             |
|            wallet_addStarknetChain             |          expected: Unlock UI<br>ArgentX: ❌ Error: Timeout           |       expected: DAPP connect UI<br>ArgentX: ❌ Error: Timeout        |    expected: UI proposing a new chain<br>ArgentX: ✅    |
|           wallet_switchStarknetChain           |          expected: Unlock UI<br>ArgentX: ❌ Error: Timeout          |       expected: DAPP connect UI<br>ArgentX: ❌ Error: Timeout        |      expected: UI proposing to change chain<br>ArgentX: ✅      |
|             wallet_requestChainId              |  expected: silent return a string<br>ArgentX: ❌ Error: Not preauthorized   |  expected: silent return a string<br>ArgentX: ❌ Error: Not preauthorized   |                                  expected: silent return a string<br>ArgentX: ✅                                   |
|             wallet_deploymentData              | expected: silent return of an error<br>ArgentX: ✅ | expected: silent return of an error<br>ArgentX: ✅ |                expected: silent return an object or an error<br>ArgentX: ✅        |
|          wallet_addInvokeTransaction           |          expected: Unlock UI<br>ArgentX: ❌ Error: Timeout           |       expected: DAPP connect UI<br>ArgentX: ❌ Error: Timeout failed        |                                    expected: UI for transaction<br>ArgentX: ✅                                     |
|          wallet_addDeclareTransaction          |          expected: Unlock UI<br>ArgentX: ❌ Error: Timeout           |       expected: DAPP connect UI<br>ArgentX: ❌ Error: Timeout        |                      expected: UI for class declaration<br>ArgentX: ✅                       |
|              wallet_signTypedData              |          expected: Unlock UI<br>ArgentX: ❌ Error: Timeout           |       expected: DAPP connect UI<br>ArgentX: ❌ Error: Timeout        | expected: UI for message signature<br>ArgentX: 🔶 do not process if the account is not deployed |
|             wallet_supportedSpecs              |  expected: silent return [string]<br>ArgentX: 🔶 response is ["0.7.1"] instead of ["0.7"]  |  expected: silent return [string]<br>ArgentX: 🔶 response is ["0.7.1"] instead of ["0.7"]   |                expected: silent return [string]<br>ArgentX: 🔶 response is ["0.7.1"] instead of ["0.7"]               |
|           wallet_supportedWalletApi            |  expected: silent return [string]<br>ArgentX: 🔶 response is ["0.7.1"] instead of ["0.7"]   |  expected: silent return [string]<br>ArgentX: 🔶 response is ["0.7.1"] instead of ["0.7"]   |               expected: silent return [string] <br>ArgentX: 🔶 response is ["0.7.1"] instead of ["0.7"]                |

