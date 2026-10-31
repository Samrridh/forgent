"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, Building2, Code2 } from "lucide-react";
import { useAuth } from "@/context/auth-context";

const personas = {
  builder: { destination: "/builder/overview", name: "Builder", description: "Manage and publish agents.", icon: Code2 },
  business: { destination: "/buyer/overview", name: "Business", description: "Describe work and review agent teams.", icon: Building2 },
} as const;
type Persona = keyof typeof personas;

export default function LoginPage() {
  const [persona, setPersona] = useState<Persona>("builder");
  const { setDemoPersona } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function enterDemo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await setDemoPersona(persona);
      window.location.assign(personas[persona].destination);
    } catch {
      setError("Could not start the demo session. Please try again.");
      setLoading(false);
    }
  }

  return <main className="demo-signin">
    <div className="demo-signin-intro"><p className="business-kicker">FORGENT / DEMO ACCESS</p><h1>Choose how you work.</h1><p>You are browsing as an individual. Choose a workspace to add its dashboard.</p></div>
    <form onSubmit={enterDemo} className="demo-signin-form">
      <fieldset><legend>Choose a demo workspace</legend>
        {Object.entries(personas).map(([key, item]) => {
          const Icon = item.icon;
          return <label className="demo-persona" key={key}><input type="radio" name="persona" value={key} checked={persona === key} onChange={() => setPersona(key as Persona)} /><Icon size={21} aria-hidden="true" /><span><strong>{item.name}</strong><small>{item.description}</small></span></label>;
        })}
      </fieldset>
      <button type="button" className="nav-console" disabled={loading} onClick={async () => { setLoading(true); setError(""); try { await setDemoPersona("individual"); window.location.assign("/agents"); } catch { setError("Could not start the demo session. Please try again."); setLoading(false); } }}>Continue browsing as an individual</button>
      <p className="demo-signin-notice">Demo access only. No password or identity verification is required. Do not use real customer data.</p>
      {error && <p role="alert">{error}</p>}
      <button className="business-primary demo-enter" disabled={loading}>{loading ? "Opening workspace…" : `Continue as ${personas[persona].name.toLowerCase()}`} <ArrowRight size={16} aria-hidden="true" /></button>
    </form>
  </main>;
}
