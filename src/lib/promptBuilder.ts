import { getTemplate } from "./promptTemplates";
import type { GeneratePayload } from "./messages";

export const buildPrompt = ({
  jobDescription,
  resumeText,
  includeResume,
  questions,
  templateId,
  customPrompt
}: GeneratePayload) => {
  const fallbackTemplate = getTemplate(templateId);
  const resumeSection =
    includeResume && resumeText.trim()
      ? ["", "Resume:", resumeText.trim()]
      : ["", "Resume:", "No resume was provided for this generation. Use only the job description and question text."];
  const questionLines = questions
    .map((question, index) => {
      const template = getTemplate(question.templateId ?? fallbackTemplate.id);
      const instructions = template.id === "custom" ? customPrompt.trim() : template.body;
      return [
        `${index + 1}. [${question.id}] ${question.text.trim()}`,
        `Template: ${template.name}`,
        `Instructions: ${instructions || "Write clear, honest, role-specific answers in a professional tone."}`
      ].join("\n");
    })
    .join("\n");

  return [
    "You are helping draft answers for a job application.",
    "Use only the provided job description, optional resume, and questions. Do not invent employers, metrics, tools, or projects.",
    "When supported by the source material, make answers specific with projects, architectures, tools, measurable impact, reliability, explainability, safety, and business trust.",
    "",
    "Return only valid JSON. Do not wrap the JSON in markdown.",
    "The JSON shape must be:",
    '{"answers":[{"questionId":"the id from the question","question":"question text","answer":"tailored answer"}]}',
    "",
    "Job description:",
    jobDescription.trim(),
    ...resumeSection,
    "",
    "Questions and per-question instructions:",
    questionLines
  ].join("\n");
};
