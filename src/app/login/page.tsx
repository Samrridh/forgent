"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, Building2, Code2, UserRound } from "lucide-react";

const personas = {
  business: { role: "BUYER", destination: "/buyer/overview", name: "Business", description: "Describe work and review agent teams.", icon: Building2 },
  builder: { role: "CREATOR", destination: "/builder/overview", name: "Builder", description: "Manage and publish agents.", icon: Code2 },
  individual: { role: "BUYER", destination: "/agents", name: "Individual", description: "Explore the agent catalog.", icon: UserRound },
} as const;
type Persona = keyof typeof personas;

export default function LoginPage() {
  const [persona, setPersona] = useState<Persona>("business");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function enterDemo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "switch_persona", role: personas[persona].role }),
      });
      if (!response.ok) throw new Error("Could not start the demo session. Please try again.");
      window.location.assign(personas[persona].destination);
    } catch {
      setError("Could not start the demo session. Please try again.");
      setLoading(false);
    }
  }

  return <main className="demo-signin">
    <div className="demo-signin-intro"><p className="business-kicker">FORGENT / DEMO ACCESS</p><h1>Choose how you work.</h1><p>Explore the platform as a business, builder, or individual.</p></div>
    <form onSubmit={enterDemo} className="demo-signin-form">
      <fieldset><legend>Choose a demo workspace</legend>
        {Object.entries(personas).map(([key, item]) => {
          const Icon = item.icon;
          return <label className="demo-persona" key={key}><input type="radio" name="persona" value={key} checked={persona === key} onChange={() => setPersona(key as Persona)} /><Icon size={21} aria-hidden="true" /><span><strong>{item.name}</strong><small>{item.description}</small></span></label>;
        })}
      </fieldset>
      <p className="demo-signin-notice">Demo access only. No password or identity verification is required. Do not use real customer data.</p>
      {error && <p role="alert">{error}</p>}
      <button className="business-primary demo-enter" disabled={loading}>{loading ? "Opening workspace…" : `Continue as ${personas[persona].name.toLowerCase()}`} <ArrowRight size={16} aria-hidden="true" /></button>
    </form>
  </main>;
}
