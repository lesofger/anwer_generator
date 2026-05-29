import type { PromptTemplate } from "./messages";

export const promptTemplates: PromptTemplate[] = [
  {
    id: "short",
    name: "Short behavioral",
    description: "Brief answers around 250 characters for general or behavioral questions.",
    body:
      "Write around 250 characters, with a hard maximum of 320 characters. Use this for general, motivation, fit, communication, collaboration, ownership, or behavioral questions. Answer naturally and directly without forcing technical projects, architecture, tools, metrics, reliability, explainability, or safety unless the question clearly asks for them. Keep it specific to the role and candidate, concise enough for a small form field, and free of filler, exaggeration, or generic enthusiasm."
  },
  {
    id: "long",
    name: "Long technical",
    description: "Substantial technical answers grounded in relevant experience and impact.",
    body:
      "Write 4 to 6 polished sentences. Start with a direct answer that clearly addresses the question and mirrors the role's needs. Ground the answer in the candidate's most relevant resume evidence, such as specific projects, systems, tools, architectures, AI/ML workflows, backend work, full-stack work, or measurable impact when supported. For specific tool questions, claim exact tool experience only when supported; otherwise frame adjacent experience with comparable data systems, cloud services, distributed systems, retrieval, analytics, infrastructure, or backend architecture in a confident but honest way. Explain practical judgment around reliability, scalability, explainability, safety, business trust, or stakeholder value only when relevant. Keep it concrete, human, and senior-engineer-like, without inventing experience or repeating the same point."
  },
  {
    id: "shortTechnical",
    name: "Short technical",
    description: "Concise technical answers for tool, stack, or systems questions.",
    body:
      "Write 2 to 3 concise technical sentences, around 350 to 500 characters. Answer the specific tool, stack, architecture, data, AI/ML, MLOps, backend, or systems question directly. If exact named-tool experience is supported, mention it clearly; if not, do not claim it, and instead connect adjacent experience with the same class of system, such as distributed storage, analytical databases, event-driven pipelines, vector/RAG systems, cloud infrastructure, or production data workflows. Include one concrete project, tool, architecture, or impact point when supported."
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
