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
import { json, num, walletV6 } from "starknet";
import type { WalletWithStarknetFeatures as WalletWithStarknetFeaturesV6 } from "@starknet-io/get-starknet-wallet-standard/features";
import type { WALLET_API } from "@starknet-io/types-js";
import * as constants from "@/utils/constants";
import { useStoreWallet } from "../../Wallet/walletContext";

type ActionType = "deposit" | "withdraw" | "transfer" | "invoke";

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

export default function Strk20Panel() {
  const walletObject = useStoreWallet((state) => state.StarknetWalletObject);
  const connectedAddress = useStoreWallet((state) => state.address);
  const wallet = walletObject as unknown as WalletWithStarknetFeaturesV6 | undefined;

  const { open, onOpen, onClose } = useDisclosure();
  const [summary, setSummary] = useState<string>("");
  const [response, setResponse] = useState<string>("N/A");

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

  function show(sum: string, resp: string) {
    setSummary(sum);
    setResponse(resp);
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

  function buildAction(): WALLET_API.STRK20_ACTION | undefined {
    switch (actionType) {
      case "deposit":
        // FELT amounts must be 0x-prefixed hex; the input holds a decimal string.
        return { type: "deposit", token: TOKEN, amount: num.toHex(amount) };
      case "withdraw":
        return { type: "withdraw", token: TOKEN, amount: num.toHex(amount), recipient };
      case "transfer":
        return { type: "transfer", token: TOKEN, amount: num.toHex(amount), recipient };
      default:
        return undefined; // invoke: under development
    }
  }

  async function send(kind: "prepare" | "invoke") {
    if (!wallet) return;
    const action = buildAction();
    if (!action) return;
    if (recipientNeeded && !recipient) {
      show(`${actionType} (blocked)`, `Recipient is required for ${actionType}.`);
      return;
    }
    const label =
      kind === "prepare"
        ? `prepareInvoke (simulate=${simulate}) — ${describe(action)}`
        : `invokeTransaction — ${describe(action)}`;
    let resp: string;
    try {
      const r =
        kind === "prepare"
          ? await walletV6.strk20PrepareInvoke(wallet, [action], simulate)
          : await walletV6.strk20InvokeTransaction(wallet, [action]);
      resp = formatResult(r);
    } catch (err: any) {
      resp = formatError(err);
    }
    show(label, resp);
  }

  async function loadMultiActionExample() {
    if (!wallet) return;
    if (!connectedAddress) {
      show("multi-action example (blocked)", "Connect a wallet first (recipient = connected account).");
      return;
    }
    // deposit 5 STRK, then transfer a fixed 1 STRK back to self.
    const actions: WALLET_API.STRK20_ACTION[] = [
      { type: "deposit", token: constants.addrSTRK, amount: num.toHex(FIVE_STRK) },
      {
        type: "transfer",
        token: constants.addrSTRK,
        amount: num.toHex(ONE_STRK),
        recipient: connectedAddress,
      },
    ];
    let resp: string;
    try {
      const r = await walletV6.strk20InvokeTransaction(wallet, actions);
      resp = formatResult(r);
    } catch (err: any) {
      resp = formatError(err);
    }
    show(actions.map(describe).join("  +  ") + "  (invokeTransaction — on-chain)", resp);
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
              <option value="invoke">invoke</option>
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        </Field.Root>

        {actionType === "invoke" ? (
          <Box bg="orange.100" borderWidth="1px" borderRadius="md" padding="10px">
            <Text fontWeight="bold">Invoke — under development</Text>
            <Text fontSize="sm">
              The invoke action bundles a call to a helper contract (e.g. an AMM
              swap), executed by the pool. Testing it needs a public helper contract
              address (not published) and a wallet-created open note. Deferred.
            </Text>
          </Box>
        ) : (
          <>
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
          </>
        )}
      </Stack>

      <Separator borderColor="gray.400" marginY="16px" />

      {/* Block B — multi-action examples */}
      <Stack gap="10px" align="center">
        <Button {...BTN_STYLE} colorPalette="cyan" variant="surface" onClick={loadMultiActionExample}>
          Run multi-action example on-chain (deposit 5 STRK + transfer 1 STRK → self)
        </Button>
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
