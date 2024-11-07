# Test report for Metamask v12.5.1 + Snap v2.11.0 wallet (Linux/Chrome, testnet)

Use of test DAPP https://starknet-wallet-account.vercel.app/ (commit 0x47145... of 06/nov/2024)
Tests of conformity to get-starknet v4.0.3 (wallet spec 0.7).

Once MetaMask unlocked, the Snap account is automatically connect to the DAPP (MM connection to DAPP management is not effective with Starknet Snap).

- Event networkChanged : ❌ Not implemented
- Event accountsChanged: ❌ Not implemented (only one account per chain)

|                    Function                    |               wallet locked + not connected                |            Once unlocked + not connected            |                                  once unlocked and connected                                  |
| :--------------------------------------------: | :--------------------------------------------------------: | :-------------------------------------------------: | :-------------------------------------------------------------------------------------------: |
|             wallet_getPermissions              |        expected: silent return []<br>MM Snap: ❌(1)         |     expected: silent return []<br>MM Snap: N/A      |                      expected: silent return ["accounts"] <br>MM Snap: ✅                      |
| wallet_requestAccounts <br> silentMode : true  |        expected: silent return []<br>MM Snap: ❌(1)         |     expected: silent return []<br>MM Snap: N/A      |                        expected: silent return [address]<br>MM Snap: ✅                        |
| wallet_requestAccounts <br> silentMode : false |             expected: Unlock UI<br>MM Snap: ✅              |      expected: DAPP connect UI<br>MM Snap: N/A      |                        expected: silent return [address]<br>MM Snap: ✅                        |
|               wallet_watchAsset                |             expected: Unlock UI<br>MM Snap: ✅              |      expected: DAPP connect UI<br>MM Snap: N/A      |                       expected: UI proposing a new token<br>MM Snap:  ✅                       |
|            wallet_addStarknetChain             | expected: Unlock UI<br>MM Snap: ❌ Error 163: Not supported |      expected: DAPP connect UI<br>MM Snap: N/A      |           expected: UI proposing a new chain<br>MM Snap: ❌ Error 163: Not supported           |
|           wallet_switchStarknetChain           |             expected: Unlock UI<br>MM Snap: ✅              |      expected: DAPP connect UI<br>MM Snap: N/A      |                     expected: UI proposing to change chain<br>MM Snap: ✅                      |
|             wallet_requestChainId              |     expected: silent return a string<br>MM Snap: ❌(1)      |  expected: silent return a string<br>MM Snap: N/A   |                        expected: silent return a string<br>MM Snap: ✅                         |
|             wallet_deploymentData              |    expected: silent return of an error<br>MM Snap: ❌(1)    | expected: silent return of an error<br>MM Snap: N/A |         expected: silent return an object or an error<br>MM Snap: ✅ always Error 115          |
|          wallet_addInvokeTransaction           |             expected: Unlock UI<br>MM Snap: ✅              |      expected: DAPP connect UI<br>MM Snap: N/A      |                          expected: UI for transaction<br>MM Snap: ✅                           |
|          wallet_addDeclareTransaction          |             expected: Unlock UI<br>MM Snap: ✅              |      expected: DAPP connect UI<br>MM Snap: N/A      |                       expected: UI for class declaration<br>MM Snap: ✅                        |
|              wallet_signTypedData              |             expected: Unlock UI<br>MM Snap: ✅              |      expected: DAPP connect UI<br>MM Snap: N/A      | expected: UI for message signature<br>MM Snap: 🔶 quality of display is not conform to EIP 712 |
|             wallet_supportedSpecs              |       expected: silent return [string]<br>MM Snap: ✅       |  expected: silent return [string]<br>MM Snap: N/A   |                        expected: silent return [string]<br>MM Snap: ✅                         |
|           wallet_supportedWalletApi            |       expected: silent return [string]<br>MM Snap: ✅       |  expected: silent return [string]<br>MM Snap: N/A   |                        expected: silent return [string] <br>MM Snap: ✅                        |

> (1) : Do not send a silent response as expected. Request is memorized ;  unlock UI is shown. Processed after unlock.

> [!NOTE]
> Metamask is slow to react to requests. Delay of 1-5 sec. is common.

> [!IMPORTANT]
> Snap is not able to process immediately after discovery. A specific code has to be executed before using the API. This code is present in get-starknet v4.0.3 `connect`, but is not exportable for a custom wallet selection UI.