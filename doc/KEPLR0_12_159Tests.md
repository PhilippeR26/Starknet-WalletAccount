# Test report for KEPLR wallet 0.12.149 (windows 10/Chrome, testnet)

Use of test DAPP https://starknet-wallet-account.vercel.app/  
Tests of conformity to get-starknet v4.

- Event networkChanged : ✅
- Event accountsChanged: 🔶 (not applicable as the wallet can handle only one account).

Wallet |DAPP ||
|---:|:---:|:--:|
||**Not connected**|**Connected**|
|**Unlocked**|1|2|
|**Locked**|3|4|
<br>

| Function  |  wallet locked + not connected <br> (case 3) | Once unlocked + not connected <br> (case 1) |Once unlocked and connected <br> (case 2) | Connected + Wallet locked <br> (case 4)|
| :--------------------------------------------: | :------------------------------------------------: | :------------------------------------------------: | :---------------------------------: |:--:|
|             wallet_getPermissions              |     expected: silent return []<br>KEPLR: ✅      |     expected: silent return []<br>KEPLR: ✅  |  expected: silent return ["accounts"] <br>KEPLR: ✅  |expected: silent return []<br>KEPLR: ❌ Error: KeyRing is locked |
| wallet_requestAccounts <br> silentMode : true  |     expected: silent return []<br>KEPLR: ❌ Error: url is not permitted. Please disconnect and reconnect to the website |  expected: silent return []<br>KEPLR: ❌ Error: url is not permitted. Please disconnect and reconnect to the website      |   expected: silent return [address]<br>KEPLR: ✅    |expected: silent return []<br>KEPLR: ❌ Error: KeyRing is locked |
| wallet_requestAccounts <br> silentMode : false |          expected: Unlock UI<br>KEPLR: ✅   |       expected: DAPP connect UI<br>KEPLR: ✅        |                                  expected: silent return [address]<br>KEPLR: ✅      |expected: Unlock UI<br>KEPLR: ✅   |
|               wallet_watchAsset                |          expected: Unlock UI<br>KEPLR: ✅           |       expected: DAPP connect UI<br>KEPLR: ✅        |              expected: UI proposing a new token<br>KEPLR: ❌ response: false (in Mainnet & Testnet)  |expected: Unlock UI<br>KEPLR: ✅   |
|            wallet_addStarknetChain             |          expected: Unlock UI<br>KEPLR: ✅           |       expected: DAPP connect UI<br>KEPLR: ✅        |    expected: UI proposing a new chain<br>KEPLR: ❌ Error: the type 'wallet_addStarknetChain' is not supported    |expected: Unlock UI<br>KEPLR: ✅   |
|           wallet_switchStarknetChain           |          expected: Unlock UI<br>KEPLR: ✅           |       expected: DAPP connect UI<br>KEPLR: ✅        |      expected: UI proposing to change chain<br>KEPLR: ❌ Error: invalid parameters: must provide a chain id  |expected: Unlock UI<br>KEPLR: ✅   |
|             wallet_requestChainId              |  expected: silent return a string<br>KEPLR: ❌ Unlock UI   |  expected: silent return a string<br>KEPLR: ❌ DAPP connect UI   |  expected: silent return a string<br>KEPLR: ✅  |expected: silent return a string<br>KEPLR: ❌ Unlock UI   |
|             wallet_deploymentData              | expected: silent return of an error<br>KEPLR: ❌ Unlock UI | expected: silent return of an error<br>KEPLR: ❌ DAPP connect UI |    expected: silent return an object or an error<br>KEPLR: ❌ Error: Not implemented   |expected: silent return of an error<br>KEPLR: ❌ Unlock UI |
|          wallet_addInvokeTransaction | expected: Unlock UI<br>KEPLR: ✅    |   expected: DAPP connect UI<br>KEPLR: ✅   |   expected: UI for transaction<br>KEPLR: ✅  |expected: Unlock UI<br>KEPLR: ✅  |
|          wallet_addDeclareTransaction |    expected: Unlock UI<br>KEPLR: ✅     |   expected: DAPP connect UI<br>KEPLR: ✅   |   expected: UI for class declaration<br>KEPLR: ❌ Error: Not implemented    |expected: Unlock UI<br>KEPLR: ✅  |
|              wallet_signTypedData  | expected: Unlock UI<br>KEPLR: ✅  |  expected: DAPP connect UI<br>KEPLR: ✅      | expected: UI for message signature<br>KEPLR: 🔶 quality of display is not conform to EIP 712 |expected: Unlock UI<br>KEPLR: ✅  |
|             wallet_supportedSpecs  |  expected: silent return [string]<br>KEPLR: ❌ Unlock UI   |  expected: silent return [string]<br>KEPLR: ❌DAPP connect UI   |   expected: silent return [string]<br>KEPLR: 🔶 response is "0.7.1" instead of "0.7"  |expected: silent return [string]<br>KEPLR: ❌ Unlock UI   |
|           wallet_supportedWalletApi |    expected: silent return [string]<br>KEPLR: ❌ Unlock UI   |  expected: silent return [string]<br>KEPLR: ❌DAPP connect UI   |  expected: silent return [string] <br>KEPLR: 🔶 response is "0.7.1" instead of "0.7"   |expected: silent return [string]<br>KEPLR: ❌ Unlock UI   |

