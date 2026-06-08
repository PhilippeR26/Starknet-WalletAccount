## Objective
Test locally the new Starknet Wallet API v0.10.3

## Libraries
- the types-js experimental library for API v0.10.3 is here: `/D/Starknet/types-jsFork/types-js` current branch `rpc-0.10.3`. Is built.
- Use Starknet.js experimental available here : `/D/starknetFork/starknet.js` current branch `testRpc0103`, It handles RPC v0.10.3 and the big upgrade of wallet API v0.10.3. Is built.
- An experimental Ready Wallet v5.33.5 is installed in a local Chrome.
- get-starknet V6 (using rpc0.13.0) is not yet available. A workaround will be necessary ; V5 should be ok for wallet discovery/choice, but the returned object needs something modified to be api v0.10.3 compatible.


## Documentation
- see in branch `api` the file `doc/walletAPIspec.md` for Rpc v0.10.3 handling.
- see here for the original spec : `ttps://github.com/starkware-libs/starknet-specs`

## UI
I want :
- Additional buttons to handle the new wallet API entrypoints.
- Option to add a proof to an invoke transaction.

## Rules
- Only me can commit.
- In this first step, use fake proofs. So, it will fail, but we can anyway test if requests are accepted.
