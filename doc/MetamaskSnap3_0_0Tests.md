# Test report for Metamask v12.8.0 + Snap v3.0.0 wallet (Linux/Chrome, testnet)

Use of test DAPP https://starknet-wallet-account.vercel.app/   
Tests of conformity to get-starknet v4.0.4 (wallet spec 0.7).

Once MetaMask unlocked, the Snap account is automatically connected to the DAPP (no DAPP connection management in Starknet Snap).

- Event networkChanged : ❌ Not implemented
- Event accountsChanged: ❌ Not implemented (only one account per chain)

|                    Function                    |               Wallet locked + not connected                |            Once unlocked + not connected  |  Once unlocked and connected | Connected & locked |
| :--------------------------------------------: | :--------------------------------------------------------: | :-------------------------------------------------: | :-------------------------------------------------------------------------------------------: | :--:|
|             wallet_getPermissions              |        expected: silent return []<br>MM Snap: ❌ N/A   |   expected: silent return []<br>MM Snap: ❌ N/A  | expected: silent return ["accounts"] <br>MM Snap: ✅ | expected: silent return []<br>MM Snap: ❌ ["accounts"] |
| wallet_requestAccounts <br> silentMode : true  |  expected: silent return []<br>MM Snap: ❌ N/A  | expected: silent return []<br>MM Snap: ❌ N/A | expected: silent return [address]<br>MM Snap: ✅ | expected: silent return []<br>MM Snap: ❌ Unlock UI  
| wallet_requestAccounts <br> silentMode : false |             expected: Unlock UI<br>MM Snap: ❌ N/A | expected: DAPP connect UI<br>MM Snap: ❌ N/A | expected: silent return [address]<br>MM Snap: ✅  | expected: Unlock UI<br>MM Snap: ✅ |
|               wallet_watchAsset                | expected: Unlock UI<br>MM Snap: ❌ N/A  |  expected: DAPP connect UI<br>MM Snap: ❌ N/A |  expected: UI proposing a new token<br>MM Snap:  ✅ |expected: Unlock UI<br>MM Snap: ✅ |
|            wallet_addStarknetChain             | expected: Unlock UI<br>MM Snap: ❌ N/A |  expected: DAPP connect UI<br>MM Snap: ❌ N/A | expected: UI proposing a new chain<br>MM Snap: ❌ Error 163: Not supported |expected: Unlock UI<br>MM Snap: ❌ Error 163: Not supported |
|           wallet_switchStarknetChain           | expected: Unlock UI<br>MM Snap:  ❌ N/A  | expected: DAPP connect UI<br>MM Snap: ❌ N/A | expected: UI proposing to change chain<br>MM Snap: ✅ | expected: Unlock UI<br>MM Snap: ✅  |
|             wallet_requestChainId              | expected: silent return a string<br>MM Snap: ❌ N/A |  expected: silent return a string<br>MM Snap: ❌ N/A   | expected: silent return a string<br>MM Snap: ✅ | expected: silent return a string<br>MM Snap: ❌ Unlock UI|
|             wallet_deploymentData              |    expected: silent return of an error<br>MM Snap: ❌ N/A | expected: silent return of an error<br>MM Snap: ❌ N/A |expected: silent return an object or an error<br>MM Snap: ✅ always Error 115| expected: silent return of an error<br>MM Snap: ❌ Unlock UI |
|          wallet_addInvokeTransaction           | expected: Unlock UI<br>MM Snap: ❌ N/A | expected: DAPP connect UI<br>MM Snap: ❌ N/A  | expected: UI for transaction<br>MM Snap: ✅ (sometime fails with Error 163 = An error occurred (UNKNOWN_ERROR), code: -32603, message: 'Unable to execute the rpc request' ) | expected: Unlock UI<br>MM Snap: ✅ |
|          wallet_addDeclareTransaction          | expected: Unlock UI<br>MM Snap: ❌ N/A  | expected: DAPP connect UI<br>MM Snap: ❌ N/A | expected: UI for class declaration<br>MM Snap: ❌ Error 163 = An error occurred (UNKNOWN_ERROR), code: -32603, message: 'Unable to execute the rpc request' | expected: Unlock UI<br>MM Snap: ✅  |
|              wallet_signTypedData              | expected: Unlock UI<br>MM Snap: ❌ N/A |      expected: DAPP connect UI<br>MM Snap: ❌ N/A      | expected: UI for message signature<br>MM Snap: 🔶 quality of display is not conform to EIP 712  | expected: Unlock UI<br>MM Snap: ✅ |
|             wallet_supportedSpecs              |       expected: silent return [string]<br>MM Snap: ❌ N/A       |  expected: silent return [string]<br>MM Snap: ❌ N/A   |                        expected: silent return [string]<br>MM Snap: ✅                         |expected: silent return [string]<br>MM Snap: ✅       |
|           wallet_supportedWalletApi            |  expected: silent return [string]<br>MM Snap: ❌ N/A  |  expected: silent return [string]<br>MM Snap: ❌ N/A   | expected: silent return [string] <br>MM Snap: ✅    |expected: silent return [string]<br>MM Snap: ✅   |

> [!NOTE]
> - Metamask is slow to react to requests. Delay of 1-3 sec. is common.  
> - Transactions are processing when everything is nominal, but it's not rare to have errors.  
> - If the wallet is locked manually, after some delay, Metamask is asking automatically to unlock.

> [!IMPORTANT]
> Snap is not able to process immediately after discovery: a specific code has to be executed before using the API. This code is present in get-starknet v4.0.3 `connect`, but is not exportable for a custom wallet selection UI.
