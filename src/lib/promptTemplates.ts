import type { PromptTemplate } from "./messages";

export const promptTemplates: PromptTemplate[] = [
  {
    id: "short",
    name: "Short",
    description: "Brief answers around 250 characters for general application questions.",
    body:
      "Write around 250 characters, with a hard maximum of 320 characters. Answer the question directly in a natural, professional tone. Use this for general or non-technical application questions, so do not force projects, tools, architecture, metrics, reliability, explainability, or safety unless the question clearly asks for them. Keep it specific to the role and candidate, but concise enough for a small form field. Do not use filler, exaggeration, or generic enthusiasm."
  },
  {
    id: "long",
    name: "Long",
    description: "Substantial answers grounded in relevant experience and impact.",
    body:
      "Write 4 to 6 polished sentences. Start with a direct answer that clearly addresses the question and mirrors the role's needs. Ground the answer in the candidate's most relevant resume evidence, such as specific projects, systems, tools, architectures, AI/ML workflows, backend work, full-stack work, or measurable impact when supported. Explain the candidate's practical judgment around reliability, scalability, explainability, safety, business trust, or stakeholder value only when relevant to the question. Keep it concrete, human, and senior-engineer-like, without inventing experience or repeating the same point."
  },
  {
    id: "longTechnical",
    name: "Long technical",
    description: "Seven-sentence answers for technical or senior-role questions.",
    body:
      "Write 6 to 8 sentences for technical, architecture, senior-engineering, AI, ML, MLOps, backend, or systems questions. Open with a direct technical answer, then support it with the strongest relevant evidence from the resume and job description. Prioritize concrete projects, architectures, tools, data flows, model or agent workflows, evaluation methods, deployment practices, observability, CI/CD, performance, or scalability when explicitly supported. Emphasize how the candidate designed or would design for reliability, explainability, safety, maintainability, and business trust in practical engineering terms. Include measured impact, scale, performance improvement, quality improvement, or business outcome only when available in the source material. Make the answer credible to an engineering reviewer while still readable for a recruiter. Do not fabricate details; if something is not in the resume or job description, describe approach, tradeoffs, and judgment rather than pretending it happened."
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
