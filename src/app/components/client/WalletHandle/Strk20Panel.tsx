"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ChangeEvent } from "react";
import {
  Box,
  Button,
  Center,
  Checkbox,
  Dialog,
  Field,
  HStack,
  Input,
  NativeSelect,
  Separator,
  Stack,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { hash, json, num, walletV6 } from "starknet";
import type { WalletWithStarknetFeatures as WalletWithStarknetFeaturesV6 } from "@starknet-io/get-starknet-wallet-standard/features";
import type { WALLET_API } from "@starknet-io/types-js";
import * as constants from "@/utils/constants";
import { useStoreWallet } from "../../Wallet/walletContext";
import { useFrontendProvider } from "../provider/providerContext";

// Single-action builder (Block A). `invoke` is intentionally excluded: it is only
// meaningful bundled with a `transfer "OPEN"` (+ `withdraw`), so it lives in the
// multi-action examples (Block B), not here.
type ActionType = "deposit" | "withdraw" | "transfer";

// All token-manipulating actions are fixed to STRK (project decision).
const TOKEN = constants.addrSTRK;
// 1 STRK in smallest unit (1e18).
const ONE_STRK = "1000000000000000000";
// 5 STRK — the multi-action example needs at least 4 STRK shielded to run.
const FIVE_STRK = "5000000000000000000";
// Thicker, darker borders + horizontal padding so input fields clearly stand out.
const FIELD_STYLE = {
  borderColor: "gray.400",
  borderWidth: "2px",
  paddingX: "12px",
} as const;
// Horizontal padding for STRK20 buttons.
const BTN_STYLE = { paddingX: "20px" } as const;

// Group a digit string in threes from the right for readability:
// "1000000" -> "1 000 000".
function groupDigits(value: string): string {
  return value.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

// Shorten a felt/hex for display, like the wallet address ("0x1dc5a1c...1927a").
function shortHex(h: string): string {
  const hex = num.toHex(h);
  return hex.length <= 13 ? hex : `${hex.slice(0, 7)}...${hex.slice(-4)}`;
}

// Format a felt amount (STRK, 18 decimals) as a human STRK string.
function fmtStrk(amountFelt: string): string {
  const v = num.toBigInt(amountFelt);
  const whole = v / 10n ** 18n;
  const frac = (v % 10n ** 18n).toString().padStart(18, "0").replace(/0+$/, "");
  return frac ? `${whole}.${frac}` : `${whole}`;
}

// Verdict shown in the result dialog after an on-chain echo invoke.
type VerdictRow = { label: string; value: string; ok?: boolean };
type Verdict = { ok: boolean; pending?: boolean; title: string; rows: VerdictRow[] };

// Echo amount = 5 STRK (5e18). Matches FIVE_STRK below; the helper must echo it back.
const FIVE_STRK_BI = 5n * 10n ** 18n;

// Avoid the SSR warning that useLayoutEffect triggers during server render.
const useBrowserLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

// STRK20 results carry huge fields (the base64 proof `data`, long calldata /
// output / proof_facts arrays). Truncate any oversized string or array for the
// result dialog while keeping the overall structure readable.
const MAX_STR = 80;
const MAX_ARR = 12;

function truncateDeep(value: unknown): unknown {
  if (typeof value === "string") {
    return value.length > MAX_STR
      ? `${value.slice(0, MAX_STR)}… (${value.length} chars, truncated)`
      : value;
  }
  if (Array.isArray(value)) {
    const items: unknown[] = value.slice(0, MAX_ARR).map(truncateDeep);
    if (value.length > MAX_ARR) {
      items.push(`… (${value.length} items total, truncated)`);
    }
    return items;
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, truncateDeep(v)])
    );
  }
  return value;
}

function formatResult(r: unknown): string {
  return json.stringify(truncateDeep(r), undefined, 2);
}

// JSON-RPC errors carry a numeric `code`; transport-level failures (e.g. a
// client timeout) do not — omit the "undefined" code in that case.
function formatError(err: any): string {
  const message = err?.message ?? String(err);
  return err?.code !== undefined ? `Error ${err.code} = ${message}` : `Error: ${message}`;
}

// One multi-action example card. Mirrors the single-action layout: a blue box
// grouping the `simulate` checkbox with the Prepare button, then a separate
// on-chain button below. Each card owns its `simulate` state.
function ExampleCard({
  title,
  description,
  warn,
  onRun,
}: {
  title: string;
  description?: string;
  warn?: boolean;
  onRun: (kind: "prepare" | "invoke", simulate: boolean) => void;
}) {
  const [simulate, setSimulate] = useState<boolean>(true);
  return (
    <Box
      borderWidth="1px"
      borderColor={warn ? "orange.400" : "gray.400"}
      bg={warn ? "orange.50" : undefined}
      borderRadius="md"
      padding="10px"
    >
      <Text fontWeight="bold" marginBottom="6px">
        {title}
      </Text>
      {description && (
        <Text fontSize="sm" marginBottom="8px">
          {description}
        </Text>
      )}

      {/* simulate + Prepare grouped together — same as the single-action block. */}
      <Box
        borderWidth="1px"
        borderColor="blue.400"
        borderRadius="md"
        bg="blue.50"
        padding="10px"
        marginBottom="8px"
      >
        <Stack gap="10px" align="flex-start">
          <Checkbox.Root
            checked={simulate}
            onCheckedChange={(e) => setSimulate(e.checked === true)}
          >
            <Checkbox.HiddenInput />
            <Checkbox.Control />
            <Checkbox.Label>
              simulate (no proof, nothing submitted — recommended first)
            </Checkbox.Label>
          </Checkbox.Root>
          <Button
            {...BTN_STYLE}
            colorPalette="blue"
            variant="surface"
            onClick={() => onRun("prepare", simulate)}
          >
            Prepare invoke
          </Button>
        </Stack>
      </Box>

      {/* Invoke transaction always submits on-chain (no simulate). */}
      <Button
        {...BTN_STYLE}
        colorPalette={warn ? "orange" : "cyan"}
        variant="surface"
        onClick={() => onRun("invoke", simulate)}
      >
        Invoke transaction (submits on-chain)
      </Button>
    </Box>
  );
}

export default function Strk20Panel() {
  const walletObject = useStoreWallet((state) => state.StarknetWalletObject);
  const connectedAddress = useStoreWallet((state) => state.address);
  // Reading provider that tracks the wallet's current network (0=mainnet, 2=sepolia).
  // myWalletAccount.provider is fixed at connect time and can point at the wrong network.
  const frontendProviderIndex = useFrontendProvider((s) => s.currentFrontendProviderIndex);
  const wallet = walletObject as unknown as WalletWithStarknetFeaturesV6 | undefined;

  const { open, onOpen, onClose } = useDisclosure();
  const [summary, setSummary] = useState<string>("");
  const [response, setResponse] = useState<string>("N/A");
  const [verdict, setVerdict] = useState<Verdict | null>(null);

  // Block A — single-action builder state
  const [actionType, setActionType] = useState<ActionType>("deposit");
  const [amount, setAmount] = useState<string>(ONE_STRK);
  const [recipient, setRecipient] = useState<string>("");
  const [simulate, setSimulate] = useState<boolean>(true); // recommended first step

  // Block C — balances state
  const [balanceTokens, setBalanceTokens] = useState<string>(
    `${constants.addrETH},${constants.addrSTRK}`
  );

  const recipientNeeded = actionType === "withdraw" || actionType === "transfer";
  const recipientFilled = recipient.trim().length > 0;

  // Keep the caret stable in the Amount field despite the digit-grouping reformat
  // (a controlled+formatted input otherwise jumps the caret to the end on each edit).
  const amountRef = useRef<HTMLInputElement>(null);
  const amountCaretRef = useRef<number | null>(null);
  useBrowserLayoutEffect(() => {
    if (amountCaretRef.current != null && amountRef.current) {
      const pos = amountCaretRef.current;
      amountRef.current.setSelectionRange(pos, pos);
      amountCaretRef.current = null;
    }
  }, [amount]);

  function handleAmountChange(e: ChangeEvent<HTMLInputElement>) {
    const el = e.currentTarget;
    const caret = el.selectionStart ?? el.value.length;
    // Count digits left of the caret, then place the caret after that many
    // digits in the freshly grouped string.
    const digitsLeft = el.value.slice(0, caret).replace(/\D/g, "").length;
    const digitsOnly = el.value.replace(/\D/g, "");
    const formatted = groupDigits(digitsOnly);
    let count = 0;
    let pos = 0;
    while (pos < formatted.length && count < digitsLeft) {
      if (/\d/.test(formatted.charAt(pos))) count += 1;
      pos += 1;
    }
    amountCaretRef.current = pos;
    setAmount(digitsOnly);
  }

  function show(sum: string, resp: string, v: Verdict | null = null) {
    setSummary(sum);
    setResponse(resp);
    setVerdict(v);
    onOpen();
  }

  function describe(action: WALLET_API.STRK20_ACTION): string {
    switch (action.type) {
      case "deposit":
        return `deposit STRK amount=${action.amount}`;
      case "withdraw":
        return `withdraw STRK amount=${action.amount} -> ${action.recipient}`;
      case "transfer":
        return `transfer STRK amount=${action.amount} -> ${action.recipient}`;
      case "invoke":
        return `invoke ${action.contract}`;
    }
  }

  function buildAction(): WALLET_API.STRK20_ACTION {
    switch (actionType) {
      case "deposit":
        // FELT amounts must be 0x-prefixed hex; the input holds a decimal string.
        return { type: "deposit", token: TOKEN, amount: num.toHex(amount) };
      case "withdraw":
        return { type: "withdraw", token: TOKEN, amount: num.toHex(amount), recipient };
      case "transfer":
        return { type: "transfer", token: TOKEN, amount: num.toHex(amount), recipient };
    }
  }

  // Generic runner: prepareInvoke (optionally simulated) or on-chain invokeTransaction.
  // `verify` (on-chain only) inspects the tx result and returns a pass/fail verdict.
  async function run(
    label: string,
    actions: WALLET_API.STRK20_ACTION[],
    kind: "prepare" | "invoke",
    simulateFlag: boolean,
    verify?: (txHash: string) => Promise<Verdict>
  ) {
    if (!wallet) return;
    const fullLabel =
      kind === "prepare"
        ? `prepareInvoke (simulate=${simulateFlag}) — ${actions.map(describe).join("  +  ")}`
        : `invokeTransaction (on-chain) — ${actions.map(describe).join("  +  ")}`;
    const sentLabel = `${label}\n${fullLabel}`;

    if (kind === "prepare") {
      let resp: string;
      try {
        resp = formatResult(await walletV6.strk20PrepareInvoke(wallet, actions, simulateFlag));
      } catch (err: any) {
        resp = formatError(err);
      }
      show(sentLabel, resp);
      return;
    }

    // On-chain: submit, show the tx hash immediately, then verify and update the verdict.
    let r: { transaction_hash: string };
    try {
      r = await walletV6.strk20InvokeTransaction(wallet, actions);
    } catch (err: any) {
      show(sentLabel, formatError(err));
      return;
    }
    const resp = formatResult(r);
    if (!verify || !r?.transaction_hash) {
      show(sentLabel, resp);
      return;
    }
    show(sentLabel, resp, {
      ok: false,
      pending: true,
      title: "Verifying on-chain…",
      rows: [{ label: "tx", value: shortHex(r.transaction_hash) }],
    });
    setVerdict(await verify(r.transaction_hash));
  }

  // Fetch the tx receipt and verify the helper's `Invoked` event: the open note was
  // filled with the 5 STRK we withdrew. Returns a pass/fail verdict (never throws).
  async function verifyEcho(txHash: string): Promise<Verdict> {
    try {
      const provider = constants.myFrontendProviders[frontendProviderIndex];
      if (!provider) {
        return { ok: false, title: "Cannot verify (no provider)", rows: [{ label: "tx", value: shortHex(txHash) }] };
      }
      const helperHex = num.toHex(constants.Strk20EchoHelperAddress);
      const selInvoked = num.toHex(hash.getSelectorFromName("Invoked"));
      // Privacy-pool txs verify a STARK proof on-chain and can take minutes to be
      // ACCEPTED_ON_L2, so allow a long budget (retries * retryInterval).
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
      const amountOk = num.toBigInt(amount) === FIVE_STRK_BI;
      return {
        ok: amountOk,
        title: amountOk ? "Echo verified — open note filled with 5 STRK" : "Event found, but amount mismatch",
        rows: [
          { label: "note_id", value: shortHex(noteId), ok: true },
          { label: "amount", value: `${fmtStrk(amount)} STRK`, ok: amountOk },
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

  // Block A — single action.
  async function send(kind: "prepare" | "invoke") {
    if (recipientNeeded && !recipient) {
      show(`${actionType} (blocked)`, `Recipient is required for ${actionType}.`);
      return;
    }
    await run(actionType, [buildAction()], kind, simulate);
  }

  // Block B, example 1 — deposit 5 STRK, then transfer a fixed 1 STRK back to self.
  async function runDepositTransfer(kind: "prepare" | "invoke", simulateFlag: boolean) {
    if (!connectedAddress) {
      show("deposit + transfer (blocked)", "Connect a wallet first (recipient = connected account).");
      return;
    }
    const actions: WALLET_API.STRK20_ACTION[] = [
      { type: "deposit", token: TOKEN, amount: num.toHex(FIVE_STRK) },
      { type: "transfer", token: TOKEN, amount: num.toHex(ONE_STRK), recipient: connectedAddress },
    ];
    await run("example: deposit 5 STRK + transfer 1 STRK -> self", actions, kind, simulateFlag);
  }

  // Block B, example 2 — echo invoke round-trip: withdraw 5 STRK to the helper,
  // create an open note for the output, and invoke the helper to fill it.
  async function runEchoInvoke(kind: "prepare" | "invoke", simulateFlag: boolean) {
    if (!connectedAddress) {
      show("echo invoke (blocked)", "Connect a wallet first (open note recipient = connected account).");
      return;
    }
    const helper = num.toHex(constants.Strk20EchoHelperAddress);
    // ${poolAddress} / ${openNoteIds[0]} are literal placeholder strings the wallet
    // substitutes during assembly — they must NOT be hex-normalized.
    const actions: WALLET_API.STRK20_ACTION[] = [
      { type: "withdraw", token: TOKEN, amount: num.toHex(FIVE_STRK), recipient: helper },
      { type: "transfer", token: TOKEN, amount: "OPEN", recipient: connectedAddress },
      {
        type: "invoke",
        contract: helper,
        calldata: [num.toHex(TOKEN), "${poolAddress}", "${openNoteIds[0]}"],
      },
    ];
    await run("example: echo invoke round-trip (5 STRK)", actions, kind, simulateFlag, verifyEcho);
  }

  // Block B, example 3 — OPEN mismatch: one open note created, none filled by an
  // invoke. The wallet rejects this up-front (INVALID_REQUEST_PAYLOAD), before any
  // proof generation or fee. Demonstrates the "created OPEN == filled OPEN" rule.
  async function runOpenMismatch(kind: "prepare" | "invoke", simulateFlag: boolean) {
    if (!connectedAddress) {
      show("OPEN mismatch (blocked)", "Connect a wallet first (open note recipient = connected account).");
      return;
    }
    const actions: WALLET_API.STRK20_ACTION[] = [
      { type: "transfer", token: TOKEN, amount: "OPEN", recipient: connectedAddress },
    ];
    await run("example: OPEN mismatch (expected to fail)", actions, kind, simulateFlag);
  }

  async function queryBalances(tokens: string[]) {
    if (!wallet) return;
    let resp: string;
    try {
      const r = await walletV6.strk20Balances(wallet, tokens);
      resp = formatResult(r);
    } catch (err: any) {
      resp = formatError(err);
    }
    show(
      tokens.length === 0
        ? "balances ALL shielded (empty array)"
        : `balances ${tokens.join(", ")}`,
      resp
    );
  }

  return (
    <Box
      bg="gray.200"
      color="black"
      borderWidth="1px"
      borderRadius="lg"
      padding="16px"
      marginBottom="20px"
    >
      <Center fontWeight="bold" fontSize="lg" marginBottom="12px">
        STRK20 Privacy Pool
      </Center>

      {/* Block A — single action builder */}
      <Stack gap="10px" maxW="520px" margin="0 auto">
        <Field.Root>
          <Field.Label>Action type</Field.Label>
          <NativeSelect.Root>
            <NativeSelect.Field
              {...FIELD_STYLE}
              value={actionType}
              onChange={(e) => setActionType(e.currentTarget.value as ActionType)}
            >
              <option value="deposit">deposit</option>
              <option value="withdraw">withdraw</option>
              <option value="transfer">transfer</option>
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        </Field.Root>

        <Field.Root>
          <Field.Label>Token (fixed)</Field.Label>
          <Input {...FIELD_STYLE} value="STRK" readOnly />
        </Field.Root>

            <Field.Root>
              <Field.Label>Amount (smallest unit)</Field.Label>
              <Input
                {...FIELD_STYLE}
                ref={amountRef}
                value={groupDigits(amount)}
                onChange={handleAmountChange}
              />
            </Field.Root>

            {recipientNeeded && (
              <Field.Root required>
                {/* Red only while empty (required/missing); neutral once filled. */}
                <Field.Label
                  color={recipientFilled ? "gray.700" : "red.600"}
                  fontWeight="bold"
                >
                  Recipient (where funds go) <Field.RequiredIndicator />
                </Field.Label>
                <Input
                  borderColor={recipientFilled ? "gray.400" : "red.600"}
                  borderWidth="2px"
                  paddingX="12px"
                  placeholder="0x..."
                  value={recipient}
                  onChange={(e) => setRecipient(e.currentTarget.value)}
                />
              </Field.Root>
            )}

            {/* The simulate toggle applies ONLY to Prepare invoke — group them. */}
            <Box
              borderWidth="1px"
              borderColor="blue.400"
              borderRadius="md"
              bg="blue.50"
              padding="10px"
            >
              <Stack gap="10px" align="flex-start">
                <Checkbox.Root
                  checked={simulate}
                  onCheckedChange={(e) => setSimulate(e.checked === true)}
                >
                  <Checkbox.HiddenInput />
                  <Checkbox.Control />
                  <Checkbox.Label>
                    simulate (no proof, nothing submitted — recommended first)
                  </Checkbox.Label>
                </Checkbox.Root>
                <Button
                  {...BTN_STYLE}
                  colorPalette="blue"
                  variant="surface"
                  onClick={() => send("prepare")}
                >
                  Prepare invoke
                </Button>
              </Stack>
            </Box>

            {/* Invoke transaction always submits on-chain (no simulate). */}
            <Button
              {...BTN_STYLE}
              colorPalette="blue"
              variant="surface"
              onClick={() => send("invoke")}
            >
              Invoke transaction (submits on-chain)
            </Button>
      </Stack>

      <Separator borderColor="gray.400" marginY="16px" />

      {/* Block B — multi-action examples (invoke is only valid bundled, so it lives here) */}
      <Stack gap="12px" maxW="560px" margin="0 auto">
        <Center fontWeight="bold">Multi-action examples</Center>

        <ExampleCard
          title="1 — deposit 5 STRK + transfer 1 STRK → self"
          onRun={runDepositTransfer}
        />

        <ExampleCard
          title="2 — echo invoke round-trip (5 STRK)"
          description={
            'withdraw 5 STRK → helper, transfer "OPEN" → self, invoke helper ' +
            "[STRK, poolAddress, openNoteIds[0]]. Requires shielded STRK ≥ 5 (+ wallet fees)."
          }
          onRun={runEchoInvoke}
        />

        <ExampleCard
          warn
          title="3 — OPEN mismatch (expected to fail)"
          description={
            'transfer "OPEN" → self with no invoke to fill it. The wallet rejects ' +
            "this up-front (INVALID_REQUEST_PAYLOAD), before any proof or fee."
          }
          onRun={runOpenMismatch}
        />
      </Stack>

      <Separator borderColor="gray.400" marginY="16px" />

      {/* Block C — balances */}
      <Stack gap="8px" maxW="520px" margin="0 auto">
        <Field.Root>
          <Field.Label>Balances — tokens (comma-separated)</Field.Label>
          <Input
            {...FIELD_STYLE}
            value={balanceTokens}
            onChange={(e) => setBalanceTokens(e.currentTarget.value)}
          />
        </Field.Root>
        <HStack>
          <Button
            {...BTN_STYLE}
            colorPalette="blue"
            variant="surface"
            onClick={() =>
              queryBalances(
                balanceTokens
                  .split(",")
                  .map((t) => t.trim())
                  .filter((t) => t.length > 0)
              )
            }
          >
            Query
          </Button>
          <Button {...BTN_STYLE} colorPalette="blue" variant="surface" onClick={() => queryBalances([])}>
            All shielded tokens (empty array)
          </Button>
        </HStack>
      </Stack>

      {/* Result dialog */}
      <Dialog.Root placement="center" open={open} onOpenChange={onClose}>
        <Dialog.Positioner>
          <Dialog.Content
            margin="20px"
            padding="10px"
            maxH="85vh"
            display="flex"
            flexDirection="column"
            overflow="hidden"
          >
            <Dialog.Header>
              <Dialog.Title fontSize="lg" fontWeight="bold">
                STRK20 command result
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.Body flex="1" minH="0" overflowY="auto">
              {verdict && (
                <Box
                  marginBottom="12px"
                  padding="10px"
                  borderWidth="2px"
                  borderRadius="md"
                  borderColor={verdict.pending ? "gray.400" : verdict.ok ? "green.500" : "red.500"}
                  bg={verdict.pending ? "gray.50" : verdict.ok ? "green.50" : "red.50"}
                >
                  <HStack marginBottom="6px">
                    <Text fontSize="2xl">{verdict.pending ? "⏳" : verdict.ok ? "✅" : "❌"}</Text>
                    <Text
                      fontWeight="bold"
                      color={verdict.pending ? "gray.700" : verdict.ok ? "green.700" : "red.700"}
                    >
                      {verdict.title}
                    </Text>
                  </HStack>
                  <Stack gap="2px">
                    {verdict.rows.map((row) => (
                      <HStack key={row.label} fontSize="sm" align="baseline">
                        {row.ok !== undefined && <Text>{row.ok ? "✅" : "❌"}</Text>}
                        <Text fontWeight="bold">{row.label}:</Text>
                        <Text wordBreak="break-all">{row.value}</Text>
                      </HStack>
                    ))}
                  </Stack>
                </Box>
              )}
              <Text fontWeight="bold">Sent:</Text>
              <Text marginBottom="8px" wordBreak="break-all">
                {summary || "N/A"}
              </Text>
              <Text fontWeight="bold">Response:</Text>
              <Box as="pre" fontSize="sm" whiteSpace="pre-wrap" wordBreak="break-all">
                {response}
              </Box>
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.ActionTrigger asChild>
                <Button {...BTN_STYLE} colorScheme="red" onClick={onClose} ml={3} variant="surface">
                  OK
                </Button>
              </Dialog.ActionTrigger>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </Box>
  );
}
