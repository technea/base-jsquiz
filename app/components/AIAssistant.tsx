"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ═══════════════════════════════════════════════════════════════════
//  SINGLETON: SpeechManager
//  One instance, controlled voice queue, no double-speak.
// ═══════════════════════════════════════════════════════════════════

class SpeechManager {
  static #instance = null;

  #isSpeaking = false;
  #listeners = new Set();

  constructor() {
    if (SpeechManager.#instance) return SpeechManager.#instance;
    SpeechManager.#instance = this;
  }

  static getInstance() {
    if (!SpeechManager.#instance) new SpeechManager();
    return SpeechManager.#instance;
  }

  get speaking() {
    return this.#isSpeaking;
  }

  onSpeakingChange(fn) {
    this.#listeners.add(fn);
    return () => this.#listeners.delete(fn);
  }

  #emit(value) {
    this.#isSpeaking = value;
    this.#listeners.forEach((fn) => fn(value));
  }

  stop() {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    this.#emit(false);
  }

  #bestVoice(lang) {
    const voices = window.speechSynthesis.getVoices();
    if (lang === "en") {
      return (
        voices.find((v) => v.lang.startsWith("en") && /Google|Neural|Premium|Enhanced/.test(v.name)) ||
        voices.find((v) => v.lang.startsWith("en-US")) ||
        voices.find((v) => v.lang.startsWith("en"))
      );
    }
    return voices.find((v) => v.lang.startsWith("ur")) || voices.find((v) => v.lang.startsWith("hi"));
  }

  #speak(text, lang) {
    return new Promise((resolve) => {
      const utt = new SpeechSynthesisUtterance(text);
      const voice = this.#bestVoice(lang);
      if (voice) utt.voice = voice;

      if (lang === "en") {
        utt.lang = "en-US";
        utt.rate = 1.05;
        utt.pitch = 1.0;
      } else {
        utt.lang = voice?.lang ?? "hi-IN";
        utt.rate = 0.95;
        utt.pitch = 1.0;
      }

      utt.onstart = () => this.#emit(true);
      utt.onend = () => resolve();
      utt.onerror = () => resolve();

      window.speechSynthesis.speak(utt);
    });
  }

  async say(rawText) {
    if (!window.speechSynthesis) return;

    this.stop();

    const englishPart = rawText.replace(/\[\[URDU_VOICE:[\s\S]*?\]\]/g, "").trim();
    const urduMatch  = rawText.match(/\[\[URDU_VOICE:\s*([\s\S]*?)\s*\]\]/);
    const urduPart   = urduMatch ? urduMatch[1].trim() : "";

    const clean = (t) =>
      t.replace(/```[\s\S]*?```/g, " Code block. ")
        .replace(/[*_`#]/g, "")
        .replace(/\n+/g, " ")
        .trim()
        .slice(0, 500);

    this.#emit(true);
    try {
      if (englishPart) await this.#speak(clean(englishPart), "en");
      if (urduPart)   await this.#speak(clean(urduPart), "ur");
    } finally {
      this.#emit(false);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════
//  CLASS: SyntaxHighlighter
//  Stateless — all methods pure/static.
// ═══════════════════════════════════════════════════════════════════

class SyntaxHighlighter {
  static #JS_LANGS = new Set(["js", "javascript", "ts", "typescript", "jsx", "tsx"]);

  static #escape(raw) {
    return raw
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  static highlight(raw, lang) {
    let code = SyntaxHighlighter.#escape(raw);

    if (!SyntaxHighlighter.#JS_LANGS.has(lang)) return code;

    // Comments must run first — keywords inside comments must NOT be re-highlighted.
    code = code
      .replace(/(\/\/[^\n]*)/g, '<span class="hl-comment">$1</span>')
      .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="hl-comment">$1</span>')
      .replace(
        /(&quot;[^&]*?&quot;|&#39;[^&]*?&#39;|`[^`]*`)/g,
        '<span class="hl-string">$1</span>'
      )
      .replace(
        /\b(const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|class|new|this|typeof|instanceof|async|await|try|catch|finally|throw|import|export|default|from|of|in|extends|super|null|undefined|true|false)\b/g,
        '<span class="hl-keyword">$1</span>'
      )
      .replace(/\b(-?\d+\.?\d*)\b/g, '<span class="hl-number">$1</span>')
      .replace(
        /\b([A-Za-z_$][A-Za-z0-9_$]*)(?=\s*\()/g,
        '<span class="hl-fn">$1</span>'
      );

    return code;
  }
}

// ═══════════════════════════════════════════════════════════════════
//  CLASS: QuizStateMachine
//  Encapsulates quiz flow as a proper state machine.
//  States: IDLE → ANSWERING → ANSWERED → COMPLETE
// ═══════════════════════════════════════════════════════════════════

class QuizStateMachine {
  static STATES = Object.freeze({
    IDLE:      "IDLE",
    ANSWERING: "ANSWERING",
    ANSWERED:  "ANSWERED",
    COMPLETE:  "COMPLETE",
  });

  #state;
  #questions;
  #currentIndex;
  #score;
  #selectedOptionId;
  #listeners;

  constructor(questions) {
    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error("QuizStateMachine requires a non-empty questions array.");
    }
    this.#state          = QuizStateMachine.STATES.ANSWERING;
    this.#questions      = questions;
    this.#currentIndex   = 0;
    this.#score          = 0;
    this.#selectedOptionId = null;
    this.#listeners      = new Set();
  }

  // ── Observers ──────────────────────────────────────────────────

  onChange(fn) {
    this.#listeners.add(fn);
    return () => this.#listeners.delete(fn);
  }

  #notify() {
    this.#listeners.forEach((fn) => fn(this.snapshot()));
  }

  // ── Read-only snapshot (safe to spread into React state) ───────

  snapshot() {
    return Object.freeze({
      state:           this.#state,
      question:        this.#questions[this.#currentIndex],
      currentIndex:    this.#currentIndex,
      totalQuestions:  this.#questions.length,
      score:           this.#score,
      selectedOptionId: this.#selectedOptionId,
      isLastQuestion:  this.#currentIndex === this.#questions.length - 1,
    });
  }

  // ── Transitions ────────────────────────────────────────────────

  answer(optionId) {
    if (this.#state !== QuizStateMachine.STATES.ANSWERING) return;

    const option = this.#questions[this.#currentIndex].options.find((o) => o.id === optionId);
    if (!option) return;

    this.#selectedOptionId = optionId;

    if (option.isCorrect) this.#score += 1;

    this.#state = this.#currentIndex === this.#questions.length - 1
      ? QuizStateMachine.STATES.COMPLETE
      : QuizStateMachine.STATES.ANSWERED;

    this.#notify();
  }

  next() {
    if (this.#state !== QuizStateMachine.STATES.ANSWERED) return;

    this.#currentIndex    += 1;
    this.#selectedOptionId = null;
    this.#state            = QuizStateMachine.STATES.ANSWERING;

    this.#notify();
  }
}

// ═══════════════════════════════════════════════════════════════════
//  CLASS: MessageParser
//  Parses raw assistant text into typed parts for rendering.
// ═══════════════════════════════════════════════════════════════════

class MessageParser {
  static parse(text) {
    const parts = [];
    const quizRegex = /\[\[QUIZ:START\]\]([\s\S]*?)\[\[QUIZ:END\]\]/g;
    let lastIndex = 0;
    let match;

    // Pass 1 — extract quiz blocks
    while ((match = quizRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: "text", content: text.slice(lastIndex, match.index) });
      }
      try {
        const questions = JSON.parse(match[1]);
        if (Array.isArray(questions) && questions.length > 0) {
          parts.push({ type: "quiz", questions });
        }
      } catch {
        parts.push({ type: "text", content: match[0] });
      }
      lastIndex = match.index + match[0].length;
    }

    // Pass 2 — extract code fences from remaining text
    const remaining = text.slice(lastIndex);
    const codeRegex = /```(\w*)\n?([\s\S]*?)```/g;
    let cursor = 0;

    while ((match = codeRegex.exec(remaining)) !== null) {
      if (match.index > cursor) {
        parts.push({ type: "text", content: remaining.slice(cursor, match.index) });
      }
      parts.push({ type: "code", lang: match[1] || "javascript", content: match[2].trim() });
      cursor = match.index + match[0].length;
    }

    if (cursor < remaining.length) {
      parts.push({ type: "text", content: remaining.slice(cursor) });
    }

    return parts;
  }

  // Inline markdown: **bold** and `code`
  static renderInline(text) {
    return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((seg, i) => {
      if (seg.startsWith("**") && seg.endsWith("**")) {
        return <strong key={i}>{seg.slice(2, -2)}</strong>;
      }
      if (seg.startsWith("`") && seg.endsWith("`") && seg.length > 2) {
        return <code key={i} className="inline-code">{seg.slice(1, -1)}</code>;
      }
      return <span key={i}>{seg}</span>;
    });
  }
}

// ═══════════════════════════════════════════════════════════════════
//  COMPONENT: CodeBlock
// ═══════════════════════════════════════════════════════════════════

function CodeBlock({ code, lang }) {
  const [copied, setCopied] = useState(false);
  const lines = code.split("\n");

  function copy() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="code-block">
      <div className="code-block__header">
        <div className="code-block__dots">
          <span />
          <span />
          <span />
        </div>
        <span className="code-block__lang">{lang || "code"}</span>
        <button className="code-block__copy" onClick={copy}>
          {copied ? "✓ Copied" : "Copy"}
        </button>
      </div>

      <div className="code-block__body">
        <table>
          <tbody>
            {lines.map((line, i) => (
              <tr key={i}>
                <td className="code-block__lineno">{i + 1}</td>
                <td className="code-block__line">
                  <pre>
                    <code
                      dangerouslySetInnerHTML={{
                        __html: line ? SyntaxHighlighter.highlight(line, lang) : "<br/>",
                      }}
                    />
                  </pre>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  COMPONENT: QuizCard
//  Driven entirely by QuizStateMachine — no local state for answers.
// ═══════════════════════════════════════════════════════════════════

function QuizCard({ questions }) {
  const machineRef = useRef(null);

  // Build the machine once per question set
  if (!machineRef.current) {
    machineRef.current = new QuizStateMachine(questions);
  }

  const [snap, setSnap] = useState(() => machineRef.current.snapshot());

  useEffect(() => {
    return machineRef.current.onChange(setSnap);
  }, []);

  const { ANSWERING, ANSWERED, COMPLETE } = QuizStateMachine.STATES;

  function optionClass(option) {
    if (snap.state === ANSWERING) return "quiz__option";

    if (option.isCorrect)                                        return "quiz__option quiz__option--correct";
    if (snap.selectedOptionId === option.id && !option.isCorrect) return "quiz__option quiz__option--wrong";
    return "quiz__option quiz__option--dim";
  }

  return (
    <div className="quiz">
      <div className="quiz__header">
        <span className="quiz__label">Knowledge Check</span>
        <span className="quiz__progress">
          {snap.currentIndex + 1} / {snap.totalQuestions}
        </span>
        <span className="quiz__score">Score: {snap.score}</span>
      </div>

      <p className="quiz__question">{snap.question.question}</p>

      <div className="quiz__options">
        {snap.question.options.map((opt) => (
          <button
            key={opt.id}
            className={optionClass(opt)}
            disabled={snap.state !== ANSWERING}
            onClick={() => machineRef.current.answer(opt.id)}
          >
            {opt.text}
          </button>
        ))}
      </div>

      {(snap.state === ANSWERED || snap.state === COMPLETE) && (
        <div className="quiz__explanation">
          <span className="quiz__explanation-label">Deep Dive</span>
          {snap.question.explanation}
        </div>
      )}

      {snap.state === ANSWERED && (
        <button className="quiz__next" onClick={() => machineRef.current.next()}>
          Next →
        </button>
      )}

      {snap.state === COMPLETE && (
        <div className="quiz__complete">
          Quiz Complete — Final Score: {snap.score} / {snap.totalQuestions}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  COMPONENT: MessageBubble
// ═══════════════════════════════════════════════════════════════════

function MessageBubble({ message, isDarkMode }) {
  const displayText = message.content.replace(/\[\[URDU_VOICE:[\s\S]*?\]\]/g, "").trim();
  const parts = MessageParser.parse(displayText);

  const isUser = message.role === "user";

  return (
    <div className={`bubble-row ${isUser ? "bubble-row--user" : "bubble-row--assistant"}`}>
      <div className={`bubble-avatar ${isUser ? "bubble-avatar--user" : "bubble-avatar--bot"}`}>
        {isUser ? "U" : "AI"}
      </div>

      <div className={`bubble ${isUser ? "bubble--user" : isDarkMode ? "bubble--dark" : "bubble--light"}`}>
        {message.file && (
          <div className="bubble__attachment">
            {message.file.preview
              ? <img src={message.file.preview} alt="" className="bubble__file-preview" />
              : <span className="bubble__file-icon">📄</span>
            }
            <div>
              <p className="bubble__file-name">{message.file.name}</p>
              <p className="bubble__file-meta">Document attached</p>
            </div>
          </div>
        )}

        {isUser ? (
          <p className="bubble__text">{message.content}</p>
        ) : (
          <div className="bubble__content">
            {parts.map((part, i) => {
              if (part.type === "code") return <CodeBlock key={i} code={part.content} lang={part.lang} />;
              if (part.type === "quiz") return <QuizCard key={i} questions={part.questions} />;
              return (
                <p key={i} className="bubble__text">
                  {MessageParser.renderInline(part.content)}
                </p>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  COMPONENT: AIAssistant  (main)
// ═══════════════════════════════════════════════════════════════════

export function AIAssistant({ isDarkMode = false, onClose }) {
  const speech = SpeechManager.getInstance();

  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      content: `Hey there! 👋 I'm your **Human-Centric AI Mentor**.

I specialize in explaining complex code at any level you need.
• **Level 1** — Explain like I'm 5 (using stories/analogies)
• **Level 10** — Technical deep dive for experts
• **Any Language** — JS, Python, C++, and more...

Paste some code or try a command below! 🚀`,
    },
  ]);

  const [input, setInput]           = useState("");
  const [isLoading, setIsLoading]   = useState(false);
  const [voiceOn, setVoiceOn]       = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [micAvailable, setMicAvailable] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const [quizMode, setQuizMode]     = useState(false);
  const [lang, setLang]             = useState("en-US");

  const bottomRef     = useRef(null);
  const inputRef      = useRef(null);
  const fileInputRef  = useRef(null);
  const recognitionRef = useRef(null);

  // ── Speech observer ────────────────────────────────────────────

  useEffect(() => {
    const unsubscribe = speech.onSpeakingChange(setIsSpeaking);
    return () => {
      unsubscribe();
      speech.stop();
      recognitionRef.current?.stop();
    };
  }, []);

  // ── Mic detection ──────────────────────────────────────────────

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    setMicAvailable(!!SR);
  }, []);

  // ── Auto-scroll ────────────────────────────────────────────────

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // ── Handlers ───────────────────────────────────────────────────

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("File must be under 10 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      setAttachedFile({
        name:    file.name,
        type:    file.type,
        preview: file.type.startsWith("image/") ? dataUrl : undefined,
        base64:  dataUrl.split(",")[1],
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function toggleListening() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Voice input needs Chrome or Edge."); return; }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    speech.stop();

    const rec = new SR();
    rec.continuous      = false;
    rec.interimResults  = true;
    rec.lang            = lang;

    rec.onstart   = () => setIsListening(true);
    rec.onend     = () => setIsListening(false);
    rec.onerror   = (e) => {
      if (e.error !== "no-speech") alert(`Voice error: ${e.error}`);
      setIsListening(false);
    };
    rec.onresult = (e) => {
      let final = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript;
      }
      if (final) {
        setInput((prev) => prev ? `${prev} ${final}` : final);
        inputRef.current?.focus();
      }
    };

    rec.start();
    recognitionRef.current = rec;
  }

  async function handleSend() {
    const text = input.trim();
    if (!text && !attachedFile) return;

    // Unblock iOS audio — must happen inside a user gesture
    if (voiceOn && window.speechSynthesis) {
      const primer = new SpeechSynthesisUtterance("");
      primer.volume = 0;
      window.speechSynthesis.speak(primer);
    }

    const fileSnap = attachedFile;

    const userMessage = {
      id:      Date.now().toString(),
      role:    "user",
      content: text || `[File: ${fileSnap?.name}]`,
      file:    fileSnap ? { name: fileSnap.name, type: fileSnap.type, preview: fileSnap.preview } : undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setAttachedFile(null);
    setIsLoading(true);

    try {
      const payload = {
        message:  userMessage.content,
        history:  messages.map((m) => ({ role: m.role, content: m.content })),
        language: lang,
        mode:     quizMode ? "quiz" : "normal",
      };

      if (fileSnap?.base64) {
        payload.file = { name: fileSnap.name, type: fileSnap.type, base64: fileSnap.base64 };
      }

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();

      if (data.type === "quiz" && Array.isArray(data.questions)) {
        setMessages((prev) => [
          ...prev,
          {
            id:      (Date.now() + 1).toString(),
            role:    "assistant",
            type:    "quiz",
            content: `[[QUIZ:START]]${JSON.stringify(data.questions)}[[QUIZ:END]]`,
          },
        ]);
      } else {
        const reply = data.message || "No response. Please try again.";
        setMessages((prev) => [
          ...prev,
          { id: (Date.now() + 1).toString(), role: "assistant", content: reply },
        ]);
        if (voiceOn) speech.say(reply);
      }
    } catch (err) {
      console.error(err);
      const errMsg = "⚠️ Connection error. Please refresh and try again.";
      setMessages((prev) => [...prev, { id: Date.now().toString(), role: "assistant", content: errMsg }]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // ── Status text ────────────────────────────────────────────────

  const status = isSpeaking
    ? "Speaking..."
    : isListening ? "Listening..."
    : isLoading   ? "Thinking..."
    : quizMode    ? "Quiz Mode"
    : "Online";

  // ── Render ─────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        /* ── Reset ─────────────────────────────────────── */
        .ai-assistant * { box-sizing: border-box; margin: 0; padding: 0; }

        /* ── Root ──────────────────────────────────────── */
        .ai-assistant {
          display: flex;
          flex-direction: column;
          width: 100%;
          height: 100%;
          overflow: hidden;
          font-family: system-ui, -apple-system, sans-serif;
          background: var(--ai-bg, #ffffff);
          color: var(--ai-text, #111827);
        }
        .ai-assistant--dark {
          --ai-bg:        #0b0e14;
          --ai-text:      #e2e8f0;
          --ai-border:    #1e293b;
          --ai-surface:   #1e293b;
          --ai-muted:     #94a3b8;
          --ai-bubble-bg: #1e293b;
        }
        .ai-assistant:not(.ai-assistant--dark) {
          --ai-bg:        #ffffff;
          --ai-text:      #111827;
          --ai-border:    #e5e7eb;
          --ai-surface:   #f9fafb;
          --ai-muted:     #6b7280;
          --ai-bubble-bg: #f3f4f6;
        }

        /* ── Header ────────────────────────────────────── */
        .ai-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 20px;
          border-bottom: 1px solid var(--ai-border);
          flex-shrink: 0;
        }
        .ai-header__identity { display: flex; align-items: center; gap: 12px; }
        .ai-header__avatar {
          width: 42px; height: 42px;
          border-radius: 14px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          display: flex; align-items: center; justify-content: center;
          color: white; font-weight: 700; font-size: 16px;
        }
        .ai-header__name { font-size: 16px; font-weight: 700; }
        .ai-header__name em { color: #6366f1; font-style: italic; }
        .ai-header__status { font-size: 11px; color: var(--ai-muted); margin-top: 2px; }
        .ai-header__actions { display: flex; gap: 8px; align-items: center; }

        /* ── Header buttons ────────────────────────────── */
        .btn-icon {
          display: flex; align-items: center; gap: 6px;
          padding: 8px 12px;
          border: 1px solid var(--ai-border);
          border-radius: 10px;
          background: transparent;
          color: var(--ai-text);
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          transition: background 0.15s, color 0.15s;
        }
        .btn-icon:hover { background: var(--ai-surface); }
        .btn-icon--active { background: #6366f1; color: white; border-color: #6366f1; }
        .btn-icon--close {
          background: #6366f1; color: white; border-color: #6366f1;
          border-radius: 10px; padding: 8px 12px;
        }

        /* ── Chat area ─────────────────────────────────── */
        .ai-chat {
          flex: 1;
          overflow-y: auto;
          padding: 20px 16px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          scroll-behavior: smooth;
        }

        /* ── Bubbles ───────────────────────────────────── */
        .bubble-row {
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }
        .bubble-row--user { flex-direction: row-reverse; }

        .bubble-avatar {
          width: 34px; height: 34px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 800;
          flex-shrink: 0;
        }
        .bubble-avatar--user { background: #374151; color: white; }
        .bubble-avatar--bot  { background: #6366f1; color: white; }

        .bubble {
          max-width: 82%;
          padding: 10px 14px;
          border-radius: 16px;
          font-size: 13px;
          line-height: 1.5;
        }
        .bubble--user  { background: #6366f1; color: white; border-bottom-right-radius: 4px; }
        .bubble--light { background: #f3f4f6; color: #111827; border-bottom-left-radius: 4px; border: 1px solid #e5e7eb; }
        .bubble--dark  { background: #1e293b; color: #e2e8f0; border-bottom-left-radius: 4px; border: 1px solid #334155; }

        .bubble__text { white-space: pre-wrap; }
        .bubble__content { display: flex; flex-direction: column; gap: 8px; }

        .bubble__attachment {
          display: flex; align-items: center; gap: 10px;
          background: rgba(0,0,0,0.1); border-radius: 10px;
          padding: 8px 12px; margin-bottom: 10px;
        }
        .bubble__file-preview { width: 36px; height: 36px; border-radius: 8px; object-fit: cover; }
        .bubble__file-icon    { font-size: 24px; }
        .bubble__file-name    { font-size: 12px; font-weight: 600; }
        .bubble__file-meta    { font-size: 10px; opacity: 0.5; text-transform: uppercase; letter-spacing: 0.05em; }

        /* ── Inline code ───────────────────────────────── */
        .inline-code {
          padding: 2px 6px;
          background: #1e1e2e;
          color: #c792ea;
          border-radius: 4px;
          font-family: monospace;
          font-size: 12px;
        }

        /* ── Code block ────────────────────────────────── */
        .code-block {
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid #30363d;
          background: #0d1117;
          margin: 8px 0;
        }
        .code-block__header {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 14px;
          background: #161b22;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .code-block__dots { display: flex; gap: 5px; }
        .code-block__dots span {
          width: 10px; height: 10px; border-radius: 50%;
        }
        .code-block__dots span:nth-child(1) { background: #f87171; }
        .code-block__dots span:nth-child(2) { background: #fbbf24; }
        .code-block__dots span:nth-child(3) { background: #34d399; }
        .code-block__lang {
          font-size: 10px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.1em; color: #64748b; margin-left: 4px; flex: 1;
        }
        .code-block__copy {
          background: transparent; border: none; cursor: pointer;
          font-size: 11px; font-weight: 700; color: #64748b;
          padding: 4px 10px; border-radius: 6px; transition: all 0.15s;
        }
        .code-block__copy:hover { background: rgba(255,255,255,0.05); color: white; }
        .code-block__body { overflow-x: auto; }
        .code-block__body table { border-collapse: collapse; width: 100%; }
        .code-block__lineno {
          text-align: right; padding: 1px 10px 1px 12px;
          color: #3d4f6a; font-size: 12px; font-family: monospace;
          border-right: 1px solid rgba(255,255,255,0.05);
          user-select: none; width: 40px;
        }
        .code-block__line { padding: 1px 14px; }
        .code-block__line pre { margin: 0; }
        .code-block__line code { font-family: monospace; font-size: 13px; line-height: 1.6; }

        /* Syntax colors */
        .hl-keyword { color: #c792ea; font-weight: 600; }
        .hl-string  { color: #c3e88d; }
        .hl-number  { color: #f78c6c; }
        .hl-comment { color: #546e7a; font-style: italic; }
        .hl-fn      { color: #82aaff; }

        /* ── Quiz ──────────────────────────────────────── */
        .quiz {
          border: 1px solid rgba(99,102,241,0.25);
          background: rgba(99,102,241,0.04);
          border-radius: 16px;
          padding: 20px;
          margin: 4px 0;
        }
        .quiz__header {
          display: flex; align-items: center; gap: 10px;
          margin-bottom: 16px;
        }
        .quiz__label {
          font-size: 10px; font-weight: 800; text-transform: uppercase;
          letter-spacing: 0.15em; color: #6366f1;
          background: rgba(99,102,241,0.1);
          padding: 4px 10px; border-radius: 6px;
        }
        .quiz__progress { font-size: 13px; font-weight: 700; flex: 1; }
        .quiz__score {
          font-size: 11px; font-weight: 700;
          background: rgba(255,255,255,0.08);
          padding: 4px 10px; border-radius: 20px;
        }
        .quiz__question {
          font-size: 14px;
          font-weight: 700; line-height: 1.5;
          margin-bottom: 12px;
        }
        .quiz__options { display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px; }
        .quiz__option {
          width: 100%; text-align: left;
          padding: 12px 16px;
          border: 1.5px solid var(--ai-border);
          border-radius: 12px;
          background: transparent;
          color: var(--ai-text);
          font-size: 13px; font-weight: 600;
          cursor: pointer;
          transition: border-color 0.15s, background 0.15s, transform 0.1s, opacity 0.15s;
        }
        .quiz__option:hover:not(:disabled) {
          border-color: #6366f1;
          background: rgba(99,102,241,0.06);
          transform: translateX(3px);
        }
        .quiz__option--correct {
          border-color: #10b981 !important;
          background: rgba(16,185,129,0.06) !important;
          color: #10b981 !important;
        }
        .quiz__option--wrong {
          border-color: #ef4444 !important;
          background: rgba(239,68,68,0.06) !important;
          color: #ef4444 !important;
        }
        .quiz__option--dim { opacity: 0.35; }
        .quiz__option:disabled { cursor: default; }

        .quiz__explanation {
          padding: 12px 14px;
          background: rgba(255,255,255,0.04);
          border: 1px solid var(--ai-border);
          border-radius: 12px;
          font-size: 12px; line-height: 1.6;
          font-style: italic;
          margin-bottom: 12px;
        }
        .quiz__explanation-label {
          display: block; font-size: 9px; font-weight: 800;
          text-transform: uppercase; letter-spacing: 0.15em;
          font-style: normal; margin-bottom: 4px;
          color: #6366f1;
        }
        .quiz__next {
          width: 100%; padding: 12px;
          border: none; border-radius: 12px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white; font-size: 13px; font-weight: 700;
          cursor: pointer; transition: opacity 0.15s;
        }
        .quiz__next:hover { opacity: 0.9; }
        .quiz__complete {
          text-align: center; padding: 12px;
          background: rgba(16,185,129,0.1);
          border: 1px solid rgba(16,185,129,0.25);
          border-radius: 12px;
          color: #10b981; font-size: 13px; font-weight: 700;
        }

        /* ── Typing indicator ──────────────────────────── */
        .typing-row { display: flex; align-items: center; gap: 10px; }
        .typing-dots { display: flex; gap: 4px; padding: 14px 16px; background: var(--ai-bubble-bg); border-radius: 16px; border: 1px solid var(--ai-border); }
        .typing-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: #6366f1;
          animation: bounce 0.8s ease-in-out infinite;
        }
        .typing-dot:nth-child(2) { animation-delay: 0.16s; }
        .typing-dot:nth-child(3) { animation-delay: 0.32s; }
        @keyframes bounce {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50%       { transform: scale(1.5); opacity: 1; }
        }

        /* ── Input area ────────────────────────────────── */
        .ai-input-area {
          padding: 14px 16px;
          border-top: 1px solid var(--ai-border);
          background: var(--ai-surface);
          flex-shrink: 0;
        }

        .ai-chips {
          display: flex; gap: 8px; overflow-x: auto;
          padding-bottom: 10px; scrollbar-width: none;
        }
        .ai-chips::-webkit-scrollbar { display: none; }
        .ai-chip {
          white-space: nowrap;
          padding: 6px 12px;
          font-size: 11px; font-weight: 700;
          border: 1px solid var(--ai-border);
          border-radius: 8px;
          background: var(--ai-bg);
          color: var(--ai-muted);
          cursor: pointer;
          transition: color 0.15s, border-color 0.15s;
        }
        .ai-chip:hover { color: #6366f1; border-color: rgba(99,102,241,0.4); }

        .ai-file-preview {
          display: flex; align-items: center; gap: 10px;
          padding: 8px 12px; margin-bottom: 10px;
          background: rgba(99,102,241,0.06);
          border: 1px solid rgba(99,102,241,0.2);
          border-radius: 12px; width: fit-content; max-width: 100%;
        }
        .ai-file-preview__icon { font-size: 20px; }
        .ai-file-preview__name { font-size: 12px; font-weight: 600; }
        .ai-file-preview__label { font-size: 10px; color: #6366f1; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
        .ai-file-preview__remove {
          background: transparent; border: none; cursor: pointer;
          color: var(--ai-muted); font-size: 16px; padding: 0 4px;
          margin-left: 4px;
        }
        .ai-file-preview__remove:hover { color: #ef4444; }

        .ai-input-row { display: flex; gap: 8px; align-items: center; }

        .ai-input-box {
          flex: 1; display: flex; align-items: center; gap: 4px;
          border: 1px solid var(--ai-border);
          border-radius: 24px;
          background: var(--ai-bg);
          padding: 6px 10px;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .ai-input-box:focus-within {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
        }

        .ai-input-btn {
          width: 32px; height: 32px; border-radius: 8px;
          border: none; background: transparent;
          color: var(--ai-muted); cursor: pointer; font-size: 16px;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.15s, color 0.15s;
          flex-shrink: 0;
        }
        .ai-input-btn:hover { background: rgba(99,102,241,0.08); color: #6366f1; }
        .ai-input-btn--listening {
          background: #ef4444; color: white; animation: pulse 1s infinite;
        }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.7} }

        .ai-input-field {
          flex: 1; border: none; background: transparent;
          outline: none; font-size: 13px; color: var(--ai-text);
          padding: 6px 4px;
        }
        .ai-input-field::placeholder { color: var(--ai-muted); }

        .ai-send {
          width: 44px; height: 44px; border-radius: 14px;
          border: none; cursor: pointer; font-size: 18px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; transition: opacity 0.15s, transform 0.1s;
        }
        .ai-send--active {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
        }
        .ai-send--active:hover  { opacity: 0.9; transform: scale(1.05); }
        .ai-send--active:active { transform: scale(0.95); }
        .ai-send--disabled { background: var(--ai-surface); color: var(--ai-muted); cursor: not-allowed; }

        .ai-footer {
          display: flex; justify-content: center; gap: 16px;
          margin-top: 10px;
        }
        .ai-footer-item {
          font-size: 10px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.08em; color: var(--ai-muted); opacity: 0.5;
        }

        /* ── Lang toggle ───────────────────────────────── */
        .lang-toggle {
          display: flex; border: 1px solid var(--ai-border);
          border-radius: 8px; overflow: hidden;
        }
        .lang-toggle__option {
          padding: 6px 10px; font-size: 11px; font-weight: 700;
          border: none; background: transparent; cursor: pointer;
          color: var(--ai-muted); transition: background 0.15s, color 0.15s;
        }
        .lang-toggle__option--active { background: #6366f1; color: white; }
      `}</style>

      <div className={`ai-assistant${isDarkMode ? " ai-assistant--dark" : ""}`}>

        {/* ── Header ─────────────────────────────────────────── */}
        <header className="ai-header">
          <div className="ai-header__identity">
            <div className="ai-header__avatar">AI</div>
            <div>
              <div className="ai-header__name">
                AI Mentor <em>Pro</em>
              </div>
              <div className="ai-header__status">{status}</div>
            </div>
          </div>

          <div className="ai-header__actions">
            {/* Language toggle */}
            <div className="lang-toggle">
              <button
                className={`lang-toggle__option${lang === "en-US" ? " lang-toggle__option--active" : ""}`}
                onClick={() => setLang("en-US")}
              >EN</button>
              <button
                className={`lang-toggle__option${lang === "ur-PK" ? " lang-toggle__option--active" : ""}`}
                onClick={() => setLang("ur-PK")}
              >UR</button>
            </div>

            {/* Quiz mode */}
            <button
              className={`btn-icon${quizMode ? " btn-icon--active" : ""}`}
              onClick={() => setQuizMode((v) => !v)}
            >
              🧠 {quizMode ? "Quiz On" : "Quiz"}
            </button>

            {/* Voice */}
            <button
              className={`btn-icon${voiceOn ? " btn-icon--active" : ""}`}
              onClick={() => { setVoiceOn((v) => !v); if (!voiceOn === false) speech.stop(); }}
            >
              {voiceOn ? "🔊" : "🔇"}
            </button>

            {/* Close */}
            {onClose && (
              <button className="btn-icon btn-icon--close" onClick={onClose}>✕</button>
            )}
          </div>
        </header>

        {/* ── Chat area ───────────────────────────────────────── */}
        <main className="ai-chat">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} isDarkMode={isDarkMode} />
          ))}

          {isLoading && (
            <div className="typing-row">
              <div className="bubble-avatar bubble-avatar--bot">AI</div>
              <div className="typing-dots">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </main>

        {/* ── Input area ──────────────────────────────────────── */}
        <footer className="ai-input-area">

          {/* Suggestion chips */}
          <div className="ai-chips">
            <button className="ai-chip" onClick={() => setInput("Explain 'Promises' in JS at Level 1 (with an analogy)")}>
              👶 Level 1 (Beginner)
            </button>
            <button className="ai-chip" onClick={() => setInput("Deep dive into 'Event Loop' at Level 10")}>
              🧙 Level 10 (Master)
            </button>
            <button className="ai-chip" onClick={() => setInput("Analyze this code and find security leaks.")}>
              🛡️ Security Check
            </button>
          </div>

          {/* Attached file preview */}
          {attachedFile && (
            <div className="ai-file-preview">
              <span className="ai-file-preview__icon">{attachedFile.preview ? "🖼" : "📄"}</span>
              <div>
                <p className="ai-file-preview__name">{attachedFile.name}</p>
                <p className="ai-file-preview__label">Ready for analysis</p>
              </div>
              <button className="ai-file-preview__remove" onClick={() => setAttachedFile(null)}>×</button>
            </div>
          )}

          {/* Input bar */}
          <div className="ai-input-row">
            <div className="ai-input-box">
              {/* File attach */}
              <button className="ai-input-btn" onClick={() => fileInputRef.current?.click()}>📎</button>

              <input
                ref={inputRef}
                className="ai-input-field"
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                placeholder={isListening ? "Listening..." : quizMode ? "What topic to quiz on?" : "Type your question..."}
              />

              {/* Mic */}
              {micAvailable && (
                <button
                  className={`ai-input-btn${isListening ? " ai-input-btn--listening" : ""}`}
                  onClick={toggleListening}
                >
                  {isListening ? "🔴" : "🎙"}
                </button>
              )}
            </div>

            {/* Send */}
            <button
              className={`ai-send${(!input.trim() && !attachedFile) || isLoading ? " ai-send--disabled" : " ai-send--active"}`}
              onClick={handleSend}
              disabled={(!input.trim() && !attachedFile) || isLoading}
            >
              {isLoading ? "⏳" : "➤"}
            </button>
          </div>

          <div className="ai-footer">
            <span className="ai-footer-item">{voiceOn ? "Voice Active" : "Voice Muted"}</span>
            <span className="ai-footer-item">·</span>
            <span className="ai-footer-item">Powered by Claude</span>
          </div>
        </footer>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          style={{ display: "none" }}
          accept=".js,.ts,.jsx,.tsx,.json,.html,.css,.txt,.md,.py,.java,.cpp,.c"
          onChange={handleFileChange}
        />
      </div>
    </>
  );
}

export default AIAssistant;
