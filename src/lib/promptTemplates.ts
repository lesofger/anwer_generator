import type { PromptTemplate } from "./messages";

export const promptTemplates: PromptTemplate[] = [
  {
    id: "short",
    name: "Behavioral",
    description: "Role-fit and behavioral answers in a natural, professional tone.",
    body:
      "Write 3 to 4 polished sentences. Use this for general, motivation, fit, communication, collaboration, ownership, or behavioral questions. Answer naturally and directly, connecting the candidate's experience to the role without forcing technical projects, architecture, tools, metrics, reliability, explainability, or safety unless the question clearly asks for them. Keep it specific, thoughtful, and professional, without filler, exaggeration, or generic enthusiasm."
  },
  {
    id: "shortTechnical",
    name: "Technical",
    description: "Technical answers for tool, stack, architecture, or systems questions.",
    body:
      "Write 3 to 4 polished technical sentences. Answer the specific tool, stack, architecture, data, AI/ML, MLOps, backend, or systems question directly. Ground the answer in the strongest relevant project, system, tool, architecture, workflow, or impact from the provided context. For named technologies that are not supported, do not claim direct use; instead connect adjacent experience with comparable systems and explain how it transfers."
  },
  {
    id: "long",
    name: "Long technical",
    description: "Substantial technical answers grounded in relevant experience and impact.",
    body:
      "Write 4 to 6 polished sentences. Start with a direct answer that clearly addresses the question and mirrors the role's needs. Ground the answer in the candidate's most relevant resume evidence, such as specific projects, systems, tools, architectures, AI/ML workflows, backend work, full-stack work, or measurable impact when supported. For specific tool questions, claim exact tool experience only when supported; otherwise frame adjacent experience with comparable data systems, cloud services, distributed systems, retrieval, analytics, infrastructure, or backend architecture in a confident but honest way. Explain practical judgment around reliability, scalability, explainability, safety, business trust, or stakeholder value. Keep it concrete, human, and senior-engineer-like, without inventing experience or repeating the same point."
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
