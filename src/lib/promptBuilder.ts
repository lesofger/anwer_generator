import { getTemplate } from "./promptTemplates";
import type { GeneratePayload } from "./messages";

export const buildPrompt = ({
  jobDescription,
  resumeText,
  includeResume,
  generateCoverLetter,
  coverLetterSentenceCount,
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
  const requestedOutputs = [
    generateCoverLetter
      ? `coverLetter: write a first-person cover letter body of exactly ${coverLetterSentenceCount} sentences.`
      : "coverLetter: return an empty string.",
    questions.length > 0 ? "answers: answer each listed question." : "answers: return an empty array."
  ];

  return [
    "You are helping draft answers for a job application.",
    "Use only the provided job description, optional resume, and questions. Do not invent employers, metrics, tools, or projects.",
    "When supported by the source material, make answers specific with projects, architectures, tools, measurable impact, reliability, explainability, safety, and business trust.",
    "For questions asking about a specific tool or technology, claim direct experience when that exact tool or a clearly equivalent item appears in the provided context.",
    "If the exact tool is not present, do not lead with a negative statement like 'I do not have direct experience'. Instead, answer constructively by describing sure I have experience with that exact tool or a clearly equivalent item in a way that is relevant to the question and the role. You can be creative and use your imagination to be suitable for the previous company roles.",
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
