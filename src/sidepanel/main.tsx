import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { buildPrompt } from "../lib/promptBuilder";
import { promptTemplates } from "../lib/promptTemplates";
import { defaultState, loadState, normalizeState, saveState } from "../lib/storage";
import type { AppState, GeneratedAnswer, GenerateResponse, JobQuestion, RuntimeMessage } from "../lib/messages";
import { createId } from "../lib/messages";
import "../styles.css";

const sendRuntimeMessage = <T,>(message: RuntimeMessage): Promise<T> =>
  new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response: T) => {
      const error = chrome.runtime.lastError;
      if (error) {
        reject(new Error(error.message));
        return;
      }

      resolve(response);
    });
  });

const parseAnswersFromText = (text: string): GeneratedAnswer[] => {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  const candidate = fenced ?? trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Paste the full ChatGPT JSON response, including the answers array.");
  }

  const parsed = JSON.parse(candidate.slice(start, end + 1)) as { answers?: GeneratedAnswer[] };
  if (!Array.isArray(parsed.answers)) {
    throw new Error("The response did not include an answers array.");
  }

  return parsed.answers;
};

const App = () => {
  const [state, setState] = useState<AppState>(defaultState);
  const [loading, setLoading] = useState(true);
  const [manualResponse, setManualResponse] = useState("");
  const [copiedKey, setCopiedKey] = useState("");
  const [showFallback, setShowFallback] = useState(false);

  const draftPrompt = useMemo(
    () =>
      buildPrompt({
        jobDescription: state.jobDescription,
        resumeText: state.resumeText,
        includeResume: state.includeResume,
        useNewChatGptTab: state.useNewChatGptTab,
        questions: state.questions,
        templateId: state.selectedTemplateId,
        customPrompt: state.customPrompt
      }),
    [
      state.customPrompt,
      state.includeResume,
      state.jobDescription,
      state.questions,
      state.resumeText,
      state.selectedTemplateId,
      state.useNewChatGptTab
    ]
  );

  const setAndPersist = async (updater: AppState | ((current: AppState) => AppState)) => {
    setState((current) => {
      const next = typeof updater === "function" ? updater(current) : updater;
      void saveState(next);
      return next;
    });
  };

  useEffect(() => {
    void loadState().then((savedState) => {
      setState(savedState);
      setLoading(false);
    });

    const listener = (changes: Record<string, chrome.storage.StorageChange>, areaName: string) => {
      if (areaName !== "local" || !changes.jobAnswerHelperState?.newValue) {
        return;
      }

      setState(normalizeState(changes.jobAnswerHelperState.newValue as Partial<AppState>));
    };

    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  const addQuestion = () => {
    void setAndPersist((current) => ({
      ...current,
      questions: [...current.questions, { id: createId(), text: "", templateId: current.selectedTemplateId }]
    }));
  };

  const updateQuestion = (id: string, patch: Partial<JobQuestion>) => {
    void setAndPersist((current) => ({
      ...current,
      questions: current.questions.map((question) => (question.id === id ? { ...question, ...patch } : question))
    }));
  };

  const removeQuestion = (id: string) => {
    void setAndPersist((current) => ({
      ...current,
      questions: current.questions.filter((question) => question.id !== id)
    }));
  };

  const moveQuestion = (id: string, direction: -1 | 1) => {
    void setAndPersist((current) => {
      const index = current.questions.findIndex((question) => question.id === id);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= current.questions.length) {
        return current;
      }

      const questions = [...current.questions];
      const [question] = questions.splice(index, 1);
      questions.splice(nextIndex, 0, question);
      return { ...current, questions };
    });
  };

  const generateAnswers = async () => {
    const activeQuestions = state.questions.filter((question) => question.text.trim());
    if (!state.jobDescription.trim() || activeQuestions.length === 0) {
      await setAndPersist({
        ...state,
        status: "failed",
        statusMessage: "Add a job description and at least one question first.",
        lastError: "Missing job description or questions."
      });
      return;
    }

    const payload = {
      jobDescription: state.jobDescription,
      resumeText: state.resumeText,
      includeResume: state.includeResume,
      useNewChatGptTab: state.useNewChatGptTab,
      questions: activeQuestions.map((question) => ({
        ...question,
        templateId: question.templateId ?? state.selectedTemplateId
      })),
      templateId: state.selectedTemplateId,
      customPrompt: state.customPrompt
    };
    const latestPrompt = buildPrompt(payload);

    await setAndPersist({
      ...state,
      latestPrompt,
      status: "opening-chatgpt",
      statusMessage: "Opening ChatGPT...",
      lastError: ""
    });

    try {
      const response = await sendRuntimeMessage<GenerateResponse>({
        type: "GENERATE_ANSWERS",
        payload
      });

      if (!response.ok || !response.answers) {
        await setAndPersist((current) => ({
          ...current,
          latestPrompt: response.prompt ?? latestPrompt,
          status: "failed",
          statusMessage: "Automation failed. Use the fallback prompt below.",
          lastError: response.error ?? "ChatGPT did not return valid answers."
        }));
        return;
      }

      await setAndPersist((current) => ({
        ...current,
        latestPrompt: response.prompt ?? latestPrompt,
        status: "done",
        statusMessage: "Answers generated.",
        lastError: "",
        questions: current.questions.map((question) => {
          const answer =
            response.answers?.find((item) => item.questionId === question.id)?.answer ??
            response.answers?.find((item) => item.question.trim() === question.text.trim())?.answer;
          return answer ? { ...question, answer } : question;
        })
      }));
    } catch (error) {
      await setAndPersist((current) => ({
        ...current,
        latestPrompt,
        status: "failed",
        statusMessage: "Could not reach the extension background worker.",
        lastError: error instanceof Error ? error.message : String(error)
      }));
    }
  };

  const copyWithFeedback = async (key: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    window.setTimeout(() => {
      setCopiedKey((current) => (current === key ? "" : current));
    }, 1400);
  };

  const insertAnswer = async (question: JobQuestion) => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab.id) {
      return;
    }

    const response = await chrome.tabs.sendMessage(tab.id, {
      type: "INSERT_ANSWER",
      answer: question.answer ?? "",
      questionText: question.text
    } satisfies RuntimeMessage);

    await setAndPersist((current) => ({
      ...current,
      status: response?.ok ? "done" : "failed",
      statusMessage: response?.ok ? "Inserted answer into the page." : "Could not find the answer field. Copied answer instead.",
      lastError: response?.ok ? "" : "Try clicking the target answer field first, then press Insert in page again."
    }));
  };

  const applyAnswers = async (answers: GeneratedAnswer[], successMessage: string) => {
    await setAndPersist((current) => ({
      ...current,
      status: "done",
      statusMessage: successMessage,
      lastError: "",
      questions: current.questions.map((question) => {
        const answer =
          answers.find((item) => item.questionId === question.id)?.answer ??
          answers.find((item) => item.question.trim() === question.text.trim())?.answer;
        return answer ? { ...question, answer } : question;
      })
    }));
  };

  const importManualResponse = async () => {
    try {
      const answers = parseAnswersFromText(manualResponse);
      await applyAnswers(answers, "Imported ChatGPT answers.");
      setManualResponse("");
    } catch (error) {
      await setAndPersist((current) => ({
        ...current,
        status: "failed",
        statusMessage: "Could not import ChatGPT response.",
        lastError: error instanceof Error ? error.message : String(error)
      }));
    }
  };

  const clearAll = async () => {
    await setAndPersist(defaultState);
  };

  const loadResumeMarkdown = async () => {
    try {
      const response = await fetch(chrome.runtime.getURL("resume.md"));
      if (!response.ok) {
        throw new Error("resume.md was not found in the extension folder.");
      }

      const resumeText = await response.text();
      await setAndPersist({
        ...state,
        resumeText,
        includeResume: true,
        statusMessage: "Loaded resume.md."
      });
    } catch (error) {
      await setAndPersist({
        ...state,
        status: "failed",
        statusMessage: "Could not load resume.md.",
        lastError: error instanceof Error ? error.message : String(error)
      });
    }
  };

  const usesCustomTemplate =
    state.selectedTemplateId === "custom" || state.questions.some((question) => question.templateId === "custom");

  if (loading) {
    return <main className="panel loading">Loading...</main>;
  }

  return (
    <main className="panel">
      <header className="hero">
        <div>
          <p className="eyebrow">Job Answer Helper</p>
          <h1>Draft tailored answers from a job post.</h1>
        </div>
        <button className="ghost" onClick={clearAll} type="button">
          Reset
        </button>
      </header>

      <section className="card">
        <div className="section-title">
          <h2>Job description</h2>
          <span>{state.jobDescription.length} chars</span>
        </div>
        <textarea
          value={state.jobDescription}
          onChange={(event) => void setAndPersist({ ...state, jobDescription: event.target.value })}
          placeholder="Select text on the job page, or paste the job description here."
          rows={8}
        />
      </section>

      <section className="card">
        <div className="section-title">
          <h2>Resume</h2>
          <button onClick={() => void loadResumeMarkdown()} type="button">
            Load resume.md
          </button>
        </div>
        <label className="check-row">
          <input
            checked={state.includeResume}
            onChange={(event) => void setAndPersist({ ...state, includeResume: event.target.checked })}
            type="checkbox"
          />
          Include resume in generated prompts
        </label>
        <textarea
          value={state.resumeText}
          onChange={(event) => void setAndPersist({ ...state, resumeText: event.target.value })}
          placeholder="Paste your resume here, or put it in resume.md and click Load resume.md."
          rows={6}
        />
      </section>

      <section className="card">
        <div className="section-title">
          <h2>Questions</h2>
          <button onClick={addQuestion} type="button">
            Add
          </button>
        </div>
        <div className="question-list">
          {state.questions.length === 0 ? <p className="muted">Select questions on the page or add them here.</p> : null}
          {state.questions.map((question, index) => (
            <article className="question-card" key={question.id}>
              <div className="question-toolbar">
                <span>Question {index + 1}</span>
                <div>
                  <button onClick={() => moveQuestion(question.id, -1)} type="button">
                    Up
                  </button>
                  <button onClick={() => moveQuestion(question.id, 1)} type="button">
                    Down
                  </button>
                  <button onClick={() => removeQuestion(question.id)} type="button">
                    Delete
                  </button>
                </div>
              </div>
              <textarea
                value={question.text}
                onChange={(event) => updateQuestion(question.id, { text: event.target.value })}
                placeholder="Paste an application question..."
                rows={3}
              />
              <label className="field-label">
                Template for this question
                <select
                  value={question.templateId ?? state.selectedTemplateId}
                  onChange={(event) =>
                    updateQuestion(question.id, { templateId: event.target.value as JobQuestion["templateId"] })
                  }
                >
                  {promptTemplates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </label>
              {question.answer ? (
                <div className="answer-box">
                  <p>{question.answer}</p>
                  <div className="answer-actions">
                    <button
                      className={copiedKey === `question-${question.id}` ? "copied" : ""}
                      onClick={() => void copyWithFeedback(`question-${question.id}`, question.answer ?? "")}
                      type="button"
                    >
                      {copiedKey === `question-${question.id}` ? "Copied!" : "Copy"}
                    </button>
                    <button onClick={() => void insertAnswer(question)} type="button">
                      Insert in page
                    </button>
                  </div>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <section className="card">
        <div className="section-title">
          <h2>Prompt</h2>
          <span>{state.selectedTemplateId}</span>
        </div>
        <div className="template-grid">
          {promptTemplates.map((template) => (
            <button
              className={template.id === state.selectedTemplateId ? "template selected" : "template"}
              key={template.id}
              onClick={() => void setAndPersist({ ...state, selectedTemplateId: template.id })}
              type="button"
            >
              <strong>{template.name}</strong>
              <span>{template.description}</span>
            </button>
          ))}
        </div>
        <p className="muted">This default is used for new questions. Existing questions can use their own template.</p>
        {usesCustomTemplate ? (
          <textarea
            value={state.customPrompt}
            onChange={(event) => void setAndPersist({ ...state, customPrompt: event.target.value })}
            placeholder="Describe the tone, length, experience level, and answer style you want."
            rows={5}
          />
        ) : null}
      </section>

      <section className="card">
        <div className="mode-card">
          <label className="check-row">
            <input
              checked={state.useNewChatGptTab}
              onChange={(event) => void setAndPersist({ ...state, useNewChatGptTab: event.target.checked })}
              type="checkbox"
            />
            Open a new ChatGPT tab for generation
          </label>
          <p className="muted">
            Turn this on for long context or a clean conversation. Leave it off to reuse an existing ChatGPT tab.
          </p>
        </div>
        <button className="primary" onClick={() => void generateAnswers()} type="button">
          Generate all answers
        </button>
        <p className={`status ${state.status}`}>{state.statusMessage}</p>
        {state.lastError ? <p className="error">{state.lastError}</p> : null}
      </section>

      <section className="card fallback-card">
        <div className="section-title">
          <h2>Manual fallback workspace</h2>
          <button onClick={() => setShowFallback((current) => !current)} type="button">
            {showFallback ? "Hide" : "Show"}
          </button>
        </div>
        <p className="muted">Use this only when automatic ChatGPT generation fails or you prefer to paste manually.</p>
        {showFallback ? (
          <>
            <button
              className={copiedKey === "fallback-prompt" ? "copied" : ""}
              onClick={() => void copyWithFeedback("fallback-prompt", state.latestPrompt || draftPrompt)}
              type="button"
            >
              {copiedKey === "fallback-prompt" ? "Copied!" : "Copy prompt for ChatGPT"}
            </button>
            <ol className="steps">
              <li>Copy this prompt and paste it into ChatGPT.</li>
              <li>Copy ChatGPT's full response back into the response box.</li>
              <li>Click import to show answers under each question.</li>
            </ol>
            <label className="field-label">
              Prompt to send
              <textarea readOnly value={state.latestPrompt || draftPrompt} rows={8} />
            </label>
            <label className="field-label">
              Paste ChatGPT response
              <textarea
                value={manualResponse}
                onChange={(event) => setManualResponse(event.target.value)}
                placeholder='Paste the JSON response here, for example {"answers":[...]}'
                rows={8}
              />
            </label>
            <button className="primary" onClick={() => void importManualResponse()} type="button">
              Import answers into questions
            </button>
          </>
        ) : null}
      </section>

      <section className="card">
        <div className="section-title">
          <h2>Answer workspace</h2>
          <span>{state.questions.filter((question) => question.answer).length} ready</span>
        </div>
        {state.questions.some((question) => question.answer) ? (
          <div className="answer-list">
            {state.questions
              .filter((question) => question.answer)
              .map((question, index) => (
                <article className="answer-card" key={question.id}>
                  <strong>Answer {index + 1}</strong>
                  <p>{question.answer}</p>
                  <div className="answer-actions">
                    <button
                      className={copiedKey === `workspace-${question.id}` ? "copied" : ""}
                      onClick={() => void copyWithFeedback(`workspace-${question.id}`, question.answer ?? "")}
                      type="button"
                    >
                      {copiedKey === `workspace-${question.id}` ? "Copied!" : "Copy"}
                    </button>
                    <button onClick={() => void insertAnswer(question)} type="button">
                      Insert in page
                    </button>
                  </div>
                </article>
              ))}
          </div>
        ) : (
          <p className="muted">Generated or imported answers will appear here and under each question.</p>
        )}
      </section>
    </main>
  );
};

createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
