import type { AppState, PromptTemplateId, TechnicalAnswerMode } from "./messages";
import { emptyResumes, type ResumeId } from "./resumes";

const STORAGE_KEY = "jobAnswerHelperState";
const isTemplateId = (value: unknown): value is PromptTemplateId =>
  value === "short" ||
  value === "shortTechnical" ||
  value === "shortTechnicalCreative" ||
  value === "long" ||
  value === "longTechnicalCreative" ||
  value === "custom";
const normalizeTemplateId = (value: unknown): PromptTemplateId =>
  value === "longTechnical" ? "long" : isTemplateId(value) ? value : defaultState.selectedTemplateId;
const normalizeQuestionTemplateId = (templateId: unknown, answerMode: unknown): PromptTemplateId => {
  const normalizedTemplateId = normalizeTemplateId(templateId);

  if (answerMode === "creative") {
    if (normalizedTemplateId === "shortTechnical") {
      return "shortTechnicalCreative";
    }
    if (normalizedTemplateId === "long") {
      return "longTechnicalCreative";
    }
  }

  return normalizedTemplateId;
};

const isResumeId = (value: unknown): value is ResumeId => value === "1" || value === "2" || value === "3";
const isTechnicalAnswerMode = (value: unknown): value is TechnicalAnswerMode =>
  value === "resume" || value === "creative";

export const defaultState: AppState = {
  jobDescription: "",
  selectedResumeId: "1",
  resumes: emptyResumes(),
  includeResume: false,
  generateCoverLetter: false,
  coverLetterSentenceCount: 5,
  coverLetterText: "",
  questions: [],
  selectedTemplateId: "shortTechnical",
  technicalAnswerMode: "resume",
  customPrompt: "",
  latestPrompt: "",
  status: "idle",
  statusMessage: "Ready",
  lastError: ""
};

export const normalizeState = (saved: Partial<AppState> | undefined): AppState => {
  const selectedTemplateId = saved?.selectedTemplateId;
  const selectedResumeId = saved?.selectedResumeId;
  const technicalAnswerMode = saved?.technicalAnswerMode;
  const legacyResumeText = (saved as { resumeText?: string } | undefined)?.resumeText;
  const resumes = { ...emptyResumes(), ...saved?.resumes };

  if (legacyResumeText?.trim() && !resumes["1"].trim()) {
    resumes["1"] = legacyResumeText;
  }

  return {
    ...defaultState,
    ...saved,
    selectedResumeId: isResumeId(selectedResumeId) ? selectedResumeId : defaultState.selectedResumeId,
    resumes,
    selectedTemplateId: normalizeTemplateId(selectedTemplateId),
    technicalAnswerMode: isTechnicalAnswerMode(technicalAnswerMode)
      ? technicalAnswerMode
      : defaultState.technicalAnswerMode,
    questions:
      saved?.questions?.map((question) => ({
        ...question,
        templateId: normalizeQuestionTemplateId(question.templateId, question.technicalAnswerMode),
        technicalAnswerMode: isTechnicalAnswerMode(question.technicalAnswerMode)
          ? question.technicalAnswerMode
          : isTechnicalAnswerMode(technicalAnswerMode)
            ? technicalAnswerMode
            : defaultState.technicalAnswerMode
      })) ?? defaultState.questions
  };
};

export const loadState = async (): Promise<AppState> => {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  return normalizeState(result[STORAGE_KEY] as Partial<AppState> | undefined);
};

export const saveState = async (state: AppState): Promise<void> => {
  await chrome.storage.local.set({ [STORAGE_KEY]: state });
};

export const patchState = async (patch: Partial<AppState>): Promise<AppState> => {
  const current = await loadState();
  const next = { ...current, ...patch };
  await saveState(next);
  return next;
};

export const clearState = async (): Promise<void> => {
  await saveState(defaultState);
};
