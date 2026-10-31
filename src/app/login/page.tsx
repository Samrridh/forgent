import Link from "next/link";

export default function LoginPage() {
  return <div className="demo-signin">
    <div className="demo-signin-intro"><p className="business-kicker">FORGENT / DEMO ACCESS</p><h1>One workspace for agents.</h1><p>Explore agents, use the business workspace, or publish from the same demo session.</p></div>
    <div className="demo-signin-form"><p className="demo-signin-notice">Demo access only. No identity verification is required. Do not use real customer data.</p>
      <div className="business-agents">
        <article><h4>Explore agents</h4><p>Find and try an agent.</p><Link className="text-link" href="/agents">Browse agents</Link></article>
        <article><h4>Publish an agent</h4><p>Upload a package and review builder tools.</p><Link className="text-link" href="/publish">Open publish workspace</Link></article>
        <article><h4>Business workspace</h4><p>Describe work and explore agent teams.</p><Link className="text-link" href="/enterprise#workspace">Open workspace</Link></article>
      </div>
    </div>
  </div>;
}
