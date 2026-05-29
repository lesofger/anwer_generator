import { getTemplate } from "./promptTemplates";
import type { GeneratePayload, PromptTemplateId } from "./messages";

const creativeTemplateIds = new Set<PromptTemplateId>(["shortTechnicalCreative", "longTechnicalCreative"]);

export const buildPrompt = ({
  jobDescription,
  resumeText,
  includeResume,
  generateCoverLetter,
  coverLetterSentenceCount,
  questions,
  templateId,
  technicalAnswerMode,
  customPrompt
}: GeneratePayload) => {
  const fallbackTemplate = getTemplate(templateId);
  const sourceInstruction = (mode: GeneratePayload["technicalAnswerMode"]) =>
    mode === "creative"
      ? "Answer source: creative. Use the job description and resume as context, but you may add plausible adjacent experience when needed. Do not invent employers, exact metrics, dates, certifications, or project names."
      : "Answer source: resume/context. Claim direct experience only when the exact tool or a clearly equivalent item appears in the provided context. If not present, avoid a blunt negative and describe adjacent experience with comparable systems and transferable patterns.";
  const resumeSection =
    includeResume && resumeText.trim()
      ? ["", "Resume:", resumeText.trim()]
      : ["", "Resume:", "No resume was provided for this generation. Use only the job description and question text."];
  const questionLines = questions
    .map((question, index) => {
      const template = getTemplate(question.templateId ?? fallbackTemplate.id);
      const instructions = template.id === "custom" ? customPrompt.trim() : template.body;
      const answerSourceMode = creativeTemplateIds.has(template.id)
        ? "creative"
        : template.id === "custom"
          ? technicalAnswerMode
          : "resume";
      return [
        `${index + 1}. [${question.id}] ${question.text.trim()}`,
        `Template: ${template.name}`,
        sourceInstruction(answerSourceMode),
        `Instructions: ${instructions || "Write clear, honest, role-specific answers in a professional tone."}`
      ].join("\n");
    })
    .join("\n");
  const requestedOutputs = [
    generateCoverLetter
      ? `coverLetter: write a first-person cover letter body of exactly ${coverLetterSentenceCount} sentences.`
      : "coverLetter: return an empty string.",
    questions.length > 0 ? "answers: answer each listed question." : "answers: return an empty array."
  ];

  return [
    "You are helping draft answers for a job application.",
    "Use the provided job description, optional resume, questions, and each question's answer source instruction.",
    "Do not invent employers, exact metrics, dates, certifications, or project names.",
    "When supported by the source material, make answers specific with projects, architectures, tools, measurable impact, reliability, explainability, safety, and business trust.",
    "",
    "Return only valid JSON. Do not wrap the JSON in markdown.",
    "The JSON shape must be:",
    '{"coverLetter":"cover letter text or empty string","answers":[{"questionId":"the id from the question","question":"question text","answer":"tailored answer"}]}',
    "",
    "Requested outputs:",
    ...requestedOutputs,
    "",
    "Cover letter instructions:",
    `If coverLetter is requested, write exactly ${coverLetterSentenceCount} sentences, no more and no less.`,
    "Return only the cover letter body text in the coverLetter field. Do not include greeting, closing, name, placeholders, headers, bullet points, lists, dates, addresses, or formatting.",
    "Write in a natural first-person voice, using phrases like I have built, I worked on, or I designed only when supported by the resume.",
    "Clearly connect the candidate's real experience from the resume to the specific job description.",
    "Mention concrete tools, systems, architectures, or projects only if they are explicitly supported by the provided resume.",
    "Highlight scalability, reliability, performance, ML/AI systems, business outcomes, or measurable impact only when evidenced by the provided material.",
    "Emphasize alignment with the company's needs based strictly on the job description, such as AI systems, backend architecture, MLOps, full-stack work, or other stated needs.",
    "Use smooth transitions between sentences so the result reads as one cohesive narrative.",
    "Sound like a senior engineer writing thoughtfully, not marketing copy. Avoid vague phrases like passionate, hardworking, or results-driven unless backed by specifics.",
    "Do not exaggerate, assume, invent experience, add generic filler, or repeat the same idea across sentences.",
    "",
    "Job description:",
    jobDescription.trim(),
    ...resumeSection,
    "",
    "Questions and per-question instructions:",
    questionLines || "No question answers requested."
  ].join("\n");
};
