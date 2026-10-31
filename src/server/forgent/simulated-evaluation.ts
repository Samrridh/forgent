import type { EvaluationCase, EvaluationReport } from "./contracts";

const checks = [
  "Endpoint availability", "Input format", "Response format", "Required fields",
  "Response time", "Error handling", "Answer relevance", "Source references",
  "Unknown question handoff", "Missing information", "Instruction handling", "Fallback behavior",
];

// Demo-only results: no endpoint, agent, or model is invoked.
export async function simulateEvaluation(onProgress?:(result:EvaluationCase,completed:number,total:number)=>void):Promise<EvaluationReport>{
 const cases:EvaluationCase[]=[];
 for(const [index,name] of checks.entries()){
  if(onProgress) await new Promise(resolve=>setTimeout(resolve,120));
  const result={id:`demo-${index+1}`,name,passed:true,detail:"Illustrative result for the demo.",latencyMs:0};
  cases.push(result);onProgress?.(result,cases.length,checks.length);
 }
 return {testedAt:new Date().toISOString(),passed:true,cases,answeredPassed:6,handoffsPassed:6,simulated:true};
}
