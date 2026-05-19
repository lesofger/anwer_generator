import type { RuntimeMessage } from "../lib/messages";

const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

const findPromptBox = (): HTMLElement | null => {
  const selectors = [
    "textarea[data-testid='prompt-textarea']",
    "textarea#prompt-textarea",
    "div[contenteditable='true'][data-testid='prompt-textarea']",
    "div[contenteditable='true']"
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
    "button[aria-label='Send message']"
  ];

  for (const selector of selectors) {
    const button = document.querySelector<HTMLButtonElement>(selector);
    if (button && !button.disabled) {
      return button;
    }
  }

  return null;
};

const getAssistantMessages = () => {
  const selectors = [
    "[data-message-author-role='assistant']",
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
    box.value = prompt;
    box.dispatchEvent(new Event("input", { bubbles: true }));
    return;
  }

  box.textContent = prompt;
  box.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: prompt }));
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

const waitForNewAssistantMessage = async (previousCount: number) => {
  let stableText = "";
  let stableTicks = 0;

  for (let attempt = 0; attempt < 240; attempt += 1) {
    const messages = getAssistantMessages();
    const latest = messages.at(-1) ?? "";

    if (messages.length > previousCount && latest) {
      if (latest === stableText) {
        stableTicks += 1;
      } else {
        stableText = latest;
        stableTicks = 0;
      }

      if (stableTicks >= 6 && !document.querySelector("button[data-testid='stop-button']")) {
        return latest;
      }
    }

    await sleep(500);
  }

  throw new Error("Timed out waiting for ChatGPT response.");
};

const submitPrompt = async (prompt: string) => {
  const beforeCount = getAssistantMessages().length;
  const box = await waitForPromptBox();
  setPromptText(box, prompt);
  const button = await waitForSendButton();
  button.click();
  return waitForNewAssistantMessage(beforeCount);
};

if (!window.__jobAnswerHelperChatGptLoaded) {
  window.__jobAnswerHelperChatGptLoaded = true;

  chrome.runtime.onMessage.addListener((message: RuntimeMessage, _sender, sendResponse) => {
    if (message.type !== "CHATGPT_SUBMIT_PROMPT") {
      return undefined;
    }

    void submitPrompt(message.prompt)
      .then((text) => sendResponse({ ok: true, text }))
      .catch((error) => sendResponse({ ok: false, error: error instanceof Error ? error.message : String(error) }));

    return true;
  });
}

declare global {
  interface Window {
    __jobAnswerHelperChatGptLoaded?: boolean;
  }
}
