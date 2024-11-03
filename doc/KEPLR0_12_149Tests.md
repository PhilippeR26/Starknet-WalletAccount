# Test report for KEPLR wallet 0.12.149 (windows 10/Chrome, testnet)

Use of test DAPP https://starknet-wallet-account.vercel.app/ 

- Event networkChanged : ✅
- Event accountsChanged: 🔶 (not applicable as the wallet can handle only one account).

|                    Function                    |                   wallet locked                    |           Once unlocked + not connected            |                                           once unlocked and connected                                           |
| :--------------------------------------------: | :------------------------------------------------: | :------------------------------------------------: | :-------------------------------------------------------------------------------------------------------------: |
|             wallet_getPermissions              |     expected: silent return []<br>KEPLR: ❌(1)      |     expected: silent return []<br>KEPLR: ❌(1)      |                                expected: silent return ["accounts"] <br>KEPLR: ✅                                |
| wallet_requestAccounts <br> silentMode : true  |     expected: silent return []<br>KEPLR: ❌(1)      |     expected: silent return []<br>KEPLR: ❌(1)      |                                  expected: silent return [address]<br>KEPLR: ✅                                  |
| wallet_requestAccounts <br> silentMode : false |          expected: Unlock UI<br>KEPLR: ✅           |       expected: DAPP connect UI<br>KEPLR: ✅        |                                  expected: silent return [address]<br>KEPLR: ✅                                  |
|               wallet_watchAsset                |          expected: Unlock UI<br>KEPLR: ✅           |       expected: DAPP connect UI<br>KEPLR: ✅        |              expected: UI proposing a new token<br>KEPLR: ❌ response: false (in Mainnet & Testnet)              |
|            wallet_addStarknetChain             |          expected: Unlock UI<br>KEPLR: ✅           |       expected: DAPP connect UI<br>KEPLR: ✅        |    expected: UI proposing a new chain<br>KEPLR: ❌ Error: the type 'wallet_addStarknetChain' is not supported    |
|           wallet_switchStarknetChain           |          expected: Unlock UI<br>KEPLR: ✅           |       expected: DAPP connect UI<br>KEPLR: ✅        |      expected: UI proposing to change chain<br>KEPLR: ❌ Error: invalid parameters: must provide a chain id      |
|             wallet_requestChainId              |  expected: silent return a string<br>KEPLR: ❌(1)   |  expected: silent return a string<br>KEPLR: ❌(1)   |                                  expected: silent return a string<br>KEPLR: ✅                                   |
|             wallet_deploymentData              | expected: silent return of an error<br>KEPLR: ❌(1) | expected: silent return of an error<br>KEPLR: ❌(1) |                expected: silent return an object or an error<br>KEPLR: ❌ Error: Not implemented                 |
|          wallet_addInvokeTransaction           |          expected: Unlock UI<br>KEPLR: ✅           |       expected: DAPP connect UI<br>KEPLR: ✅        |                                    expected: UI for transaction<br>KEPLR: ✅                                     |
|          wallet_addDeclareTransaction          |          expected: Unlock UI<br>KEPLR: ✅           |       expected: DAPP connect UI<br>KEPLR: ✅        |                      expected: UI for class declaration<br>KEPLR: ❌ Error: Not implemented                      |
|              wallet_signTypedData              |          expected: Unlock UI<br>KEPLR: ✅           |       expected: DAPP connect UI<br>KEPLR: ✅        | expected: UI for message signature<br>KEPLR: ❌ Error: this function is not yet allowed for the external message |
|             wallet_supportedSpecs              |  expected: silent return [string]<br>KEPLR: ❌(1)   |  expected: silent return [string]<br>KEPLR: ❌(1)   |                expected: silent return [string]<br>KEPLR: 🔶 response is "0.7.1" instead of "0.7"                |
|           wallet_supportedWalletApi            |  expected: silent return [string]<br>KEPLR: ❌(1)   |  expected: silent return [string]<br>KEPLR: ❌(1)   |               expected: silent return [string] <br>KEPLR: 🔶 response is "0.7.1" instead of "0.7"                |

> (1) : Do not send a silent response as expected. Request is memorized ;  UI for unlock/connect is shown. Processed after unlock/connect.