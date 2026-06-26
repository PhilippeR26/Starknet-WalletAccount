const MAINNET_EKUBO = {
  router: "0x0199741822c2dc722f6f605204f35e56dbc23bceed54818168c4c49e4fb8737e",
  swapHelper:
    "0x00389e0930f2bcf14221adefb71007ca71cec4cd4f64f321836392d2748a14c6",
  poolFee: "0x68db8bac710cb4000000000000000",
  tickSpacing: "0xc8",
  extension: "0x0",
  skipAhead: "0x0",
}

const MAINNET_PRIVACY_TOKENS = {
  strkBTC: "0x0787150e306e6eae6e3f79dea881770e8bbff2c1b8eb490f969669ee945b3135",
  xstrkBTC:
    "0x047751b3532fabca89b0f2e35ca1cb45e5a7b11d5e3d3663dfa1f4406b45fd88",
}

// strkBTC has 8 decimals, so 0.000001 strkBTC = 100 base units = 0x64.
const STRKBTC_AMOUNT = "0x64"

const asCalldataFelt = (value) => {
  const hex = String(value)
  if (!hex.startsWith("0x")) {
    return hex
  }
  const canonical = hex.slice(2).replace(/^0+/, "")
  return `0x${canonical || "0"}`
}

const buildEkuboStrkBtcToXStrkBtcActions = (recipient) => [
  {
    type: "withdraw",
    token: MAINNET_PRIVACY_TOKENS.strkBTC,
    amount: STRKBTC_AMOUNT,
    recipient: MAINNET_EKUBO.swapHelper,
  },
  {
    type: "transfer",
    token: MAINNET_PRIVACY_TOKENS.xstrkBTC,
    amount: "OPEN",
    recipient,
  },
  {
    type: "invoke",
    contract: MAINNET_EKUBO.swapHelper,
    calldata: [
      asCalldataFelt(MAINNET_EKUBO.router),
      asCalldataFelt(MAINNET_PRIVACY_TOKENS.strkBTC),
      STRKBTC_AMOUNT,
      "0x0",
      asCalldataFelt(MAINNET_PRIVACY_TOKENS.xstrkBTC),
      asCalldataFelt(MAINNET_PRIVACY_TOKENS.strkBTC),
      MAINNET_EKUBO.poolFee,
      MAINNET_EKUBO.tickSpacing,
      MAINNET_EKUBO.extension,
      "0x1",
      "0x0",
      MAINNET_EKUBO.skipAhead,
      "${openNoteIds[0]}",
    ],
  },
]

// Usage:
const account = (await window.starknet.request({
  type: "wallet_requestAccounts",
}))[0]

const actions = buildEkuboStrkBtcToXStrkBtcActions(account)

await window.starknet.request({
  type: "wallet_strk20InvokeTransaction",
  params: { actions },
})