export type CaptureKind = "jobDescription" | "question";

export type PromptTemplateId = "short" | "long" | "longTechnical" | "custom";

export type GenerationStatus =
  | "idle"
  | "opening-chatgpt"
  | "submitting-prompt"
  | "waiting-for-answer"
  | "done"
  | "failed";

export interface JobQuestion {
  id: string;
  text: string;
  templateId?: PromptTemplateId;
  answer?: string;
}

export interface PromptTemplate {
  id: PromptTemplateId;
  name: string;
  description: string;
  body: string;
}

export interface AppState {
  jobDescription: string;
  resumeText: string;
  includeResume: boolean;
  useNewChatGptTab: boolean;
  targetTabId?: number;
  activeCaptureTabId?: number;
  questions: JobQuestion[];
  selectedTemplateId: PromptTemplateId;
  customPrompt: string;
  latestPrompt: string;
  status: GenerationStatus;
  statusMessage: string;
  lastError: string;
}

export interface GeneratePayload {
  jobDescription: string;
  resumeText: string;
  includeResume: boolean;
  useNewChatGptTab: boolean;
  questions: JobQuestion[];
  templateId: PromptTemplateId;
  customPrompt: string;
}

export interface GeneratedAnswer {
  questionId?: string;
  question: string;
  answer: string;
}

export interface GenerateResponse {
  ok: boolean;
  answers?: GeneratedAnswer[];
  rawText?: string;
  prompt?: string;
  error?: string;
}

export type RuntimeMessage =
  | {
      type: "CAPTURE_SELECTION";
      kind: CaptureKind;
      text: string;
      pageTitle: string;
      pageUrl: string;
    }
  | {
      type: "OPEN_SIDE_PANEL";
    }
  | {
      type: "CHECK_CAPTURE_ACTIVE";
    }
  | {
      type: "GENERATE_ANSWERS";
      payload: GeneratePayload;
    }
  | {
      type: "CHATGPT_SUBMIT_PROMPT";
      prompt: string;
    }
  | {
      type: "CHATGPT_RESULT";
      text: string;
    }
  | {
      type: "INSERT_ANSWER";
      answer: string;
      questionText?: string;
    };

export const createId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
