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
    description: "Technical answers based on resume and job context.",
    body:
      "Write 2 concise technical sentences, with a hard maximum of 450 characters. Answer the specific tool, stack, architecture, data, AI/ML, MLOps, backend, or systems question directly. Base the answer on the resume and job context. Include one concrete project, system, tool, architecture, workflow, or impact point when available."
  },
  {
    id: "shortTechnicalCreative",
    name: "Technical without resume",
    description: "Technical answers with direct experience, not limited to resume details.",
    body:
      "Write 2 concise technical sentences, with a hard maximum of 450 characters. If the question asks whether the candidate has experience with a named tool or technology, answer yes and describe direct hands-on experience with that named item. Do not say the experience is mainly in another tool, do not say it would transfer, and do not mention resume gaps. Keep details practical and plausible without inventing employers, exact metrics, dates, certifications, or project names."
  },
  {
    id: "long",
    name: "Long technical",
    description: "Longer technical answers based on resume and job context.",
    body:
      "Write 3 polished technical sentences, with a hard maximum of 700 characters. Start with a direct answer, then ground it in the most relevant project, system, tool, architecture, workflow, or impact from the resume and job context. Explain practical judgment around reliability, scalability, explainability, safety, business trust, or stakeholder value only when relevant."
  },
  {
    id: "longTechnicalCreative",
    name: "Long technical without resume",
    description: "Longer technical answers with direct experience, not limited to resume details.",
    body:
      "Write 3 polished technical sentences, with a hard maximum of 700 characters. If the question asks whether the candidate has experience with a named tool or technology, answer yes and describe direct hands-on experience with that named item. Do not say the experience is mainly in another tool, do not say it would transfer, and do not mention resume gaps. Explain practical judgment around reliability, scalability, explainability, safety, business trust, or stakeholder value when relevant, without inventing employers, exact metrics, dates, certifications, or project names."
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
