import type { CaptureKind, RuntimeMessage } from "../lib/messages";

const bubbleId = "job-answer-helper-bubble";
let lastEditable: HTMLInputElement | HTMLTextAreaElement | HTMLElement | null = null;

const isEditable = (target: EventTarget | null): target is HTMLInputElement | HTMLTextAreaElement | HTMLElement => {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target.isContentEditable;
};

const isUsableInput = (element: Element): element is HTMLInputElement | HTMLTextAreaElement | HTMLElement => {
  if (!(element instanceof HTMLElement)) {
    return false;
  }

  if (element instanceof HTMLInputElement) {
    return !["button", "checkbox", "file", "hidden", "radio", "reset", "submit"].includes(element.type) && !element.disabled;
  }

  if (element instanceof HTMLTextAreaElement) {
    return !element.disabled;
  }

  return element.isContentEditable;
};

const normalized = (text: string) => text.toLowerCase().replace(/\s+/g, " ").trim();

const significantWords = (text: string) =>
  Array.from(new Set(normalized(text).match(/[a-z0-9]{4,}/g) ?? [])).filter(
    (word) => !["that", "this", "with", "your", "have", "from", "they", "will", "what", "when", "where", "would"].includes(word)
  );

const isVisible = (element: HTMLElement) => {
  const rect = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);
  return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
};

const rememberEditable = (event: Event) => {
  if (isEditable(event.target)) {
    lastEditable = event.target;
  }
};

const selectedText = () => window.getSelection()?.toString().trim() ?? "";

const removeBubble = () => {
  document.getElementById(bubbleId)?.remove();
};

const isCurrentPageActive = async () => {
  const response = await chrome.runtime.sendMessage({ type: "CHECK_CAPTURE_ACTIVE" } satisfies RuntimeMessage);
  return Boolean(response?.active);
};

const sendCapture = (kind: CaptureKind, text: string) => {
  const message: RuntimeMessage = {
    type: "CAPTURE_SELECTION",
    kind,
    text,
    pageTitle: document.title,
    pageUrl: window.location.href
  };

  chrome.runtime.sendMessage(message);
  removeBubble();
};

const createButton = (label: string, onClick: () => void) => {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    onClick();
  });
  return button;
};

const showBubble = async () => {
  const text = selectedText();
  removeBubble();

  if (!text || !(await isCurrentPageActive())) {
    return;
  }

  const selection = window.getSelection();
  const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
  const rect = range?.getBoundingClientRect();

  if (!rect) {
    return;
  }

  const bubble = document.createElement("div");
  bubble.id = bubbleId;
  bubble.append(
    createButton("Set as job description", () => sendCapture("jobDescription", text)),
    createButton("Add question", () => sendCapture("question", text))
  );

  Object.assign(bubble.style, {
    position: "fixed",
    top: `${Math.max(12, rect.bottom + 10)}px`,
    left: `${Math.min(window.innerWidth - 280, Math.max(12, rect.left))}px`,
    zIndex: "2147483647",
    display: "flex",
    gap: "6px",
    padding: "8px",
    borderRadius: "12px",
    background: "#111827",
    boxShadow: "0 12px 30px rgba(15, 23, 42, 0.28)",
    fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
  });

  for (const button of Array.from(bubble.querySelectorAll("button"))) {
    Object.assign(button.style, {
      border: "0",
      borderRadius: "9px",
      padding: "8px 10px",
      background: "#f8fafc",
      color: "#111827",
      cursor: "pointer",
      fontSize: "12px",
      fontWeight: "700"
    });
  }

  document.body.append(bubble);
};

const fillEditable = (target: HTMLInputElement | HTMLTextAreaElement | HTMLElement, answer: string) => {
  target.focus();

  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
    target.value = answer;
    target.dispatchEvent(new Event("input", { bubbles: true }));
    target.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }

  target.textContent = "";
  document.execCommand("insertText", false, answer);
  target.dispatchEvent(new Event("input", { bubbles: true }));
  target.dispatchEvent(new Event("change", { bubbles: true }));
  return true;
};

const editableCandidates = () =>
  Array.from(document.querySelectorAll("textarea, input, [contenteditable='true']"))
    .filter(isUsableInput)
    .filter(isVisible);

const findQuestionElement = (questionText: string) => {
  const question = normalized(questionText);
  if (!question) {
    return null;
  }

  const snippets = [
    question.slice(0, 180),
    question.slice(0, 120),
    question.split(/[?.!]/)[0]?.slice(0, 120) ?? "",
    significantWords(question)
      .slice(0, 8)
      .join(" ")
  ].filter((snippet) => snippet.length >= 12);
  const words = significantWords(question);
  const matches = Array.from(document.body.querySelectorAll<HTMLElement>("label, legend, p, div, span, h1, h2, h3, h4, strong"))
    .filter(isVisible)
    .map((element) => {
      const text = normalized(element.innerText || element.textContent || "");
      const wordHits = words.filter((word) => text.includes(word)).length;
      const snippetHit = snippets.some((snippet) => text.includes(snippet) || snippet.includes(text));
      return { element, text, score: (snippetHit ? 100 : 0) + wordHits };
    })
    .filter(({ text, score }) => text.length >= 8 && score >= Math.min(5, Math.max(2, Math.ceil(words.length * 0.45))))
    .sort((a, b) => b.score - a.score || a.text.length - b.text.length);

  return matches[0]?.element ?? null;
};

const firstEditableAfter = (questionElement: HTMLElement) => {
  const candidates = editableCandidates();
  const questionRect = questionElement.getBoundingClientRect();

  for (let ancestor: HTMLElement | null = questionElement; ancestor && ancestor !== document.body; ancestor = ancestor.parentElement) {
    const inside = candidates.find(
      (candidate) =>
        ancestor.contains(candidate) &&
        candidate !== questionElement &&
        Boolean(questionElement.compareDocumentPosition(candidate) & Node.DOCUMENT_POSITION_FOLLOWING)
    );
    if (inside) {
      return inside;
    }
  }

  return candidates
    .map((candidate) => ({ candidate, rect: candidate.getBoundingClientRect() }))
    .filter(({ rect }) => rect.top >= questionRect.top - 6)
    .sort((a, b) => a.rect.top - b.rect.top || a.rect.left - b.rect.left)[0]?.candidate;
};

const insertAnswer = (answer: string, questionText?: string) => {
  const questionElement = questionText ? findQuestionElement(questionText) : null;
  const target = questionElement ? firstEditableAfter(questionElement) : lastEditable ?? document.activeElement;

  if (!isEditable(target)) {
    return { ok: false, copied: false };
  }

  fillEditable(target, answer);
  target.scrollIntoView({ behavior: "smooth", block: "center" });
  return { ok: true, copied: false };
};

const uploadCoverFile = (fileName: string, mimeType: string, base64: string) => {
  const input = Array.from(document.querySelectorAll<HTMLInputElement>("input[type='file']"))
    .filter(isVisible)
    .find((candidate) => {
      const text = normalized(
        [candidate.accept, candidate.name, candidate.id, candidate.getAttribute("aria-label") ?? "", candidate.closest("label")?.textContent ?? ""].join(
          " "
        )
      );
      return !text || text.includes("doc") || text.includes("pdf") || text.includes("cover") || text.includes("resume") || text.includes("upload");
    });

  if (!input) {
    return { ok: false };
  }

  const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
  const file = new File([bytes], fileName, { type: mimeType });
  const transfer = new DataTransfer();
  transfer.items.add(file);
  input.files = transfer.files;
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
  input.scrollIntoView({ behavior: "smooth", block: "center" });
  return { ok: true };
};

document.addEventListener("mouseup", () => window.setTimeout(showBubble, 80));
document.addEventListener("keyup", () => window.setTimeout(showBubble, 80));
document.addEventListener("focusin", rememberEditable);
document.addEventListener("mousedown", (event) => {
  if (!(event.target instanceof Node) || !document.getElementById(bubbleId)?.contains(event.target)) {
    removeBubble();
  }
});

chrome.runtime.onMessage.addListener((message: RuntimeMessage, _sender, sendResponse) => {
  if (message.type === "INSERT_ANSWER") {
    sendResponse(insertAnswer(message.answer, message.questionText));
    return true;
  }

  if (message.type === "UPLOAD_COVER_FILE") {
    sendResponse(uploadCoverFile(message.fileName, message.mimeType, message.base64));
    return true;
  }

  return undefined;
});
