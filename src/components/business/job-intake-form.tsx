"use client";

import { ArrowRight, FileCode2, LockKeyhole } from "lucide-react";
import type { FormEvent } from "react";
import styles from "./job-intake-form.module.css";
import { CandidateProgress } from "./candidate-progress";

type Details = { inputs: string; outputs: string; rules: string; constraints: string };
const fields: { key: keyof Details; label: string; hint: string; placeholder: string }[] = [
  { key: "inputs", label: "Available inputs", hint: "What will the workflow work with?", placeholder: "For example, purchase orders and receiving records" },
  { key: "outputs", label: "Expected output", hint: "What should you receive at the end?", placeholder: "For example, a list of discrepancies with reasons" },
  { key: "rules", label: "Business rules", hint: "What makes an answer correct?", placeholder: "For example, flag quantities that do not match" },
  { key: "constraints", label: "Boundaries", hint: "What should the workflow avoid?", placeholder: "For example, do not modify the original records" },
];

export function JobIntakeForm({ objective, setObjective, details, setDetails, schema, setSchema, error, setError, loading, onSubmit }: {
  objective: string; setObjective: (value: string) => void; details: Details; setDetails: (value: Details) => void;
  schema: string; setSchema: (value: string) => void; error: string; setError: (value: string) => void;
  loading: boolean; onSubmit: (event: FormEvent) => void;
}) {
  return <section className={styles.page}>
    <header className={styles.header}><span className={styles.eyebrow}>01 / JOB INTAKE</span><h2>What do you need done?</h2><p>Tell us about the work. We’ll use your answers to suggest agents and possible workflows.</p></header>
    <form onSubmit={onSubmit} className={styles.form}>
      <div className={styles.sectionHeading}><div><span className={styles.sectionNumber}>01</span><h3>The outcome</h3><p>Start with the result you want to achieve.</p></div><span className={styles.required}>REQUIRED</span></div>
      <label className={styles.field}><span className={styles.label}>Business outcome</span><span className={styles.hint}>Describe the task in your own words.</span><textarea required minLength={10} maxLength={4000} value={objective} onChange={(event) => setObjective(event.target.value)} placeholder="Compare purchase orders with receiving records and flag discrepancies." rows={4} /><span className={styles.counter}>{objective.length} / 4,000</span></label>
      <div className={styles.sectionHeading}><div><span className={styles.sectionNumber}>02</span><h3>How the work gets done</h3><p>Add what you know. You can leave any of these blank.</p></div><span className={styles.optional}>OPTIONAL</span></div>
      <div className={styles.fieldGrid}>{fields.map(({ key, label, hint, placeholder }) => <label className={styles.field} key={key}><span className={styles.label}>{label}</span><span className={styles.hint}>{hint}</span><textarea maxLength={2000} value={details[key]} onChange={(event) => setDetails({ ...details, [key]: event.target.value })} placeholder={placeholder} rows={4} /></label>)}</div>
      <div className={styles.sectionHeading}><div><span className={styles.sectionNumber}>03</span><h3>Data structure</h3><p>Share a schema if it helps explain your data.</p></div><span className={styles.optional}>OPTIONAL</span></div>
      <label className={styles.upload}><FileCode2 size={21} aria-hidden="true" /><span><strong>{schema ? "Schema added" : "Add a Prisma schema"}</strong><small>.prisma file · up to 200 KB</small></span><span className={styles.uploadAction}>Choose file</span><input type="file" accept=".prisma" onChange={async (event) => { const file = event.target.files?.[0]; if (!file) { setSchema(""); return; } if (file.size > 200000) { setError("Schema exceeds the 200 KB limit."); event.target.value = ""; setSchema(""); return; } setError(""); setSchema(await file.text()); }} /></label>
      <div className={styles.privacy}><LockKeyhole size={16} aria-hidden="true" /><p>Your schema is parsed without connecting to your database. Its model descriptions and your answers may be sent to OpenRouter. Do not include secrets or real customer data.</p></div>
      {error && <p className={styles.error} role="alert">{error}</p>}
      {loading && <CandidateProgress />}
      <div className={styles.actions}><button type="submit" disabled={loading}>{loading ? "Preparing candidates…" : "Find candidates"}<ArrowRight size={16} aria-hidden="true" /></button><span>Next: review your options</span></div>
    </form>
  </section>;
}
