"use client";

import { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Center,
  Dialog,
  Stack,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { CallData, Contract, cairo, json, num, uint256, walletV6 } from "starknet";
import type { WalletWithStarknetFeatures as WalletWithStarknetFeaturesV6 } from "@starknet-io/get-starknet-wallet-standard/features";
import type { WALLET_API } from "@starknet-io/types-js";
import * as constants from "@/utils/constants";
import { formatBalance, shortHex } from "@/utils/utils";
import { useStoreWallet } from "../../Wallet/walletContext";
import { useFrontendProvider } from "../provider/providerContext";

// All actions are fixed to STRK (project decision).
const TOKEN = constants.addrSTRK;
// The sub-account driven by this panel. Each nonce maps to a distinct sub-account.
const NONCE = "0x0";
// Amounts, in the token's smallest unit (1e18 = 1 STRK).
const ONE_STRK = 10n ** 18n;
const HALF_STRK = 5n * 10n ** 17n;
const BTN_STYLE = { paddingX: "20px" } as const;
// The wallet does not always raise its window by itself when a request arrives, which
// looks like the DAPP hanging. Say so rather than leave the log silent.
const WALLET_HINT = "waiting for the wallet — open it manually if nothing pops up\n";

// Signed STRK amount, for the "before → after" lines of the verification.
function signedStrk(amount: bigint): string {
  return amount < 0n ? `-${formatBalance(-amount, 18)}` : `+${formatBalance(amount, 18)}`;
}

// The wallet API types every calldata item as a FELT, so 0x-prefixed hex only, while
// CallData.compile emits decimal strings. Sending those raw gets the whole payload
// rejected with INVALID_REQUEST_PAYLOAD, before any proof is even attempted.
function hexCalldata(...args: Parameters<typeof CallData.compile>): string[] {
  return CallData.compile(...args).map((item) => num.toHex(item));
}

function formatError(err: any): string {
  const message = err?.message ?? String(err);
  return err?.code !== undefined ? `Error ${err.code} = ${message}` : `Error: ${message}`;
}

// Every balance the verification compares before / after an action.
type Balances = { shielded: bigint; subAccount: bigint; user: bigint };

export default function Strk20SubAccountPanel() {
  const walletObject = useStoreWallet((state) => state.StarknetWalletObject);
  const connectedAddress = useStoreWallet((state) => state.address);
  const frontendProviderIndex = useFrontendProvider((s) => s.currentFrontendProviderIndex);
  const wallet = walletObject as unknown as WalletWithStarknetFeaturesV6 | undefined;

  const { open, onOpen, onClose } = useDisclosure();
  const [summary, setSummary] = useState<string>("");
  const [response, setResponse] = useState<string>("N/A");
  // An action keeps writing into the dialog after the transaction is sent : it waits for
  // the receipt, then compares the balances. Closing at that point would hide the result,
  // so OK stays disabled until it is done. `finally` always clears the flag, including
  // when the action throws, and "Close anyway" is there for the case where waiting for a
  // receipt drags on to its timeout.
  const [busy, setBusy] = useState<boolean>(false);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    try {
      await action();
    } finally {
      setBusy(false);
    }
  }

  const provider = constants.myFrontendProviders[frontendProviderIndex];
  const anonymizerAddress = constants.Strk20AnonymizerAddress[frontendProviderIndex];

  // TEMPORARY DIAGNOSTIC — counts the raw wallet-api requests, below starknet.js, to find
  // out why an invoke asks for approval twice. Every request emitted adds a line to the
  // dialog log :
  //   one line, two approval windows  -> the wallet duplicates its UI
  //   two lines                       -> something on this side calls it twice
  // It reports its own failures too : a silent probe proves nothing.
  const appendRef = useRef<(text: string) => void>(() => {});
  // Patched on `injected`, NOT on `features['starknet:walletApi']` : that one is a getter
  // rebuilding a fresh object with a freshly bound `request` on every access, so patching
  // it silently does nothing. `injected` is the wallet extension itself, and
  // StarknetInjectedWallet#request only delegates to it — so this counts exactly what
  // crosses the boundary between this app and the wallet.
  useEffect(() => {
    const injected = (wallet as any)?.injected;
    if (!injected) {
      console.log("[wallet-api] no `injected` on the wallet object, keys =", Object.keys(wallet ?? {}));
      return;
    }
    if (injected.__requestCounterInstalled) return;
    const original = injected.request.bind(injected);
    let count = 0;
    try {
      injected.request = (...args: any[]) => {
        count += 1;
        const line = `[wallet-api] request #${count} : ${args[0]?.type}`;
        console.log(line, ...args);
        appendRef.current(`${line}\n`);
        return original(...args);
      };
      injected.__requestCounterInstalled = true;
      console.log("[wallet-api] request counter installed on the injected wallet");
    } catch (err) {
      console.log("[wallet-api] cannot patch injected.request :", err);
    }
  }, [wallet]);

  // The wallet asks the user to approve the commitment computation, so keep the result
  // instead of asking again on every button : it only depends on the DAPP name, the
  // connected account and the network, all three in the cache key below. sessionStorage
  // rather than a ref, because in dev every recompile remounts the component and would
  // otherwise trigger the wallet popup again. The partial commitment is meant to be
  // published to the DAPP anyway, so storing it reveals nothing more.
  async function partialCommitment(): Promise<string> {
    if (!wallet) throw new Error("No wallet connected.");
    const key = `strk20Commitment|${constants.Strk20DappName}|${connectedAddress}|${frontendProviderIndex}`;
    const cached = sessionStorage.getItem(key);
    if (cached) return cached;
    const partial = num.toHex(
      await walletV6.strk20SubaccountCommitment(wallet, constants.Strk20DappName)
    );
    sessionStorage.setItem(key, partial);
    return partial;
  }

  // The dialog is a running log : an action can span two transactions and several waits,
  // and overwriting it would hide what already happened. `show` starts a new log, `append`
  // adds to it. The ref holds the text because the appends are asynchronous and would
  // otherwise read a stale state value.
  const logRef = useRef<string>("");

  function show(sum: string, resp: string) {
    logRef.current = resp;
    setSummary(sum);
    setResponse(resp);
    onOpen();
  }

  function append(text: string) {
    logRef.current += text;
    setResponse(logRef.current);
  }
  // The patched request above writes through this, so it always uses the current append.
  appendRef.current = append;

  // Resolve the sub-account address from the partial commitment computed by the wallet.
  // The wallet API never returns the address, so it has to be rebuilt through the
  // anonymizer : `get_sub_accounts` gives the deterministic address even before the
  // sub-account is deployed. The anonymizer ABI is read on-chain.
  async function resolveSubAccount(): Promise<{
    address: string;
    isDeployed: boolean;
    partial: string;
    poolContract: string;
  }> {
    const partial = await partialCommitment();
    const { abi } = await provider.getClassAt(anonymizerAddress);
    const anonymizer = new Contract({ abi, address: anonymizerAddress, providerOrAccount: provider });
    const [info] = await anonymizer.get_sub_accounts(partial, NONCE, num.toHex(BigInt(NONCE) + 1n));
    // The anonymizer is bound to one pool at deployment, with no setter. If that pool is
    // not the one the wallet drives, this whole address resolution is off : the wallet
    // would be using another anonymizer, hence another identity_key and another address.
    const poolContract = num.toHex(await anonymizer.get_privacy_contract());
    return {
      address: num.toHex(info.address),
      isDeployed: Boolean(info.is_deployed),
      partial,
      poolContract,
    };
  }

  async function publicStrk(address: string): Promise<bigint> {
    const r = await provider.callContract({
      contractAddress: TOKEN,
      entrypoint: "balance_of",
      calldata: [address],
    });
    return uint256.uint256ToBN({ low: r[0], high: r[1] });
  }

  async function shieldedStrk(): Promise<bigint> {
    if (!wallet) return 0n;
    const entries = await walletV6.strk20Balances(wallet, [TOKEN]);
    const entry = entries.find((e) => BigInt(e.token) === BigInt(TOKEN));
    return entry ? BigInt(entry.balance) : 0n;
  }

  async function snapshot(subAccount: string): Promise<Balances> {
    const [shielded, sub, user] = await Promise.all([
      shieldedStrk(),
      publicStrk(subAccount),
      connectedAddress ? publicStrk(connectedAddress) : Promise.resolve(0n),
    ]);
    return { shielded, subAccount: sub, user };
  }

  // The three balances that moved, as text.
  function balanceReport(before: Balances, after: Balances): string {
    const line = (label: string, b: bigint, a: bigint) =>
      `${label.padEnd(24)}: ${formatBalance(b, 18)} → ${formatBalance(a, 18)}  (${signedStrk(a - b)})`;
    return [
      line("sub-account public STRK", before.subAccount, after.subAccount),
      line("shielded STRK", before.shielded, after.shielded),
      line("wallet public STRK", before.user, after.user),
    ].join("\n");
  }

  // ---- resolve only ----------------------------------------------------------------

  const handleResolve = async () => {
    if (!wallet) return;
    try {
      const { address, isDeployed, partial, poolContract } = await resolveSubAccount();
      const balances = await snapshot(address);
      show(
        `resolve sub-account — dapp_name "${constants.Strk20DappName}", nonce ${NONCE}`,
        [
          `anonymizer contract: ${anonymizerAddress}`,
          `pool contract      : ${poolContract}`,
          `partial commitment : ${partial}`,
          `sub-account        : ${address}`,
          `is_deployed        : ${isDeployed}`,
          "",
          `sub-account public STRK : ${formatBalance(balances.subAccount, 18)}`,
          `shielded STRK           : ${formatBalance(balances.shielded, 18)}`,
        ].join("\n")
      );
    } catch (err: any) {
      show("resolve sub-account", formatError(err));
    }
  };

  // ---- fund the sub-account, 100 % outside STRK20 ------------------------------------

  // Plain ERC-20 transfer from the wallet's base account to the sub-account address : no
  // privacy pool involved at all. This is the "received from the outside" case, and the
  // funds it parks there can later be swept in without any deposit, hence without AML
  // screening.
  const handleFund = async () => {
    if (!wallet) return;
    let subAccount: string;
    try {
      subAccount = (await resolveSubAccount()).address;
    } catch (err: any) {
      show("fund sub-account", formatError(err));
      return;
    }
    const label = `fund sub-account — public ERC-20 transfer of 1 STRK (no STRK20 action)`;
    show(label, `sub-account : ${subAccount}\n`);
    const before = await snapshot(subAccount);
    append(WALLET_HINT);
    let txH: string;
    try {
      const r = await walletV6.addInvokeTransaction(wallet, {
        calls: [
          {
            contract_address: TOKEN,
            entry_point: "transfer",
            calldata: hexCalldata([subAccount, cairo.uint256(ONE_STRK)]),
          },
        ],
      });
      txH = r.transaction_hash;
    } catch (err: any) {
      append(`${formatError(err)}\n`);
      return;
    }
    append(`transaction_hash = ${txH}\nWaiting for the receipt…\n`);
    try {
      await provider.waitForTransaction(txH, { retries: 100, retryInterval: 3000 });
      const after = await snapshot(subAccount);
      const gained = after.subAccount - before.subAccount;
      append(
        `\n--- verification ---\n${balanceReport(before, after)}\n\n` +
          (gained === ONE_STRK
            ? "✅ sub-account funded with 1 STRK, entirely outside STRK20\n"
            : `❌ unexpected gain : ${signedStrk(gained)} STRK\n`)
      );
    } catch (err: any) {
      append(`${formatError(err)}\n`);
    }
  };

  // ---- sweep back into the shielded balance, one per collect_policy -------------------

  // Create an open note owned by the user, then run a call AS the sub-account and collect
  // its STRK into that note. No deposit action, so no AML screening applies.
  //
  // `all`   : the whole balance → the sub-account ends at 0.
  // `exact` : a fixed amount → the rest stays parked on the sub-account.
  // `diff`  : only what the interaction itself brought in, so the call has to actually
  //           pull funds : `transfer_from(user, sub-account, 1 STRK)` executed as the
  //           sub-account, which first needs the user to approve it (step 1 below).
  const handleSweep = async (policy: WALLET_API.STRK20_COLLECT_POLICY) => {
    if (!wallet) return;
    if (!connectedAddress) {
      show("sweep", "Connect a wallet first : the open note recipient is the connected account.");
      return;
    }
    let subAccount: string;
    try {
      subAccount = (await resolveSubAccount()).address;
    } catch (err: any) {
      show(`sweep — collect_policy "${policy.type}"`, formatError(err));
      return;
    }

    const label =
      `sweep sub-account → shielded — collect_policy "${policy.type}"` +
      (policy.type === "exact" ? ` (${formatBalance(BigInt(policy.amount), 18)} STRK)` : "");
    show(label, `sub-account : ${subAccount}\n`);
    const before = await snapshot(subAccount);

    // `diff` needs an incoming transfer during the interaction : approve the sub-account
    // first, from the wallet's base account (a public, non-STRK20 transaction).
    if (policy.type === "diff") {
      append(`\nstep 1/2 : approve the sub-account for 1 STRK\n${WALLET_HINT}`);
      try {
        const r = await walletV6.addInvokeTransaction(wallet, {
          calls: [
            {
              contract_address: TOKEN,
              entry_point: "approve",
              calldata: hexCalldata([subAccount, cairo.uint256(ONE_STRK)]),
            },
          ],
        });
        append(`approve tx = ${r.transaction_hash}\nWaiting for the receipt…\n`);
        await provider.waitForTransaction(r.transaction_hash, { retries: 100, retryInterval: 3000 });
        append("approve confirmed ✅\n");
      } catch (err: any) {
        append(`approve failed — ${formatError(err)}\n`);
        return;
      }
      append("\nstep 2/2 : sweep\n");
    }

    // The call executed AS the sub-account. The spec requires at least one call, so for
    // `all` / `exact` a harmless read is enough ; for `diff` it is what brings funds in.
    const calls: WALLET_API.Call[] =
      policy.type === "diff"
        ? [
            {
              contract_address: TOKEN,
              entry_point: "transfer_from",
              calldata: hexCalldata([connectedAddress, subAccount, cairo.uint256(ONE_STRK)]),
            },
          ]
        : [{ contract_address: TOKEN, entry_point: "balance_of", calldata: [subAccount] }];

    const actions: WALLET_API.STRK20_ACTION[] = [
      { type: "transfer", token: TOKEN, amount: "OPEN", recipient: connectedAddress },
      {
        type: "subaccount_invoke",
        dapp_name: constants.Strk20DappName,
        nonce: NONCE,
        calls,
        collect_policy: policy,
      },
    ];

    let txH: string;
    // Logged before sending : if the wallet never answers, this is the exact payload to
    // hand over when reporting the hang.
    append(`\nactions sent :\n${json.stringify(actions, undefined, 2)}\n${WALLET_HINT}`);
    try {
      const r = await walletV6.strk20InvokeTransaction(wallet, actions);
      txH = r.transaction_hash;
    } catch (err: any) {
      append(`${formatError(err)}\n`);
      return;
    }
    append(`transaction_hash = ${txH}\nWaiting for the receipt…\n`);

    try {
      const receipt: any = await provider.waitForTransaction(txH, { retries: 400, retryInterval: 3000 });
      const reverted =
        receipt?.execution_status === "REVERTED" || (receipt?.isSuccess && !receipt.isSuccess());
      const after = await snapshot(subAccount);
      const collected = before.subAccount - after.subAccount;

      // The shielded delta is NOT the pass criterion : the wallet inserts its own fee
      // withdrawal into the proven action set, so the shielded balance grows by less
      // than the collected amount.
      let ok: boolean;
      let expected: string;
      switch (policy.type) {
        case "all":
          ok = after.subAccount === 0n;
          expected = "the whole balance is collected, the sub-account is left at 0";
          break;
        case "exact":
          ok = collected === BigInt(policy.amount);
          expected = `exactly ${formatBalance(BigInt(policy.amount), 18)} STRK is collected, the rest stays parked`;
          break;
        case "diff":
          // The sub-account gained 1 STRK during the call and gave the same amount back,
          // so its balance is unchanged and the user paid the 1 STRK.
          ok = after.subAccount === before.subAccount && before.user - after.user >= ONE_STRK;
          expected = "only the 1 STRK gained during the call is collected, the parked balance is untouched";
          break;
      }
      append(
        `execution_status = ${reverted ? "REVERTED" : "SUCCEEDED"}\n\n` +
          `--- verification ---\n${balanceReport(before, after)}\n` +
          `collected from sub-account : ${formatBalance(collected, 18)} STRK\n` +
          `expected : ${expected}\n\n` +
          (reverted
            ? "❌ transaction reverted\n"
            : ok
              ? `✅ collect_policy "${policy.type}" verified\n`
              : `❌ collect_policy "${policy.type}" — unexpected result\n`)
      );
    } catch (err: any) {
      append(`${formatError(err)}\n`);
    }
  };

  return (
    <Box bg="gray.200" color="black" borderWidth="1px" borderRadius="lg" padding="16px" marginBottom="20px">
      <Center fontWeight="bold" fontSize="lg" marginBottom="4px">
        STRK20 sub-account
      </Center>
      <Center fontSize="sm" marginBottom="12px" textAlign="center">
        dapp_name &quot;{constants.Strk20DappName}&quot;, nonce {NONCE} — anonymizer{" "}
        {shortHex(anonymizerAddress)}
      </Center>

      <Stack gap="10px" maxW="560px" margin="0 auto">
        <Text fontSize="sm">
          The wallet API never returns a sub-account address, so if necessary every button below first
          rebuilds it from the partial commitment through the anonymizer&apos;s{" "}
          <b>get_sub_accounts</b> view, then runs its call and reports the balances that
          moved.
        </Text>

        <Button
          {...BTN_STYLE}
          colorPalette="blue"
          variant="surface"
          disabled={busy}
          onClick={() => run(handleResolve)}
        >
          Resolve sub-account address
        </Button>

        <Button
          {...BTN_STYLE}
          colorPalette="cyan"
          variant="surface"
          disabled={busy}
          onClick={() => run(handleFund)}
        >
          Fund 1 STRK — public transfer, outside STRK20
        </Button>

        <Button
          {...BTN_STYLE}
          colorPalette="green"
          variant="surface"
          disabled={busy}
          onClick={() => run(() => handleSweep({ type: "all" }))}
        >
          Sweep → shielded — collect_policy &quot;all&quot;
        </Button>
        <Button
          {...BTN_STYLE}
          colorPalette="green"
          variant="surface"
          disabled={busy}
          onClick={() => run(() => handleSweep({ type: "exact", amount: num.toHex(HALF_STRK) }))}
        >
          Sweep → shielded — collect_policy &quot;exact&quot; (0.5 STRK)
        </Button>
        <Button
          {...BTN_STYLE}
          colorPalette="green"
          variant="surface"
          disabled={busy}
          onClick={() => run(() => handleSweep({ type: "diff" }))}
        >
          Sweep → shielded — collect_policy &quot;diff&quot; (approve + transfer_from)
        </Button>
      </Stack>

      {/* While busy, ignore the outside click / Escape that would close the dialog. */}
      <Dialog.Root placement="center" open={open} onOpenChange={() => { if (!busy) onClose(); }}>
        <Dialog.Positioner>
          <Dialog.Content margin="20px" padding="10px" maxH="85vh" display="flex" flexDirection="column" overflow="hidden">
            <Dialog.Header>
              <Dialog.Title fontSize="lg" fontWeight="bold">
                STRK20 sub-account result
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.Body flex="1" minH="0" overflowY="auto">
              {busy && (
                <Box
                  marginBottom="10px"
                  padding="8px"
                  borderWidth="2px"
                  borderRadius="md"
                  borderColor="orange.400"
                  bg="orange.50"
                >
                  <Text fontWeight="bold" color="orange.700">
                    ⏳ Still running — wait for the verification before closing.
                  </Text>
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
              {/* Always available, so a receipt that never comes cannot trap the user. */}
              {/* Gives up on a call that never comes back : the wallet promise may stay
                  pending forever, so `run`'s finally would never release the panel. */}
              {busy && (
                <Button
                  {...BTN_STYLE}
                  variant="ghost"
                  onClick={() => {
                    setBusy(false);
                    onClose();
                  }}
                >
                  Close anyway
                </Button>
              )}
              <Dialog.ActionTrigger asChild>
                <Button
                  {...BTN_STYLE}
                  colorScheme="red"
                  onClick={onClose}
                  ml={3}
                  variant="surface"
                  disabled={busy}
                >
                  {busy ? "Waiting…" : "OK"}
                </Button>
              </Dialog.ActionTrigger>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </Box>
  );
}
