# Test report for Braavos wallet 3.77.2 (Linux/Chrome, testnet)

Use of test DAPP https://starknet-wallet-account.vercel.app/ 
Tests of conformity to get-starknet v4.0.3 (wallet spec 0.7).

|Wallet locked|DAPP ||
|---|---|--|
||Not connected|Connected|
|No|1|2|
|yes|3|4|
<br>

- Event networkChanged : ✅
- Event accountsChanged: ✅

|                    Function                    |                   wallet locked + not connected (case 3)                   |           Once unlocked + not connected (case 1) |                                           Once unlocked and connected (case 2) | Wallet locked + not connected (case 4)|
| :--------------------------------------------: | :------------------------------------------------: | :------------------------------------------------: | :-------------------------------------------------------------------------------------------------------------: | :--:|
|             wallet_getPermissions              |     expected: silent return []<br>Braavos: ✅      |     expected: silent return []<br>Braavos: ✅      |                                expected: silent return ["accounts"] <br>Braavos: ✅                                |
| wallet_requestAccounts <br> silentMode : true  |     expected: silent return []<br>Braavos: ❌ Error: Cannot read properties of undefined (reading 'toString')      |     expected: silent return []<br>Braavos: ❌ Error: Cannot read properties of undefined (reading 'toString')      |                                  expected: silent return [address]<br>Braavos: ✅                                  |
| wallet_requestAccounts <br> silentMode : false |          expected: Unlock UI<br>Braavos: ✅           |       expected: DAPP connect UI<br>Braavos: ✅        |                                  expected: silent return [address]<br>Braavos: ✅                                  |
|               wallet_watchAsset                |          expected: Unlock UI<br>Braavos: ❌ response: False           |       expected: DAPP connect UI<br>Braavos: ❌ response: False        |              expected: UI proposing a new token<br>Braavos:  ✅             |
|            wallet_addStarknetChain             |          expected: Unlock UI<br>Braavos: ❌ response: False           |       expected: DAPP connect UI<br>Braavos: ❌ response: False        |    expected: UI proposing a new chain<br>Braavos: ❌ Error: Unsupported dApp request wallet_addStarknetChain    |
|           wallet_switchStarknetChain           |          expected: Unlock UI<br>Braavos: ❌ Error: Unsupported dApp request wallet_switchStarknetChain          |       expected: DAPP connect UI<br>Braavos: ❌ Error: Unsupported dApp request wallet_switchStarknetChain        |      expected: UI proposing to change chain<br>Braavos: ❌ Error: Unsupported dApp request wallet_switchStarknetChain      |
|             wallet_requestChainId              |  expected: silent return a string<br>Braavos: 🔶 returns: null   |  expected: silent return a string<br>Braavos: 🔶 returns: null   |                                  expected: silent return a string<br>Braavos: ✅                                   |
|             wallet_deploymentData              | expected: silent return of an error<br>Braavos: 🔶 returns: null | expected: silent return of an error<br>Braavos: 🔶 returns: null |                expected: silent return an object or an error<br>Braavos: 🔶 OK if account not deployed, but when already deployed, returns null instead of error 115.                 |
|          wallet_addInvokeTransaction           |          expected: Unlock UI<br>Braavos: ❌ Error: execute failed           |       expected: DAPP connect UI<br>Braavos: ❌ Error: execute failed        |                                    expected: UI for transaction<br>Braavos: ✅                                     |
|          wallet_addDeclareTransaction          |          expected: Unlock UI<br>Braavos: ❌ Error: execute failed           |       expected: DAPP connect UI<br>Braavos: ❌ Error: execute failed        |                      expected: UI for class declaration<br>Braavos: ✅                       |
|              wallet_signTypedData              |          expected: Unlock UI<br>Braavos: ❌ Error: signature failed           |       expected: DAPP connect UI<br>Braavos: ❌ Error: signature failed        | expected: UI for message signature<br>Braavos: ✅ |
|             wallet_supportedSpecs              |  expected: silent return [string]<br>Braavos: 🔶 returns: null   |  expected: silent return [string]<br>Braavos: 🔶 returns: null   |                expected: silent return [string]<br>Braavos: 🔶 response is ["0.4,"0.5","0.6"]. Shouldn't be at least "0.7" returned?                |
|           wallet_supportedWalletApi            |  expected: silent return [string]<br>Braavos: 🔶 returns: null   |  expected: silent return [string]<br>Braavos: 🔶 returns: null   |               expected: silent return [string] <br>Braavos: 🔶 response is ["0.4,"0.5","0.6"]. Should be ["0.7"] as it's the only one version existing today                |

