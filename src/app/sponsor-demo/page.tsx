import { MekoDemo } from "@/components/forgent/meko-demo";

const accounts = [
  { name: "Northstar Retail", previous: "$48,000", current: "$31,000", change: "−35%" },
  { name: "Harbor Stores", previous: "$32,000", current: "$24,000", change: "−25%" },
  { name: "Cedar Market", previous: "$20,000", current: "$21,000", change: "+5%" },
];
export default function SponsorDemoPage() {
  return <div className="business-workspace">
    <div className="business-heading"><p>SPONSOR DEMOS</p><h1>Context and insight, in practice.</h1><span>Two focused examples built for the Forgent demo.</span></div>
    <MekoDemo />
    <section className="business-panel" aria-labelledby="iomete-title">
      <span className="business-kicker">02 / IOMETE CONCEPT</span><h2 id="iomete-title">Find accounts that need attention</h2>
      <p>Concept only · fictional data · no IOMETE connection. A sales representative needs to spot customers whose purchases are falling. An IOMETE-backed lakehouse could bring order data together for this view.</p>
      <div className="business-agents">{accounts.map(account => <article key={account.name}><h4>{account.name}</h4><p>Previous quarter: {account.previous}<br />Current quarter: {account.current}</p><strong>{account.change}</strong></article>)}</div>
      <p><strong>Suggested follow-up:</strong> Contact Northstar Retail first; its purchases fell by $17,000 in this fictional example.</p>
    </section>
  </div>;
}
