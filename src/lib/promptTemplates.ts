import type { PromptTemplate } from "./messages";

export const promptTemplates: PromptTemplate[] = [
  {
    id: "short",
    name: "Short",
    description: "Three-sentence answers for compact application fields.",
    body:
      "Write exactly 3 sentences. Sentence 1 should directly answer the question and connect the candidate to the role. Sentence 2 should mention one relevant project, architecture, tool, or measurable impact when supported by the resume or job description. Sentence 3 should close with business value, reliability, explainability, safety, or stakeholder trust. Keep the tone concise, honest, and application-ready."
  },
  {
    id: "long",
    name: "Long",
    description: "Five-sentence answers with stronger context and impact.",
    body:
      "Write exactly 5 sentences. Start with a direct answer that mirrors the role's needs. Include specific projects, architectures, tools, and measurable impact when the source material supports it. Explain how the candidate thinks about reliability, explainability, safety, and business trust in practical terms. Keep the answer polished, concrete, and human, without inventing experience."
  },
  {
    id: "longTechnical",
    name: "Long technical",
    description: "Seven-sentence answers for technical or senior-role questions.",
    body:
      "Write exactly 7 sentences. Give a direct answer, then ground it in specific technical evidence from the resume and job description. Mention relevant projects, architectures, tools, systems, data flows, model or agent workflows, evaluation methods, or deployment practices when supported by the source material. Show how the candidate designed for reliability, explainability, safety, and business trust. Include measurable impact or a credible business outcome when available. Make the answer technical enough for an engineering reviewer but clear enough for a recruiter. Do not fabricate details; if a detail is missing, speak in terms of approach and judgment."
  },
  {
    id: "custom",
    name: "Custom prompt",
    description: "Use your own instructions from the custom prompt box.",
    body: ""
  }
];

export const getTemplate = (templateId: string) =>
  promptTemplates.find((template) => template.id === templateId) ?? promptTemplates[0];
