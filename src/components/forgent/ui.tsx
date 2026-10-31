import Link from "next/link";
import { ArrowRight, ArrowUpRight, BookOpen, Check, Code2, MessageSquare, ShieldCheck, Sparkles } from "lucide-react";

export function Eyebrow({children}:{children:React.ReactNode}) { return <span className="eyebrow"><span className="eyebrow-dot" />{children}</span>; }
export function SectionHeading({label,title,description}:{label:string;title:string;description?:string}) {return <div className="section-heading"><Eyebrow>{label}</Eyebrow><h2>{title}</h2>{description && <p>{description}</p>}</div>}
export function PreviewNote({children = "Interface preview · Live functionality coming in a later phase."}:{children?:React.ReactNode}) {return <div className="preview-note"><Sparkles size={15}/><span>{children}</span></div>}
export function SupportIcon({className=""}:{className?:string}) {return <span className={`support-icon ${className}`}><MessageSquare size={22} strokeWidth={1.7}/><span className="support-icon-dot"/></span>}
export function AgentRow() {return <Link className="agent-row" href="/agents/knowledge-support"><div className="agent-main"><SupportIcon/><div><div className="agent-name">Knowledge Support <ArrowUpRight size={15}/></div><p>Answers from your docs. Knows when to hand off.</p><div className="tag-row"><span>Customer support</span><span>Knowledge base</span><span>Discord</span></div></div></div><div className="agent-meta"><div><span className="meta-label">BUILDER</span><strong>Forgent Labs</strong></div><div><span className="meta-label">PRICING</span><strong>$0.0020 / run</strong></div><span className="row-arrow"><ArrowUpRight size={17}/></span></div></Link>}
export function CodePanel() {return <div className="code-panel"><div className="code-top"><div className="code-dots"><i/><i/><i/></div><span>request.ts</span><span className="code-language">TYPESCRIPT</span></div><pre><code><span className="code-purple">const</span> response = <span className="code-purple">await</span> fetch(<span className="code-green">&quot;/api/v1/runs&quot;</span>, {'{'}{`
`}  method: <span className="code-green">&quot;POST&quot;</span>,{`
`}  headers: {'{'}{`
`}    Authorization: <span className="code-green">`Bearer $&#123;FORGENT_API_KEY&#125;`</span>,{`
`}    <span className="code-green">&quot;Content-Type&quot;</span>: <span className="code-green">&quot;application/json&quot;</span>,{`
`}  {'}'},{`
`}  body: JSON.stringify({'{'}{`
`}    agent: <span className="code-green">&quot;knowledge-support&quot;</span>,{`
`}    input: {'{'} question: <span className="code-green">&quot;How do I get started?&quot;</span> {'}'},{`
`}  {'}'}),{`
`}{'}'});</code></pre><div className="code-bottom"><span><span className="online-dot"/> One endpoint, many possibilities</span><span>EXAMPLE REQUEST</span></div></div>}
export function FlowSteps(){return <div className="flow-grid"><article><span className="flow-number">01 / DISCOVER</span><div className="flow-icon"><BookOpen size={21}/></div><h3>Find the right agent.</h3><p>Explore specialized agents and understand what they can do before you integrate.</p></article><article><span className="flow-number">02 / CONNECT</span><div className="flow-icon"><Code2 size={21}/></div><h3>One key. One API.</h3><p>Use a consistent interface to put an agent to work in your application.</p></article><article><span className="flow-number">03 / BUILD</span><div className="flow-icon"><ShieldCheck size={21}/></div><h3>Build with confidence.</h3><p>See how agents perform against task-specific evaluations and pay per run.</p></article></div>}
export function FeatureCheck({children}:{children:React.ReactNode}){return <span className="feature-check"><Check size={14}/>{children}</span>}
export function ArrowLink({href,children}:{href:string;children:React.ReactNode}) {return <Link className="text-link" href={href}>{children}<ArrowRight size={16}/></Link>}
