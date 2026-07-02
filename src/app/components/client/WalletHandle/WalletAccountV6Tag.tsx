"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Center,
  HStack,
  Stack,
  StackSeparator,
  Text,
  VStack,
} from "@chakra-ui/react";
import { hash, json, num, shortString, validateAndParseAddress } from "starknet";
import type { WALLET_API } from "@starknet-io/types-js";
import styles from "../../../page.module.css";
import * as constants from "@/utils/constants";
import { useStoreWallet } from "../../Wallet/walletContext";
import { useFrontendProvider } from "../provider/providerContext";

// All actions are fixed to STRK (project decision).
const TOKEN = constants.addrSTRK;
// Fixed amounts, in the token's smallest unit (1e18 = 1 STRK).
const TEN_STRK = 10n * 10n ** 18n;
const FIVE_STRK = 5n * 10n ** 18n;
const ONE_STRK = 1n * 10n ** 18n;

// Format a felt amount (STRK, 18 decimals) as a human STRK string ("10", "1.5").
function fmtStrk(amount: bigint): string {
  const whole = amount / 10n ** 18n;
  const frac = (amount % 10n ** 18n).toString().padStart(18, "0").replace(/0+$/, "");
  return frac ? `${whole}.${frac}` : `${whole}`;
}

// Compact one-glance view of a tx receipt — the full receipt is far too large to show.
// Keeps the useful headline fields (status, event count, fee, hash).
function compactReceipt(txR: any): string {
  const r = txR?.value ?? txR;
  const summary = {
    transaction_hash: r?.transaction_hash,
    finality_status: r?.finality_status,
    execution_status: r?.execution_status,
    events: Array.isArray(r?.events) ? r.events.length : undefined,
    actual_fee: r?.actual_fee?.amount ?? r?.actual_fee,
  };
  return json.stringify(summary, undefined, 2);
}

// Shorten a felt/hex for display, like the wallet address ("0x1dc5a1c...1927a").
function shortHex(h: string): string {
  const hex = num.toHex(h);
  return hex.length <= 13 ? hex : `${hex.slice(0, 7)}...${hex.slice(-4)}`;
}

// Verdict shown for the complex (echo invoke) action.
type VerdictRow = { label: string; value: string; ok?: boolean };
type Verdict = { ok: boolean; pending?: boolean; title: string; rows: VerdictRow[] };

export default function WalletAccountV6Tag() {
  const myFrontendProviderIndex = useFrontendProvider(
    (state) => state.currentFrontendProviderIndex
  );
  const myWalletAccount = useStoreWallet((state) => state.myWalletAccount);
  const connectedAddress = useStoreWallet((state) => state.address);
  const chain = useStoreWallet((state) => state.chain);
  const [chainIdWA, setChainIdWA] = useState<string>(chain);

  // Mainnet only: index 0 is the mainnet frontend provider.
  const isMainnet = myFrontendProviderIndex === 0;

  // Per-action result text (raw tx hash / receipt / error).
  const [resultBalances, setResultBalances] = useState<string>("");
  const [resultShield, setResultShield] = useState<string>("");
  const [resultUnshield, setResultUnshield] = useState<string>("");
  const [resultTransfer, setResultTransfer] = useState<string>("");
  const [resultComplex, setResultComplex] = useState<string>("");
  // Verdict for the complex action (Invoked event verification).
  const [verdictComplex, setVerdictComplex] = useState<Verdict | null>(null);

  const getWAchainId = () => {
    myWalletAccount?.provider
      .getChainId()
      .then((result: any) => setChainIdWA(result.toString()));
  };

  useEffect(() => {
    getWAchainId();
  }, [myFrontendProviderIndex, chain]);

  // Submit STRK20 actions through the WalletAccountV6 instance, show the tx hash, then
  // wait for the receipt (privacy-pool txs verify a STARK proof on-chain — long budget).
  // Returns the tx hash on success, or undefined on error.
  async function submit(
    actions: WALLET_API.STRK20_ACTION[],
    setResult: (s: string) => void
  ): Promise<string | undefined> {
    if (!myWalletAccount) {
      setResult("No WalletAccount available.");
      return undefined;
    }
    let txH: string;
    try {
      const r = await myWalletAccount.strk20InvokeTransaction(actions);
      txH = r.transaction_hash;
    } catch (error: any) {
      setResult(error.toString());
      return undefined;
    }
    setResult(`transaction_hash = ${txH}\nWaiting for receipt…`);
    // myWalletAccount.provider is fixed at connect time (Sepolia) and can point at the
    // wrong network; use the frontend provider that tracks the current network instead.
    const provider = constants.myFrontendProviders[myFrontendProviderIndex];
    try {
      const txR = await provider.waitForTransaction(txH, {
        retries: 400,
        retryInterval: 3000,
      });
      setResult(compactReceipt(txR));
    } catch (error: any) {
      setResult(`transaction_hash = ${txH}\n${error.toString()}`);
    }
    return txH;
  }

  // Query the private (shielded) balances of ALL tokens held in the pool — empty array
  // means "all shielded tokens". Read via the WalletAccountV6 instance method.
  const handleBalances = async () => {
    setResultBalances("");
    if (!myWalletAccount) {
      setResultBalances("No WalletAccount available.");
      return;
    }
    try {
      const r = await myWalletAccount.strk20Balances([]);
      setResultBalances(json.stringify(r, undefined, 2));
    } catch (error: any) {
      setResultBalances(error.toString());
    }
  };

  const handleShield = async () => {
    setResultShield("");
    const actions: WALLET_API.STRK20_ACTION[] = [
      { type: "deposit", token: TOKEN, amount: num.toHex(TEN_STRK) },
    ];
    await submit(actions, setResultShield);
  };

  const handleUnshield = async () => {
    setResultUnshield("");
    if (!connectedAddress) {
      setResultUnshield("Connect a wallet first (recipient = connected account).");
      return;
    }
    const actions: WALLET_API.STRK20_ACTION[] = [
      { type: "withdraw", token: TOKEN, amount: num.toHex(ONE_STRK), recipient: connectedAddress },
    ];
    await submit(actions, setResultUnshield);
  };

  const handleSelfTransfer = async () => {
    setResultTransfer("");
    if (!connectedAddress) {
      setResultTransfer("Connect a wallet first (recipient = connected account).");
      return;
    }
    const actions: WALLET_API.STRK20_ACTION[] = [
      { type: "transfer", token: TOKEN, amount: num.toHex(ONE_STRK), recipient: connectedAddress },
    ];
    await submit(actions, setResultTransfer);
  };

  // Complex action — echo invoke round-trip: withdraw 5 STRK to the helper, create an
  // open note for the output, and invoke the helper to fill it. Then verify the Invoked
  // event on-chain (open note filled with 5 STRK).
  const handleComplex = async () => {
    setResultComplex("");
    setVerdictComplex(null);
    if (!connectedAddress) {
      setResultComplex("Connect a wallet first (open note recipient = connected account).");
      return;
    }
    const helper = num.toHex(constants.Strk20EchoHelperAddress);
    // "OPEN" / ${poolAddress} / ${openNoteIds[0]} are literal placeholder strings the
    // wallet substitutes during assembly — they must NOT be hex-normalized.
    const actions: WALLET_API.STRK20_ACTION[] = [
      { type: "withdraw", token: TOKEN, amount: num.toHex(FIVE_STRK), recipient: helper },
      { type: "transfer", token: TOKEN, amount: "OPEN", recipient: connectedAddress },
      {
        type: "invoke",
        contract: helper,
        calldata: [num.toHex(TOKEN), "${poolAddress}", "${openNoteIds[0]}"],
      },
    ];
    const txH = await submit(actions, setResultComplex);
    if (!txH) return;
    setVerdictComplex({
      ok: false,
      pending: true,
      title: "Verifying on-chain…",
      rows: [{ label: "tx", value: shortHex(txH) }],
    });
    setVerdictComplex(await verifyEcho(txH));
  };

  // Fetch the tx receipt and verify the helper's Invoked event: the open note was filled
  // with the 5 STRK we withdrew. Returns a pass/fail verdict (never throws).
  async function verifyEcho(txHash: string): Promise<Verdict> {
    try {
      // Use the frontend provider that tracks the current network (index 0 = mainnet),
      // not myWalletAccount.provider which is fixed at connect time (Sepolia).
      const provider = constants.myFrontendProviders[myFrontendProviderIndex];
      if (!provider) {
        return { ok: false, title: "Cannot verify (no provider)", rows: [{ label: "tx", value: shortHex(txHash) }] };
      }
      const helperHex = num.toHex(constants.Strk20EchoHelperAddress);
      const selInvoked = num.toHex(hash.getSelectorFromName("Invoked"));
      const receipt: any = await provider.waitForTransaction(txHash, {
        retries: 400,
        retryInterval: 3000,
      });
      if (receipt?.execution_status === "REVERTED" || (receipt?.isSuccess && !receipt.isSuccess())) {
        return { ok: false, title: "Transaction reverted", rows: [{ label: "tx", value: shortHex(txHash), ok: false }] };
      }
      const events: any[] = receipt?.events ?? receipt?.value?.events ?? [];
      const ev = events.find((e) => {
        try {
          return (
            e?.keys?.length &&
            e.from_address &&
            num.toHex(e.from_address) === helperHex &&
            num.toHex(e.keys[0]) === selInvoked
          );
        } catch {
          return false;
        }
      });
      if (!ev) {
        return {
          ok: false,
          title: "Invoked event NOT found",
          rows: [
            { label: "events", value: `${events.length} in receipt`, ok: false },
            { label: "tx", value: shortHex(txHash) },
          ],
        };
      }
      // Event layout: keys = [selector, note_id (#[key])], data = [amount (u128), caller].
      const noteId = ev.keys[1] as string;
      const amount = ev.data[0] as string;
      const caller = ev.data[1] as string;
      const amountOk = num.toBigInt(amount) === FIVE_STRK;
      return {
        ok: amountOk,
        title: amountOk ? "Echo verified — open note filled with 5 STRK" : "Event found, but amount mismatch",
        rows: [
          { label: "note_id", value: shortHex(noteId), ok: true },
          { label: "amount", value: `${fmtStrk(num.toBigInt(amount))} STRK`, ok: amountOk },
          { label: "caller (pool)", value: shortHex(caller) },
          { label: "tx", value: shortHex(txHash) },
        ],
      };
    } catch (err: any) {
      const msg = err?.message ?? String(err);
      return {
        ok: false,
        title: `Could not fetch / parse receipt — ${msg}`,
        rows: [{ label: "tx", value: shortHex(txHash) }],
      };
    }
  }

  // One action block: label + amount, an on-chain button (disabled off Mainnet), and a
  // green result box once a result is available.
  function ActionBlock({
    label,
    amountStrk,
    onClick,
    result,
  }: {
    label: string;
    amountStrk: string;
    onClick: () => void;
    result: string;
  }) {
    return (
      <>
        <p>
          {label} : <b>{amountStrk} STRK</b>
        </p>
        <Button variant="surface" disabled={!isMainnet} onClick={onClick}>
          {label}
        </Button>
        {result ? (
          <Box bg="green.200" color="black" borderWidth="1px" borderColor="green.800" borderRadius="md" p={1} marginTop={2}>
            <Text className={styles.text1} whiteSpace="pre-wrap" wordBreak="break-all">
              result : {result}
            </Text>
          </Box>
        ) : null}
      </>
    );
  }

  return (
    <>
      <VStack paddingY={3} separator={<StackSeparator borderColor="gray.300" />}>
        <>
          <Center fontSize={16} fontWeight={700} color={"firebrick"}>
            Use of {isMainnet ? "MAINNET ✅" : "TESTNET ❌"} network
          </Center>
          {!isMainnet && (
            <Center fontSize={14} fontWeight={700} color={"red.600"}>
              STRK20 actions require Mainnet — switch your wallet to Mainnet.
            </Center>
          )}
          <Center fontSize={14} color={"darkred"}> my frontend provider Id : {myFrontendProviderIndex} </Center>
          <Center fontSize={13} color={"darkred"}> WalletAccountAddress : {!!myWalletAccount?.address ? validateAndParseAddress(myWalletAccount.address) : "address not available"} </Center>
          <Center fontSize={13} color={"darkred"}> WalletAccountChain : {chainIdWA ? shortString.decodeShortString(chainIdWA) : "N/A"} </Center>
        </>

        <>
          <p>
            Balances : <b>all shielded tokens</b>
          </p>
          <Button variant="surface" disabled={!isMainnet} onClick={handleBalances}>
            Query balances
          </Button>
          {resultBalances ? (
            <Box bg="green.200" color="black" borderWidth="1px" borderColor="green.800" borderRadius="md" p={1} marginTop={2}>
              <Text className={styles.text1} whiteSpace="pre-wrap" wordBreak="break-all">
                result : {resultBalances}
              </Text>
            </Box>
          ) : null}
        </>

        <ActionBlock label="Shield" amountStrk="10" onClick={handleShield} result={resultShield} />
        <ActionBlock label="Self transfer" amountStrk="1" onClick={handleSelfTransfer} result={resultTransfer} />

        <>
          <p>
            Complex action (echo invoke, new helper contract) : <b>5 STRK</b>
          </p>
          <Text fontSize={13} color={"gray.700"} maxW="520px" textAlign="center">
            withdraw 5 STRK → helper, transfer &quot;OPEN&quot; → self, invoke helper
            [STRK, poolAddress, openNoteIds[0]]. Requires shielded STRK ≥ 5 (+ wallet fees).
          </Text>
          <Button variant="surface" disabled={!isMainnet} onClick={handleComplex}>
            Complex action
          </Button>
          {verdictComplex && (
            <Box
              maxW="560px"
              marginTop={4}
              padding="10px"
              borderWidth="2px"
              borderRadius="md"
              borderColor={verdictComplex.pending ? "gray.400" : verdictComplex.ok ? "green.500" : "red.500"}
              bg={verdictComplex.pending ? "gray.50" : verdictComplex.ok ? "green.50" : "red.50"}
            >
              <HStack marginBottom="6px">
                <Text fontSize="2xl">{verdictComplex.pending ? "⏳" : verdictComplex.ok ? "✅" : "❌"}</Text>
                <Text fontWeight="bold" color={verdictComplex.pending ? "gray.700" : verdictComplex.ok ? "green.700" : "red.700"}>
                  {verdictComplex.title}
                </Text>
              </HStack>
              <Stack gap="2px">
                {verdictComplex.rows.map((row) => (
                  <HStack key={row.label} fontSize="sm" align="baseline">
                    {row.ok !== undefined && <Text>{row.ok ? "✅" : "❌"}</Text>}
                    <Text fontWeight="bold">{row.label}:</Text>
                    <Text wordBreak="break-all">{row.value}</Text>
                  </HStack>
                ))}
              </Stack>
            </Box>
          )}
          {resultComplex ? (
            <Box bg="green.200" color="black" borderWidth="1px" borderColor="green.800" borderRadius="md" p={1} marginTop={4}>
              <Text className={styles.text1} whiteSpace="pre-wrap" wordBreak="break-all">
                result : {resultComplex}
              </Text>
            </Box>
          ) : null}
        </>

        <ActionBlock label="Unshield" amountStrk="1" onClick={handleUnshield} result={resultUnshield} />
      </VStack>
      <br />
    </>
  );
}
