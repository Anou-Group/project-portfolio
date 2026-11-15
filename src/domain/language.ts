/**
 * Language lint for manager-facing text.
 *
 * Errors are patterns that are never legitimate in the report (an AI as the actor,
 * conversational filler, internal commentary). Warnings are things a human must
 * read in context — technical words like "AI" or "Claude" are often legitimate
 * project content, so they are flagged, never rejected.
 */

export type LintSeverity = "error" | "warning";
export type LintFinding = { severity: LintSeverity; rule: string; message: string; excerpt: string };

type Rule = { id: string; severity: LintSeverity; pattern: RegExp; message: string };

const AI_ACTOR = String.raw`(?:claude(?:\s+code)?|chatgpt|gpt-?\d\w*|copilot|gemini|the\s+(?:ai|assistant|model|llm|agent)|an?\s+ai(?:\s+(?:agent|assistant|model))?|ai\s+(?:agent|assistant|model))`;
const WORK_VERB = String.raw`(?:analy[sz]ed|reviewed|implemented|generated|wrote|written|created|built|helped|assisted|identified|found|suggested|recommended|fixed|updated|drafted|prepared|investigated|noticed|discovered|completed|produced|designed|developed|refactored|researched|summari[sz]ed)`;

const RULES: Rule[] = [
  {
    id: "ai-as-actor",
    severity: "error",
    pattern: new RegExp(String.raw`\b${AI_ACTOR}\s+(?:has\s+|have\s+|had\s+|was\s+|then\s+)?${WORK_VERB}\b`, "i"),
    message: "Describes an AI tool as the one who did the work. Write it as Mahesh's work (\"Implemented …\").",
  },
  {
    id: "by-ai",
    severity: "error",
    pattern: new RegExp(String.raw`\b(?:generated|written|created|drafted|prepared|produced)\s+(?:by|with|using)\s+${AI_ACTOR}\b`, "i"),
    message: "Credits an AI tool for the work or the report. Remove it.",
  },
  {
    id: "ai-self-reference",
    severity: "error",
    pattern: /\b(?:as an ai|as a (?:large )?language model|i am an ai|i'm an ai|i am (?:an|your) assistant|i'm (?:an|your) assistant)\b/i,
    message: "AI self-reference.",
  },
  {
    id: "helping-someone",
    severity: "error",
    pattern: /\b(?:i|we)\s+(?:helped|assisted)\s+(?:mahesh|you|him)\b/i,
    message: "Written from an assistant's perspective. The report is Mahesh's own account.",
  },
  {
    id: "conversational",
    severity: "error",
    pattern:
      /\b(?:let me|i'll|i will now|here (?:are|is) (?:some|the|a)\b[^.]{0,40}\bfor you|for you to review|feel free|hope (?:this|that) helps|great question|happy to help|let me know|as requested|you asked|you mentioned|sure[,!]|certainly[,!]|absolutely[,!])/i,
    message: "Conversational language. Use neutral, report-style wording (e.g. \"Recommended next steps\").",
  },
  {
    id: "internal-commentary",
    severity: "error",
    pattern:
      /(?:<\/?(?:thinking|scratchpad|reasoning)>|\bscratch ?pad\b|\bchain[- ]of[- ]thought\b|\bsystem prompt\b|\bprompt:|\bmy reasoning\b|\binternal note\b|\bdebug(?:ging)? (?:note|output|log|commentary)\b|\blorem ipsum\b|\b(?:TODO|FIXME|XXX)\b)/,
    message: "Internal or development commentary must not appear in the report.",
  },
  {
    id: "tool-footer",
    severity: "error",
    pattern: /🤖|\bgenerated with \[?claude|\bco-authored-by:/i,
    message: "Tool attribution footer copied into the report.",
  },
  {
    id: "ai-mention",
    severity: "warning",
    pattern: /\b(?:claude|chatgpt|openai|anthropic|llm|copilot|ai)\b/i,
    message: "Mentions an AI tool or AI. Fine if it describes the project itself; not fine if it describes who did the work.",
  },
  {
    id: "placeholder-unknown",
    severity: "warning",
    pattern: /\b(?:TBC|TBA|TBD|N\/A|unknown)\b/,
    message: "Use the standard wording \"Pending confirmation\" for unknown values.",
  },
  {
    id: "unverified-claim",
    severity: "warning",
    pattern: /\b(?:fully tested|production[- ]ready|100\s?%|guaranteed|bug[- ]free|flawless|world[- ]class|seamless(?:ly)?)\b/i,
    message: "Strong claim. Check that evidence supports it, or soften it.",
  },
  {
    id: "first-person-plural-ai",
    severity: "warning",
    pattern: /\b(?:i think|i believe|i guess|i'm not sure|it seems like)\b/i,
    message: "Speculative first-person phrasing. State facts or mark as Pending confirmation.",
  },
];

export function lintText(text: string): LintFinding[] {
  const findings: LintFinding[] = [];
  for (const rule of RULES) {
    const m = rule.pattern.exec(text);
    if (!m) continue;
    // A warning that duplicates an error on the same words adds nothing.
    if (rule.severity === "warning" && rule.id === "ai-mention" && findings.some((f) => f.severity === "error")) continue;
    const start = Math.max(0, m.index - 30);
    const excerpt = `${start > 0 ? "…" : ""}${text.slice(start, m.index + m[0].length + 30)}${m.index + m[0].length + 30 < text.length ? "…" : ""}`;
    findings.push({ severity: rule.severity, rule: rule.id, message: rule.message, excerpt });
  }
  return findings;
}
