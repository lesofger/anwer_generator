import { buildPrompt } from "../lib/promptBuilder";
import { createId, type AppState, type GenerateResponse, type GeneratedAnswer, type RuntimeMessage } from "../lib/messages";
import { loadState, patchState } from "../lib/storage";

const CHATGPT_URL = "https://chatgpt.com/";
const CHATGPT_MATCH = /^https:\/\/(chatgpt\.com|chat\.openai\.com)\//;
const FOCUS_RETRY_DELAYS_MS = [0, 300, 900];

chrome.runtime.onInstalled.addListener(() => {
  void chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});

chrome.action.onClicked.addListener((tab) => {
  if (tab.windowId) {
    void chrome.sidePanel.open({ windowId: tab.windowId });
  }
});

/** Sidepanel holds this port open during generation so the MV3 worker is not suspended mid-wait. */
chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== "generation-keepalive") {
    return;
  }

  port.onMessage.addListener(() => {
    // Heartbeats are intentionally ignored; receiving them keeps the worker warm.
  });
});

const notifyPanel = async (patch: Partial<AppState>) => {
  await patchState(patch);
};

const tabStillExists = async (tabId: number) => {
  try {
    await chrome.tabs.get(tabId);
    return true;
  } catch {
    return false;
  }
};

/** Prefer an explicit tab, then pending/target/capture tabs from storage. */
const resolveReturnTabId = async (preferredTabId?: number) => {
  const state = await loadState();
  for (const candidate of [preferredTabId, state.pendingReturnTabId, state.targetTabId, state.activeCaptureTabId]) {
    if (candidate && (await tabStillExists(candidate))) {
      return candidate;
    }
  }

  return undefined;
};

const focusTab = async (tabId: number | undefined) => {
  if (!tabId) {
    return false;
  }

  try {
    const tab = await chrome.tabs.get(tabId);
    if (tab.windowId != null) {
      await chrome.windows.update(tab.windowId, { focused: true });
    }
    await chrome.tabs.update(tabId, { active: true });
    return true;
  } catch {
    return false;
  }
};

const focusTargetJobTab = async (preferredTabId?: number) => {
  const tabId = await resolveReturnTabId(preferredTabId);
  if (!tabId) {
    return false;
  }

  let focused = false;
  for (const delay of FOCUS_RETRY_DELAYS_MS) {
    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    if (await focusTab(tabId)) {
      focused = true;
      break;
    }
  }

  return focused;
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

/** Reuse the open ChatGPT tab, or force a brand-new conversation when requested. */
const getOrCreateChatGptTab = async (startNewChat: boolean) => {
  const existing = await findChatGptTab();
  if (existing?.id) {
    if (startNewChat) {
      await chrome.tabs.update(existing.id, { active: true, url: CHATGPT_URL });
      await waitForTabLoaded(existing.id);
      return existing.id;
    }

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
  const startNewChat = Boolean(message.startNewChat);
  const returnTabId = await resolveReturnTabId(message.returnTabId);

  try {
    await notifyPanel({
      latestPrompt: prompt,
      status: "opening-chatgpt",
      statusMessage: startNewChat ? "Opening a new ChatGPT chat..." : "Using your current ChatGPT session...",
      lastError: "",
      startNewChat,
      ...(returnTabId
        ? {
            targetTabId: returnTabId,
            pendingReturnTabId: returnTabId
          }
        : {})
    });

    const tabId = await getOrCreateChatGptTab(startNewChat);
    // Give a fresh ChatGPT page a moment for the composer to mount after navigation.
    if (startNewChat) {
      await new Promise((resolve) => setTimeout(resolve, 800));
    }
    await injectChatGptAdapter(tabId);

    await notifyPanel({
      status: "submitting-prompt",
      statusMessage: startNewChat
        ? "Submitting prompt in a new ChatGPT chat..."
        : "Submitting prompt in the open ChatGPT chat..."
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
      statusMessage: "Answers generated. Returning to job page...",
      pendingReturnTabId: undefined
    });
    await focusTargetJobTab(returnTabId);

    return { ok: true, answers: parsed.answers, coverLetter: parsed.coverLetter ?? "", rawText: result.text, prompt };
  } catch (error) {
    await notifyPanel({
      status: "failed",
      statusMessage: "Automation failed.",
      lastError: error instanceof Error ? error.message : String(error),
      pendingReturnTabId: undefined
    });
    await focusTargetJobTab(returnTabId);
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

  if (message.type === "FOCUS_JOB_TAB") {
    void focusTargetJobTab(message.tabId).then((ok) => sendResponse({ ok }));
    return true;
  }

  if (message.type === "GENERATE_ANSWERS") {
    void generateAnswers(message).then(sendResponse);
    return true;
  }

  return undefined;
});
