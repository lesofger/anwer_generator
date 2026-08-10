import type { RuntimeMessage } from "../lib/messages";

const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

const findPromptBox = (): HTMLElement | null => {
  const selectors = [
    'form[data-type="unified-composer"] #prompt-textarea[contenteditable="true"]',
    "#prompt-textarea.ProseMirror[contenteditable='true']",
    "#prompt-textarea[contenteditable='true']",
    "[data-testid='prompt-textarea'][contenteditable='true']",
    "textarea[data-testid='prompt-textarea']",
    "textarea#prompt-textarea",
    "div[contenteditable='true'][data-testid='prompt-textarea']"
  ];

  for (const selector of selectors) {
    const element = document.querySelector<HTMLElement>(selector);
    if (element) {
      return element;
    }
  }

  return null;
};

const findSubmitButton = (): HTMLButtonElement | null => {
  const selectors = [
    "button[data-testid='send-button']",
    "button[aria-label='Send prompt']",
    "button[aria-label='Send message']",
    "button[aria-label*='Send']"
  ];

  for (const selector of selectors) {
    const button = document.querySelector<HTMLButtonElement>(selector);
    if (button && !button.disabled && button.getAttribute("aria-disabled") !== "true") {
      return button;
    }
  }

  return null;
};

const isGenerating = () => {
  if (document.querySelector("button[data-testid='stop-button']")) {
    return true;
  }

  if (document.querySelector(".result-streaming[aria-busy='true'], [data-testid*='thinking'], [data-testid*='reasoning']")) {
    return true;
  }

  return Array.from(document.querySelectorAll<HTMLButtonElement>("button")).some((button) => {
    const label = `${button.getAttribute("aria-label") ?? ""} ${button.innerText ?? ""}`.toLowerCase();
    return /stop|stopping/.test(label) && !button.disabled;
  });
};

const getAssistantMessages = () => {
  const selectors = [
    "[data-message-author-role='assistant']",
    "section[data-turn='assistant'][data-testid^='conversation-turn-']",
    "[data-testid*='conversation-turn'] [markdown]",
    ".markdown"
  ];

  for (const selector of selectors) {
    const messages = Array.from(document.querySelectorAll<HTMLElement>(selector))
      .map((element) => element.innerText.trim())
      .filter(Boolean);
    if (messages.length > 0) {
      return messages;
    }
  }

  return [];
};

const setPromptText = (box: HTMLElement, prompt: string) => {
  box.focus();

  if (box instanceof HTMLTextAreaElement) {
    const nativeSetter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
    if (nativeSetter) {
      nativeSetter.call(box, prompt);
    } else {
      box.value = prompt;
    }
    box.dispatchEvent(new Event("input", { bubbles: true }));
    return;
  }

  // Current ChatGPT composer is a ProseMirror contenteditable (#prompt-textarea).
  const selection = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(box);
  selection?.removeAllRanges();
  selection?.addRange(range);

  const inserted = document.execCommand("insertText", false, prompt);
  const accepted = (box.innerText ?? "").trim().length > 0;

  if (!inserted || !accepted) {
    box.textContent = prompt;
    box.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: prompt }));
  }
};

const waitForPromptBox = async () => {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const box = findPromptBox();
    if (box) {
      return box;
    }
    await sleep(250);
  }

  throw new Error("Could not find the ChatGPT prompt box. Make sure you are logged in.");
};

const waitForSendButton = async () => {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const button = findSubmitButton();
    if (button) {
      return button;
    }
    await sleep(250);
  }

  throw new Error("Could not find the ChatGPT send button.");
};

const waitForNewAssistantMessage = async (previousCount: number, previousLatest: string) => {
  let stableText = "";
  let stableTicks = 0;

  for (let attempt = 0; attempt < 240; attempt += 1) {
    const messages = getAssistantMessages();
    const latest = messages.at(-1) ?? "";
    const isNewMessage =
      (messages.length > previousCount || (latest && latest !== previousLatest)) && Boolean(latest);

    if (isNewMessage) {
      if (latest === stableText) {
        stableTicks += 1;
      } else {
        stableText = latest;
        stableTicks = 0;
      }

      if (stableTicks >= 6 && !isGenerating()) {
        return latest;
      }
    }

    await sleep(500);
  }

  throw new Error("Timed out waiting for ChatGPT response.");
};

const requestReturnToJobTab = () => {
  try {
    void chrome.runtime.sendMessage({ type: "FOCUS_JOB_TAB" } satisfies RuntimeMessage);
  } catch {
    // Background may already be focusing; this is a best-effort backup.
  }
};

const submitPrompt = async (prompt: string) => {
  const beforeMessages = getAssistantMessages();
  const beforeCount = beforeMessages.length;
  const previousLatest = beforeMessages.at(-1) ?? "";
  const box = await waitForPromptBox();
  setPromptText(box, prompt);
  await sleep(100);
  const button = await waitForSendButton();
  button.click();
  const text = await waitForNewAssistantMessage(beforeCount, previousLatest);
  requestReturnToJobTab();
  return text;
};

if (window.__jobAnswerHelperChatGptListener) {
  chrome.runtime.onMessage.removeListener(window.__jobAnswerHelperChatGptListener);
}

window.__jobAnswerHelperChatGptListener = (message: RuntimeMessage, _sender, sendResponse) => {
  if (message.type !== "CHATGPT_SUBMIT_PROMPT") {
    return undefined;
  }

  void submitPrompt(message.prompt)
    .then((text) => sendResponse({ ok: true, text }))
    .catch((error) => sendResponse({ ok: false, error: error instanceof Error ? error.message : String(error) }));

  return true;
};

chrome.runtime.onMessage.addListener(window.__jobAnswerHelperChatGptListener);

declare global {
  interface Window {
    __jobAnswerHelperChatGptListener?: Parameters<typeof chrome.runtime.onMessage.addListener>[0];
  }
}
