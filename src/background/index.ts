import { buildPrompt } from "../lib/promptBuilder";
import { createId, type AppState, type GenerateResponse, type GeneratedAnswer, type RuntimeMessage } from "../lib/messages";
import { loadState, patchState } from "../lib/storage";

const CHATGPT_URL = "https://chatgpt.com/";
const CHATGPT_MATCH = /^https:\/\/(chatgpt\.com|chat\.openai\.com)\//;

chrome.runtime.onInstalled.addListener(() => {
  void chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});

chrome.action.onClicked.addListener((tab) => {
  if (tab.windowId) {
    void chrome.sidePanel.open({ windowId: tab.windowId });
  }
});

const notifyPanel = async (patch: Partial<AppState>) => {
  await patchState(patch);
};

const focusTargetJobTab = async () => {
  const state = await loadState();
  if (!state.targetTabId) {
    return;
  }

  try {
    const tab = await chrome.tabs.get(state.targetTabId);
    if (tab.windowId) {
      await chrome.windows.update(tab.windowId, { focused: true });
    }
    await chrome.tabs.update(state.targetTabId, { active: true });
  } catch {
    // The original job tab may have been closed; generation should still succeed.
  }
};

const isChatGptTab = (tab: chrome.tabs.Tab) => Boolean(tab.url && CHATGPT_MATCH.test(tab.url));

const findChatGptTab = async () => {
  const [activeInWindow] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (activeInWindow && isChatGptTab(activeInWindow)) {
    return activeInWindow;
  }

  const inWindow = await chrome.tabs.query({ currentWindow: true });
  const windowMatch = inWindow.find(isChatGptTab);
  if (windowMatch) {
    return windowMatch;
  }

  const tabs = await chrome.tabs.query({});
  return tabs.find(isChatGptTab);
};

const waitForTabLoaded = (tabId: number) =>
  new Promise<void>((resolve) => {
    chrome.tabs.get(tabId, (tab) => {
      if (tab.status === "complete") {
        resolve();
        return;
      }

      const listener: Parameters<typeof chrome.tabs.onUpdated.addListener>[0] = (updatedTabId, info) => {
        if (updatedTabId === tabId && info.status === "complete") {
          chrome.tabs.onUpdated.removeListener(listener);
          resolve();
        }
      };
      chrome.tabs.onUpdated.addListener(listener);
    });
  });

const createChatGptTab = async () => {
  const created = await chrome.tabs.create({ url: CHATGPT_URL, active: true });
  if (!created.id) {
    throw new Error("Could not open ChatGPT tab.");
  }

  await waitForTabLoaded(created.id);
  return created.id;
};

/** Reuse the open ChatGPT tab/conversation. Only open chatgpt.com when no tab exists. */
const getOrCreateChatGptTab = async () => {
  const existing = await findChatGptTab();
  if (existing?.id) {
    // Activate only — do not set url, or the page reloads and drops the current chat.
    await chrome.tabs.update(existing.id, { active: true });
    await waitForTabLoaded(existing.id);
    return existing.id;
  }

  return createChatGptTab();
};

const injectChatGptAdapter = async (tabId: number) => {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["dist/assets/chatgpt.js"]
    });
  } catch {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["assets/chatgpt.js"]
    });
  }
};

const sendToTab = <T>(tabId: number, message: RuntimeMessage): Promise<T> =>
  new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, (response: T) => {
      const error = chrome.runtime.lastError;
      if (error) {
        reject(new Error(error.message));
        return;
      }

      resolve(response);
    });
  });

const extractJson = (text: string) => {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  const candidate = fenced ?? trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("No JSON object found in ChatGPT response.");
  }

  return JSON.parse(candidate.slice(start, end + 1)) as { answers?: GeneratedAnswer[]; coverLetter?: string };
};

const generateAnswers = async (message: Extract<RuntimeMessage, { type: "GENERATE_ANSWERS" }>): Promise<GenerateResponse> => {
  const prompt = buildPrompt(message.payload);

  try {
    await notifyPanel({
      latestPrompt: prompt,
      status: "opening-chatgpt",
      statusMessage: "Using your current ChatGPT session...",
      lastError: ""
    });

    const tabId = await getOrCreateChatGptTab();
    await injectChatGptAdapter(tabId);

    await notifyPanel({
      status: "submitting-prompt",
      statusMessage: "Submitting prompt in the open ChatGPT chat..."
    });

    const result = await sendToTab<{ ok: boolean; text?: string; error?: string }>(tabId, {
      type: "CHATGPT_SUBMIT_PROMPT",
      prompt
    });

    if (!result.ok || !result.text) {
      throw new Error(result.error ?? "ChatGPT did not return a response.");
    }

    await notifyPanel({
      status: "waiting-for-answer",
      statusMessage: "Parsing ChatGPT answer..."
    });

    const parsed = extractJson(result.text);
    if (!Array.isArray(parsed.answers)) {
      throw new Error("ChatGPT response JSON did not include an answers array.");
    }

    await notifyPanel({
      status: "done",
      statusMessage: "Answers generated. Returning to job page..."
    });
    await focusTargetJobTab();

    return { ok: true, answers: parsed.answers, coverLetter: parsed.coverLetter ?? "", rawText: result.text, prompt };
  } catch (error) {
    return {
      ok: false,
      prompt,
      error: error instanceof Error ? error.message : String(error)
    };
  }
};

chrome.runtime.onMessage.addListener((message: RuntimeMessage, sender, sendResponse) => {
  if (message.type === "CAPTURE_SELECTION") {
    void (async () => {
      const current = await loadState();
      const next =
        message.kind === "jobDescription"
          ? {
              ...current,
              jobDescription: message.text,
              targetTabId: sender.tab?.id,
              statusMessage: "Job description captured."
            }
          : {
              ...current,
              targetTabId: sender.tab?.id,
              questions: [
                ...current.questions,
                {
                  id: createId(),
                  text: message.text,
                  templateId: current.selectedTemplateId,
                  technicalAnswerMode: current.technicalAnswerMode
                }
              ],
              statusMessage: "Question added."
            };

      await notifyPanel(next);
      if (sender.tab?.windowId) {
        await chrome.sidePanel.open({ windowId: sender.tab.windowId });
      }
      sendResponse({ ok: true });
    })();
    return true;
  }

  if (message.type === "OPEN_SIDE_PANEL") {
    if (sender.tab?.windowId) {
      void chrome.sidePanel.open({ windowId: sender.tab.windowId });
    }
    sendResponse({ ok: true });
    return true;
  }

  if (message.type === "CHECK_CAPTURE_ACTIVE") {
    void loadState().then((state) => {
      sendResponse({ active: Boolean(sender.tab?.id && sender.tab.id === state.activeCaptureTabId) });
    });
    return true;
  }

  if (message.type === "GENERATE_ANSWERS") {
    void generateAnswers(message).then(sendResponse);
    return true;
  }

  return undefined;
});
