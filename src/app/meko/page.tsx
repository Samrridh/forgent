import Link from "next/link";
import { MekoDemo } from "@/components/forgent/meko-demo";
export default function MekoPage(){return <div className="business-workspace"><div className="business-heading"><p>MEKO / LIVE HANDOFF</p><h1>Context that carries forward.</h1><span>Follow a support question as it moves between agents.</span></div><MekoDemo/><p><Link className="text-link" href="/agents/iomete-sales-insights">Explore the IOMETE agent demo →</Link></p></div>}
