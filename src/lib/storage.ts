import type { AppState, PromptTemplateId } from "./messages";
import { emptyResumes, type ResumeId } from "./resumes";

const STORAGE_KEY = "jobAnswerHelperState";
const isTemplateId = (value: unknown): value is PromptTemplateId =>
  value === "short" || value === "long" || value === "shortTechnical" || value === "custom";
const normalizeTemplateId = (value: unknown): PromptTemplateId =>
  value === "longTechnical" ? "long" : isTemplateId(value) ? value : defaultState.selectedTemplateId;

const isResumeId = (value: unknown): value is ResumeId => value === "1" || value === "2" || value === "3";

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
  customPrompt: "",
  latestPrompt: "",
  status: "idle",
  statusMessage: "Ready",
  lastError: ""
};

export const normalizeState = (saved: Partial<AppState> | undefined): AppState => {
  const selectedTemplateId = saved?.selectedTemplateId;
  const selectedResumeId = saved?.selectedResumeId;
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
    questions:
      saved?.questions?.map((question) => ({
        ...question,
        templateId: normalizeTemplateId(question.templateId)
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
