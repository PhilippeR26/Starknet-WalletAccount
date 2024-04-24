Experimental Braavos wallet v0.0.2.(not changed)  
Experimental ArgentX wallet v5.13.5 (22/feb/2024, ID : pgicobkbegddeldhlnnacicgioehkbem ).

@dhruvkelawala , @avimak , @ivpavici , @amanusk

Test DAPP :  https://cairo1-js-git-testbraavos002-philipper26.vercel.app/
My documentation for this new APi : https://github.com/PhilippeR26/Cairo1JS/blob/testBraavos002/doc/walletAPIspec.md

Result of the tests of the experimental wallets with PR #194 :  
(modified in **bold**)

| Id |Subject| ArgentX | Braavos| Comment|
|--|--|--|--|--|
|1|event accountsChanged| <b>A change of account in the same network releases both accountChanged and networkChanged events </b>|Unexpected release at each new block. |<b>Preferable to not have networkChanged events when only the account is changed </b>|
|2|event networkChanged | <b>OK</b>|OK|<b>both accountChanged and networkChanged events when change of network. Here it's logical to have this behavior</b>|
|3|wallet_getPermissions| OK|OK||
|4|wallet_requestAccounts|OK|OK||
|5|wallet_watchAsset|<b>OK</b>|OK||
|6|wallet_addStarknetChain|<b>OK</b>|Not implemented|preferable : returns `true` if already added|
|7|wallet_switch StarknetChain|<b>Ok :<br> if not existing : returns false. <br>If active : returns true.<br><br> But if already active, UI ask anyway to change to the already active network!</b>|Not implemented||
|8|wallet_requestChainId|OK|OK||
|9|starknet_addInvoke Transaction|OK|OK||
|10|starknet_addDeclare Transaction|Impossible to proceed. In AddDeclareTransactionParameters type, abi key is optional, but call returns `Error: Missing ABI`. Abi type expected is `string`, but in reality is an array of object. How to process? What's the format and values of `contract_class_version` parameter? Decline button is not generating any response. |Wallet window opened, but do not proceed.|One example of a valid request seems necessary.|
|11|starknet_addDeploy AccountTransaction|FAIL, with message `Error: Not implemented`.|OK. <br />But do not deploy at the pre-calculated address|Braavos uses the current account to fund automatically the account deployment.|
|12|starknet_signTypedData|<b>OK.<br>But not all SNJS typedData are accepted</b>|OK.<br/>Raw format display||
|13|starknet_supportedSpecs|OK|OK||
|14|GetDeploymentDataResult|-|-|What is it? How does it work?|