"use client";

import { useState } from "react";
import { Connection, PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js";
import { Buffer } from "buffer";
import { ArrowUpRight, Download, ShieldCheck } from "lucide-react";
import { MEMO_PREFIX, ReceiptBundleSchema, receiptHash, type EvaluationReceipt } from "@/lib/solana-evaluation-receipt";
import styles from "./solana-receipt.module.css";

type Wallet = { connect: () => Promise<{ publicKey: PublicKey }>; signTransaction: (transaction: Transaction) => Promise<Transaction> };
type Bundle = { receipt: EvaluationReceipt; signature: string };
const memoProgram = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");
const rpc = "https://api.devnet.solana.com";

export function SolanaReceipt({ agentId, category, checks }: { agentId: string; category: string; checks: string[] }) {
  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function record() {
    setBusy(true); setMessage("");
    try {
      const wallet = (window as Window & { solana?: Wallet }).solana;
      if (!wallet?.connect || !wallet.signTransaction) throw new Error("Install a Solana wallet such as Phantom and switch it to devnet.");
      const { publicKey } = await wallet.connect();
      const receipt: EvaluationReceipt = { version: "forgent-evaluation-v1", agentId, category, recordedAt: new Date().toISOString(), evaluation: "simulated", scorePercent: 94, universalChecks: ["Endpoint responds", "Response format", "Timeout handling", "Required fields"], taskChecks: checks.map((name, index) => ({ name, scorePercent: [96, 94, 91][index] })) };
      const hash = await receiptHash(receipt);
      const connection = new Connection(rpc, "confirmed");
      const latest = await connection.getLatestBlockhash("confirmed");
      const transaction = new Transaction({ feePayer: publicKey, ...latest }).add(new TransactionInstruction({ keys: [], programId: memoProgram, data: Buffer.from(MEMO_PREFIX + hash, "utf8") }));
      const signed = await wallet.signTransaction(transaction);
      const signature = await connection.sendRawTransaction(await signed.serialize());
      setBundle({ receipt, signature });
      setMessage("Transaction submitted. Confirm it on devnet, then verify the receipt below.");
      const confirmation = await connection.confirmTransaction({ signature, ...latest }, "confirmed");
      if (confirmation.value.err) throw new Error("The devnet transaction failed. No verified receipt was created.");
      setMessage("Transaction confirmed on devnet. Download the receipt to verify it later.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not record the receipt."); }
    finally { setBusy(false); }
  }

  async function verify() {
    if (!bundle) return;
    setBusy(true); setMessage("");
    try {
      const parsed = ReceiptBundleSchema.parse(bundle);
      const hash = await receiptHash(parsed.receipt);
      const transaction = await new Connection(rpc, "confirmed").getParsedTransaction(parsed.signature, { commitment: "confirmed", maxSupportedTransactionVersion: 0 });
      if (!transaction) throw new Error("Transaction is not available on devnet yet. Try again shortly.");
      if (transaction.meta?.err || !transaction.meta) throw new Error("The devnet transaction did not succeed.");
      const found = transaction.transaction.message.instructions.some(instruction => "parsed" in instruction && instruction.programId.equals(memoProgram) && instruction.parsed === MEMO_PREFIX + hash);
      setMessage(found ? "Verified: the receipt matches the confirmed devnet memo. Its evaluation is simulated." : "Verification failed: this receipt does not match the devnet transaction.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Verification failed."); }
    finally { setBusy(false); }
  }

  function download() {
    if (!bundle) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" }));
    const link = document.createElement("a"); link.href = url; link.download = "forgent-solana-receipt.json"; link.click(); URL.revokeObjectURL(url);
  }

  return <div className={styles.receipt}>
    <div className={styles.heading}><ShieldCheck size={20} aria-hidden="true"/><div><span>SOLANA DEVNET / SIMULATED REPORT</span><h3>Verify this sample report</h3></div></div>
    <p>Record a hash of this illustrative report on Solana devnet. A matching hash proves the receipt has not changed; it does not prove the checks were run.</p>
    <p>Use a devnet-enabled Solana wallet with devnet SOL for the transaction fee. No customer data or agent code is sent on-chain.</p>
    <div className={styles.actions}><button type="button" className="button button-dark" disabled={busy} onClick={record}>{busy ? "Working…" : "Record on devnet"}</button><label className={styles.upload}>Import receipt<input type="file" accept="application/json,.json" disabled={busy} onChange={async event => { try { const file = event.target.files?.[0]; if (!file) return; if (file.size > 20000) throw new Error("Receipt file is too large."); const parsed = ReceiptBundleSchema.parse(JSON.parse(await file.text())); if (parsed.receipt.agentId !== agentId) throw new Error("This receipt belongs to another agent."); setBundle(parsed); setMessage("Receipt loaded. Select Verify receipt to compare it with devnet."); } catch { setMessage("Could not load this receipt for the current agent."); } event.target.value = ""; }}/></label></div>
    {bundle && <div className={styles.result}><span>TRANSACTION SIGNATURE</span><code>{bundle.signature}</code><div className={styles.actions}><button type="button" className="button button-outline" disabled={busy} onClick={verify}>Verify receipt</button><button type="button" className="button button-outline" onClick={download}><Download size={15}/> Download receipt</button><a href={`https://explorer.solana.com/tx/${bundle.signature}?cluster=devnet`} target="_blank" rel="noreferrer">View on Solana Explorer <ArrowUpRight size={14}/></a></div></div>}
    {message && <p className={styles.message} role="status">{message}</p>}
  </div>;
}
