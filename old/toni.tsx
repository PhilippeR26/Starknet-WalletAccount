import "./App.css"
import {
  type ConnectOptions,
  type DisconnectOptions,
  connect,
  disconnect
} from "get-starknet"

import { RpcMessage, StarknetWindowObject } from "get-starknet-core";
import { useState } from "react"
import { defaultProvider, CallData, Provider, extractContractHashes, json, LegacyCompiledContract, WalletAccount, constants, supportedSpecs, requestChainId } from "starknet";
import HelloCairo2 from './compiled.json?raw';
import HelloCairo2Casm from './compiled.casm.json?raw';

function App() {
  const [walletName, setWalletName] = useState("")
  const [accountAddress, setAccountAddress] = useState("")
  const [logo, setLogo] = useState("")
  const [cswo, setCswo] = useState({} as StarknetWindowObject)
  const [wa, setWa] = useState({} as WalletAccount)

  async function handleConnect(options?: ConnectOptions) {
      const res = await connect(options)
      // res.enable();
      // console.log(res)
      // window.res = res;
      setWalletName(res?.name || "")
      setAccountAddress(res?.selectedAddress || '');
      setLogo(res?.icon || '');

      const cswo = await walletRequestHandler(res);
      setWA(cswo);
  }

  function setWA(ooo: any) {
    const walletAccount = new WalletAccount(defaultProvider, ooo);
    setWa(walletAccount);
  }

  function handleDisconnect(options?: DisconnectOptions) {
    return async () => {
      await disconnect(options)
      setWalletName("")
    }
  }

  //---- TT Request Handler
  type RpcCall = Omit<RpcMessage, "result">;

  async function walletRequestHandler(swo: StarknetWindowObject | null) {
    if(!swo) {
      throw Error('StarknetWindowObject is null');
    }
    /* if(!swo.isConnected){
      // throw Error('StarknetWindowObject need to be connected to the wallet')
      const requestAccountsRpcMessage: RpcCall = {
        type: "wallet_getPermissions",
      }
      const response = await swo.request(requestAccountsRpcMessage)
      console.log(response);
    } */
    // ConnectedStarknetWindowObject
    // setCswo(swo);

    // Request Permission for wallet account, return account addresses that's connected (allowed url) 
    const response = await swo.request({
      type: "wallet_requestAccounts",
      params: {
        silentMode: false
      }
    })
    console.log('requestAccountsRpcMessage', response);

    setCswo(swo);

    // wallet_watchAsset // This Add Token to Wallet List

    // wallet_addStarknetChain ?Should add new chain to wallet

    // wallet_switchStarknetChain //not-implemented

    // starknet_addInvokeTransaction
    return swo;
  }

  function subscribeEvents(){
    wa.onAccountChange((e: any) => console.log('Account changed:',e));
    wa.onNetworkChanged((e: any) => console.log('Account changed:',e));
    console.log('subscribed');
  }

  async function getPerm(){
    const perm = await wa.getPermissions();
    console.log(perm);

    console.log( await wa.getChainId());
    console.log( await wa.getNonce());
  }

  async function clickSupportedSpecs() { 
    const res = await supportedSpecs(cswo);
    console.log(res);
  }

  async function clickChainId() {
    const res = await requestChainId(cswo);
    console.log(res);
  }

  async function testSwitchChain(){
    const requestAccountsRpcMessage: RpcCall = {
      type: "wallet_switchStarknetChain",
      params: {
        chainId: 'SN_GOERLI'
      }
    }
    const response = await cswo.request(requestAccountsRpcMessage)
    console.log(response);
  }

  async function testInvoke(){
    // test trasfer call
    const transferCall = {
      contract_address: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
      entrypoint: 'transfer',
      calldata: CallData.compile(['0x047064c5277753ca561bd15fe57fc63e00b2db5a7d29257565401cb5cfb1102a', '10', '0'])
    }

    console.log('TC', transferCall)
  
    const req2: RpcCall = {
      type: "starknet_addInvokeTransaction",
      params: {
        calls: [transferCall]
      }
    }
    const res2 = await cswo.request(req2)
    console.log('invoke res2:', res2);

    if(res2 === true || res2 === false || Array.isArray(res2)){
      console.log('invoke error');
      return;
    }

    const txr = await defaultProvider.waitForTransaction(res2.transaction_hash);
    console.log('invkoke tx result', txr);
  }

  async function testDeclare() {

    // console.log('erc20', erc20.abi);
    const compiledErc20 = json.parse(
      CJ
    );


    // starknet_addDeclareTransaction
/*     const declareContractPayload = extractContractHashes({
      contract: CJ,
      casm: CC
    });

    console.log('declareContractPayload', declareContractPayload); */

    console.log('CJ', compiledErc20);

    const addDeclareTransactionParameters = {
      compiled_class_hash: '0x73654e9daf19a4e04f88aaa9aec71606a92d4065ed0241a7e3c97b6a091a14b',
      contract_class: compiledErc20,
    }

    const req2: RpcCall = {
      type: "starknet_addDeclareTransaction",
      params: addDeclareTransactionParameters
    }
    const res2 = await cswo.request(req2)
    console.log('invoke res2:', res2);
  }

  function onSwitchChainClick(){
    testSwitchChain();
  }

  // snjs

  function onSwitchChainClick2(){
    wa.switchStarknetChain(constants.StarknetChainId.SN_GOERLI);
  }

  async function testInvoke2() {
    const transferCall = {
      contractAddress: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
      entrypoint: 'transfer',
      calldata: CallData.compile(['0x047064c5277753ca561bd15fe57fc63e00b2db5a7d29257565401cb5cfb1102a', '10', '0'])
    }

    const result = await wa.execute(transferCall);
    console.log('invoke result', result);
  }

  async function testDeclare2(){
    const compiledErc20 = json.parse(HelloCairo2);
    const compiledErc20Casm = json.parse(HelloCairo2Casm);
    debugger;

    const result = await wa.declare({
      contract: compiledErc20,
      casm: compiledErc20Casm,
    });
    console.log('declare result', result);
  }

  async function testDeploy2(){
    const result = await wa.deploy({
      classHash: '0x54328a1075b8820eb43caf0caa233923148c983742402dcfc38541dd843d01a', // erc20ClassHash,
      constructorCalldata: {
        name: 'Token',
        symbol: 'ERC20',
        recipient: wa.address,
      },
    });
    console.log('deploy result', result);
  }

  return (
    <div className="App">
      <h1>get-starknet</h1>
      <div className="card">
        <button onClick={() => handleConnect()}>Default</button>
        <button onClick={() => handleConnect({ modalMode: "alwaysAsk" })}>
          Always ask what wallet
        </button>
        <button onClick={() => handleConnect({ modalMode: "neverAsk" })}>
          Never ask
        </button>
        <button
          onClick={() => handleConnect({
            modalMode: "alwaysAsk",
            modalTheme: "dark",
          })}>
          Always ask with dark theme
        </button>
        <button
          onClick={() => handleConnect({
            modalMode: "alwaysAsk",
            modalTheme: "light",
          })}>
          Always ask with light theme
        </button>
        <button onClick={handleDisconnect()}>Disconnect</button>
        <button onClick={handleDisconnect({ clearLastWallet: true })}>
          Disconnect and reset
        </button>
      </div>
      <div>
        <p>Direct Wallet actions</p>
        <button onClick={onSwitchChainClick}>switch chain</button>
        <button onClick={testInvoke}>test invoke</button>
        <button onClick={testDeclare}>test DECLARE</button>
      </div>

      {walletName && (
        <div>
            <div><img src={logo} alt='logo'/></div>
            Selected Wallet: <pre>{walletName}</pre>
            Selected Account Address: <pre>{accountAddress}</pre>
        </div>
      )}

      <div>
        <p>Connect Wallet</p>
        <button onClick={() => handleConnect({ modalMode: "alwaysAsk" })}>
          Connect
        </button>
        <button onClick={handleDisconnect()}>
        Disconnect
        </button>
        <p>Starknetjs WalletAccount actions</p>
        <button onClick={onSwitchChainClick2}>switch chain</button>
        <button onClick={testInvoke2}>test invoke</button>
        <button onClick={testDeclare2}>test DECLARE</button>
        <button onClick={testDeploy2}>test DEPLOY</button>
        <button onClick={subscribeEvents}>subscribe events</button>

        <button onClick={getPerm}>get permissions</button>
        <button onClick={clickSupportedSpecs}>supportedSpecs</button>
        <button onClick={clickChainId}>get chainId</button>
      </div>

    </div>
  )
}

export default App
