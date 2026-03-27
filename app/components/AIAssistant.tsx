"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Zap } from "lucide-react";

// ─────────────────────────────────────────────────────────────────
//  MODULE: speechManager
//  Singleton voice queue — one instance, no double-speak.
// ─────────────────────────────────────────────────────────────────

const speechManager = (() => {
  let active = false;
  const subs = new Set<(v: boolean) => void>();

  const broadcast = (val: boolean) => {
    active = val;
    subs.forEach((fn) => fn(val));
  };

  const pickVoice = (lang: string) => {
    const voices = window.speechSynthesis.getVoices();
    if (lang === "en") {
      return (
        voices.find((v) => v.lang.startsWith("en") && /Google|Neural|Premium|Enhanced/.test(v.name)) ||
        voices.find((v) => v.lang === "en-US") ||
        voices.find((v) => v.lang.startsWith("en"))
      );
    }
    return voices.find((v) => v.lang.startsWith("ur")) || voices.find((v) => v.lang.startsWith("hi"));
  };

  const speakSegment = (text: string, lang: string) =>
    new Promise((resolve) => {
      const utt = new SpeechSynthesisUtterance(text);
      const voice = pickVoice(lang);
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

      utt.onstart = () => broadcast(true);
      utt.onend = () => resolve(undefined);
      utt.onerror = () => resolve(undefined);
      window.speechSynthesis.speak(utt);
    });

  const sanitize = (raw: string) =>
    raw
      .replace(/```[\s\S]*?```/g, " Code block. ")
      .replace(/[*_`#]/g, "")
      .replace(/\n+/g, " ")
      .trim()
      .slice(0, 500);

  return {
    get speaking() { return active; },

    subscribe(fn: (v: boolean) => void) {
      subs.add(fn);
      return () => subs.delete(fn);
    },

    stop() {
      if (!window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      broadcast(false);
    },

    async say(rawText: string) {
      if (!window.speechSynthesis) return;
      this.stop();

      const englishPart = rawText.replace(/\[\[URDU_VOICE:[\s\S]*?\]\]/g, "").trim();
      const urduMatch = rawText.match(/\[\[URDU_VOICE:\s*([\s\S]*?)\s*\]\]/);
      const urduPart = urduMatch?.[1]?.trim() ?? "";

      broadcast(true);
      try {
        if (englishPart) await speakSegment(sanitize(englishPart), "en");
        if (urduPart) await speakSegment(sanitize(urduPart), "ur");
      } finally {
        broadcast(false);
      }
    },
  };
})();

// ─────────────────────────────────────────────────────────────────
//  MODULE: quizMachine
//  Factory for quiz state — ANSWERING → ANSWERED → COMPLETE
// ─────────────────────────────────────────────────────────────────

interface QuizOption {
  id: string;
  text: string;
}

interface QuizQuestion {
  question: string;
  options: QuizOption[];
  isCorrect: string; // ID of the correct option
  explanation: string;
}

const QUIZ_STATE = Object.freeze({ ANSWERING: "ANSWERING", ANSWERED: "ANSWERED", COMPLETE: "COMPLETE" });
type QuizStatus = typeof QUIZ_STATE[keyof typeof QUIZ_STATE];

interface QuizSnapshot {
  status: QuizStatus;
  question: QuizQuestion;
  idx: number;
  total: number;
  score: number;
  chosen: string | null;
  isLast: boolean;
}

interface QuizMachine {
  subscribe: (fn: (snap: QuizSnapshot) => void) => () => void;
  snapshot: () => QuizSnapshot;
  answer: (optionId: string) => void;
  next: () => void;
}

function createQuizMachine(questions: QuizQuestion[]): QuizMachine {
  let status: QuizStatus = QUIZ_STATE.ANSWERING;
  let idx: number = 0;
  let score: number = 0;
  let chosen: string | null = null;
  const subs = new Set<(snap: QuizSnapshot) => void>();

  const snap = (): QuizSnapshot =>
    Object.freeze({
      status,
      question: questions[idx],
      idx,
      total: questions.length,
      score,
      chosen,
      isLast: idx === questions.length - 1,
    });

  const notify = () => subs.forEach((fn) => fn(snap()));

  return {
    subscribe: (fn: (snap: QuizSnapshot) => void) => { subs.add(fn); return () => subs.delete(fn); },
    snapshot: snap,

    answer(optionId: string) {
      if (status !== QUIZ_STATE.ANSWERING) return;
      const q = questions[idx];
      const opt = q.options.find((o: QuizOption) => o.id === optionId);
      if (!opt) return;
      chosen = optionId;
      if (q.isCorrect === optionId) score++;
      status = idx === questions.length - 1 ? QUIZ_STATE.COMPLETE : QUIZ_STATE.ANSWERED;
      notify();
    },

    next() {
      if (status !== QUIZ_STATE.ANSWERED) return;
      idx++;
      chosen = null;
      status = QUIZ_STATE.ANSWERING;
      notify();
    },
  };
}

// ─────────────────────────────────────────────────────────────────
//  MODULE: parser
//  Turns raw assistant text into typed render parts.
// ─────────────────────────────────────────────────────────────────

interface TextPart {
  type: "text";
  content: string;
}

interface CodePart {
  type: "code";
  lang: string;
  content: string;
}

interface QuizPart {
  type: "quiz";
  questions: QuizQuestion[];
}

type ContentPart = TextPart | CodePart | QuizPart;

const parser = {
  parse(text: string): ContentPart[] {
    const parts: ContentPart[] = [];
    // Robust quiz extraction: handle spaces inside tags and remove any leftover bracket text
    const quizRx = /\[\[\s*QUIZ\s*:\s*START\s*\]\]([\s\S]*?)\[\[\s*QUIZ\s*:\s*END\s*\]\]/gi;
    let lastIdx = 0;
    let m: RegExpExecArray | null;

    while ((m = quizRx.exec(text)) !== null) {
      if (m.index > lastIdx) {
        const pre = text.slice(lastIdx, m.index).trim();
        if (pre) parts.push({ type: "text", content: pre });
      }
      try {
        const qs: QuizQuestion[] = JSON.parse(m[1].trim());
        if (Array.isArray(qs) && qs.length) parts.push({ type: "quiz", questions: qs });
      } catch (e) {
        // Hiding unclosed tags or malformed JSON
        console.warn("[Parser] Quiz JSON failed", e);
      }
      lastIdx = m.index + m[0].length;
    }

    // Clean up unclosed tags to prevent raw tag leakage
    let rest = text.slice(lastIdx);
    rest = rest.replace(/\[\[\s*QUIZ\s*:\s*START\s*\]\][\s\S]*$/gi, "").trim();
    
    if (!rest && parts.length > 0) return parts;

    const codeRx = /```(\w*)\n?([\s\S]*?)```/g;
    let cursor = 0;
    const restParts: ContentPart[] = [];

    while ((m = codeRx.exec(rest)) !== null) {
      if (m.index > cursor) restParts.push({ type: "text", content: rest.slice(cursor, m.index).trim() });
      restParts.push({ type: "code", lang: m[1] || "javascript", content: m[2].trim() });
      cursor = m.index + m[0].length;
    }

    if (cursor < rest.length) {
      const fin = rest.slice(cursor).trim();
      if (fin) restParts.push({ type: "text", content: fin });
    }

    return [...parts, ...restParts];
  },
  inlineMarkdown(text: string): React.ReactNode[] {
    return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((seg: string, i: number) => {
      if (seg.startsWith("**") && seg.endsWith("**"))
        return <strong key={i}>{seg.slice(2, -2)}</strong>;
      if (seg.startsWith("`") && seg.endsWith("`") && seg.length > 2)
        return <code key={i} className="ic">{seg.slice(1, -1)}</code>;
      return <span key={i}>{seg}</span>;
    });
  },
};

// ─────────────────────────────────────────────────────────────────
//  COMPONENT: CodeBlock
// ─────────────────────────────────────────────────────────────────

function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const [copied, setCopied] = useState<boolean>(false);

  const copy = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [code]);

  return (
    <div className="cb">
      <div className="cb__bar">
        <div className="cb__dots"><span /><span /><span /></div>
        <span className="cb__lang">{lang || "code"}</span>
        <button className="cb__copy" onClick={copy}>{copied ? "✓ Copied" : "Copy"}</button>
      </div>
      <div className="cb__scroll">
        <table>
          <tbody>
            {code.split("\n").map((line: string, i: number) => (
              <tr key={i}>
                <td className="cb__ln">{i + 1}</td>
                <td className="cb__line">
                  <pre><code>{line || " "}</code></pre>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
//  COMPONENT: QuizCard
//  Driven by quizMachine — zero local answer state.
// ─────────────────────────────────────────────────────────────────

function QuizCard({ questions }: { questions: QuizQuestion[] }) {
  const machineRef = useRef<QuizMachine | null>(null);
  if (!machineRef.current) machineRef.current = createQuizMachine(questions);

  const [snap, setSnap] = useState<QuizSnapshot>(() => machineRef.current!.snapshot());

  useEffect(() => machineRef.current!.subscribe(setSnap), []);

  const { ANSWERING, ANSWERED, COMPLETE } = QUIZ_STATE;
  const isAnswered = snap.status === ANSWERED || snap.status === COMPLETE;

  const optClass = (opt: QuizOption): string => {
    const base = "qz__opt";
    if (snap.status === ANSWERING) return base;
    const correctId = snap.question.isCorrect;
    if (opt.id === correctId) return `${base} qz__opt--ok`;
    if (snap.chosen === opt.id && opt.id !== correctId) return `${base} qz__opt--bad`;
    return `${base} qz__opt--dim`;
  };

  const pct = Math.round(((snap.idx + (isAnswered ? 1 : 0)) / snap.total) * 100);

  return (
    <div className="qz">
      {/* Progress bar */}
      <div className="qz__prog-track"><div className="qz__prog-fill" style={{ width: `${pct}%` }} /></div>

      <div className="qz__head">
        <span className="qz__badge">Knowledge Check</span>
        <span className="qz__counter">{snap.idx + 1} / {snap.total}</span>
        <span className="qz__score">🏆 {snap.score}</span>
      </div>

      <p className="qz__q">{snap.question.question}</p>

      <div className="qz__opts">
        {snap.question.options.map((opt: QuizOption) => (
          <button
            key={opt.id}
            className={optClass(opt)}
            disabled={snap.status !== ANSWERING}
            onClick={() => machineRef.current!.answer(opt.id)}
          >
            <span className="qz__opt-label">{opt.id.toUpperCase()}</span>
            {opt.text}
          </button>
        ))}
      </div>

      {isAnswered && (
        <div className="qz__explain">
          <span className="qz__explain-tag">Explanation</span>
          {snap.question.explanation}
        </div>
      )}

      {snap.status === ANSWERED && !snap.isLast && (
        <button className="qz__next" onClick={() => machineRef.current!.next()}>
          Next Question →
        </button>
      )}

      {snap.status === COMPLETE && (
        <div className="qz__done">
          <span className="qz__done-icon">{snap.score === snap.total ? "🎉" : snap.score >= snap.total / 2 ? "👍" : "📚"}</span>
          <div>
            <p className="qz__done-title">Quiz Complete!</p>
            <p className="qz__done-sub">Final Score: {snap.score} / {snap.total}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
//  COMPONENT: Bubble
// ─────────────────────────────────────────────────────────────────

function Bubble({ message, isDarkMode }: { message: Message; isDarkMode: boolean }) {
  const displayText = message.content.replace(/\[\[URDU_VOICE:[\s\S]*?\]\]/g, "").trim();
  const parts = parser.parse(displayText);
  const isUser = message.role === "user";

  return (
    <div className={`row ${isUser ? "row--user" : "row--bot"}`}>
      <div className={`av ${isUser ? "av--user" : "av--bot"}`}>{isUser ? "U" : "AI"}</div>

      <div className={`bub ${isUser ? "bub--user" : isDarkMode ? "bub--dark" : "bub--light"}`}>
        {message.file && (
          <div className="bub__file">
            {message.file.preview
              ? <img src={message.file.preview} alt="" className="bub__img" />
              : <span className="bub__file-icon">📄</span>
            }
            <div>
              <p className="bub__fname">{message.file.name}</p>
              <p className="bub__fmeta">Attached</p>
            </div>
          </div>
        )}

        {isUser ? (
          <p className="bub__text">{message.content}</p>
        ) : (
          <div className="bub__body">
            {parts.map((part: ContentPart, i: number) => {
              if (part.type === "code") return <CodeBlock key={i} code={part.content} lang={part.lang} />;
              if (part.type === "quiz") return <QuizCard key={i} questions={part.questions} />;
              return <p key={i} className="bub__text">{parser.inlineMarkdown(part.content)}</p>;
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
//  COMPONENT: TypingDots
// ─────────────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div className="row row--bot">
      <div className="av av--bot">AI</div>
      <div className="typing"><span /><span /><span /></div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
//  MAIN: AIAssistant  ← main export
// ─────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  file?: {
    name: string;
    type: string;
    preview?: string;
  };
}

interface ChatFile {
  name: string;
  type: string;
  preview?: string;
  base64: string;
}

interface ChatPayload {
  message: string;
  history: { role: string; content: string }[];
  language: string;
  mode: string;
  file?: { name: string; type: string; base64: string };
}

export function AIAssistant({ isDarkMode = false, onClose }: { isDarkMode?: boolean; onClose?: () => void }) {
  const [messages, setMessages] = useState<Message[]>([{
    id: "welcome",
    role: "assistant",
    content: `Hey there! 👋 I'm your **Human-Centric AI Mentor**.

I break down complex code at any level you need.
• **Level 1** — Explain like I'm 5 (analogies & stories)
• **Level 10** — Expert technical deep dive
• **Any Language** — JS, Python, C++, and more

Paste code or pick a command below! 🚀`,
  }]);

  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [voiceOn, setVoiceOn] = useState<boolean>(true);
  const [speaking, setSpeaking] = useState<boolean>(false);
  const [listening, setListening] = useState<boolean>(false);
  const [hasMic, setHasMic] = useState<boolean>(false);
  const [file, setFile] = useState<ChatFile | null>(null);
  const [quizMode, setQuizMode] = useState<boolean>(false);
  const [lang, setLang] = useState<string>("en-US");

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const recRef = useRef<any>(null);

  // Subscribe to speech state
  useEffect(() => {
    const unsub = speechManager.subscribe(setSpeaking);
    return () => { unsub(); speechManager.stop(); recRef.current?.stop(); };
  }, []);

  // Detect mic support
  useEffect(() => {
    setHasMic(!!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition));
  }, []);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // ── File handler ─────────────────────────────────────────────

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) { alert("Max file size: 10 MB"); return; }

    const reader = new FileReader();
    reader.onload = (ev: ProgressEvent<FileReader>) => {
      const url = ev.target?.result as string;
      setFile({
        name: f.name,
        type: f.type,
        preview: f.type.startsWith("image/") ? url : undefined,
        base64: url.split(",")[1],
      });
    };
    reader.readAsDataURL(f);
    e.target.value = "";
  }

  // ── Voice input ──────────────────────────────────────────────

  function toggleMic() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert("Voice input requires Chrome or Edge."); return; }

    if (listening) { recRef.current?.stop(); setListening(false); return; }

    speechManager.stop();
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = lang;

    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onerror = (e: any) => { if (e.error !== "no-speech") alert(`Voice error: ${e.error}`); setListening(false); };
    rec.onresult = (e: any) => {
      let final = "";
      for (let i = e.resultIndex; i < e.results.length; i++)
        if (e.results[i].isFinal) final += e.results[i][0].transcript;
      if (final) { setInput((p) => p ? `${p} ${final}` : final); inputRef.current?.focus(); }
    };

    rec.start();
    recRef.current = rec;
  }

  // ── Send message ─────────────────────────────────────────────

  async function send() {
    const text = input.trim();
    if (!text && !file) return;

    // Unblock iOS audio inside user gesture
    if (voiceOn && window.speechSynthesis) {
      const primer = new SpeechSynthesisUtterance("");
      primer.volume = 0;
      window.speechSynthesis.speak(primer);
    }

    const snap = file;
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text || `[File: ${snap?.name}]`,
      file: snap ? { name: snap.name, type: snap.type, preview: snap.preview } : undefined,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setFile(null);
    setLoading(true);

    try {
      const payload: ChatPayload = {
        message: userMsg.content,
        history: messages.map(({ role, content }) => ({ role, content })),
        language: lang,
        mode: quizMode ? "quiz" : "normal",
      };
      if (snap?.base64) payload.file = { name: snap.name, type: snap.type, base64: snap.base64 };

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();

      if (data.type === "quiz" && Array.isArray(data.questions)) {
        setMessages((prev) => [...prev, {
          id: String(Date.now() + 1),
          role: "assistant",
          content: `[[QUIZ:START]]${JSON.stringify(data.questions)}[[QUIZ:END]]`,
        }]);
      } else {
        const reply = data.message || "No response. Please try again.";
        setMessages((prev) => [...prev, { id: String(Date.now() + 1), role: "assistant", content: reply }]);
        if (voiceOn) speechManager.say(reply);
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [...prev, {
        id: String(Date.now()),
        role: "assistant",
        content: "⚠️ Connection error. Please refresh and try again.",
      }]);
    } finally {
      setLoading(false);
    }
  }

  function onKey(e: React.KeyboardEvent<HTMLElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }

  const canSend = (!!input.trim() || !!file) && !loading;
  const status = speaking ? "Speaking…" : listening ? "Listening…" : loading ? "Thinking…" : quizMode ? "Quiz Mode" : "Online";

  // ── Render ──────────────────────────────────────────────────

  return (
    <>
      <style>{`
        /* ── Reset ─────────────────────────────────── */
        .aia * { box-sizing: border-box; margin: 0; padding: 0; }

                /* ── Root ──────────────────────────────────── */
        .aia {
          display: flex; flex-direction: column;
          width: 100%; height: 100%; overflow: hidden;
          font-family: 'DM Sans', ui-sans-serif, system-ui, sans-serif;
          background: var(--bg); color: var(--fg);
          font-size: 13px;
        }
        @media (max-width: 640px) {
          .aia { font-size: 12px; }
        }
        .aia--dark {
          --bg:       #020617;
          --fg:       #f8fafc;
          --border:   rgba(255,255,255,0.06);
          --surf:     #0f172a;
          --muted:    #94a3b8;
          --bub-bg:   #1e293b;
          --bub-bd:   #334155;
          --accent:   #3b82f6;
          --accent2:  #6366f1;
        }
        .aia:not(.aia--dark) {
          --bg:       #ffffff;
          --fg:       #0f172a;
          --border:   #e2e8f0;
          --surf:     #f8fafc;
          --muted:    #64748b;
          --bub-bg:   #f1f5f9;
          --bub-bd:   #e2e8f0;
          --accent:   #2563eb;
          --accent2:  #4f46e5;
        }

        /* ── Header ──────────────────────────────── */
        .aia__hd {
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 14px;
          border-bottom: 1px solid var(--border);
          background: var(--bg); z-index: 10;
        }
        @media (min-width: 640px) {
          .aia__hd { padding: 12px 16px; }
        }
        .aia__id { display: flex; align-items: center; gap: 8px; }
        @media (min-width: 640px) {
          .aia__id { gap: 10px; }
        }
        .aia__av {
          width: 32px; height: 32px; border-radius: 10px;
          background: linear-gradient(135deg, var(--accent), var(--accent2));
          display: flex; align-items: center; justify-content: center;
          color: #fff; font-weight: 800; font-size: 13px;
          box-shadow: 0 4px 10px rgba(37,99,235,0.15);
        }
        @media (min-width: 640px) {
          .aia__av { width: 36px; height: 36px; border-radius: 12px; }
        }
        .aia__name { font-size: 13px; font-weight: 800; letter-spacing: -0.01em; }
        @media (min-width: 640px) {
          .aia__name { font-size: 15px; letter-spacing: -0.015em; }
        }
        .aia__name em { color: var(--accent); font-style: normal; }
        .aia__st {
          font-size: 9px; color: var(--muted); margin-top: 1px;
          display: flex; align-items: center; gap: 4px; font-weight: 600;
        }
        @media (min-width: 640px) {
          .aia__st { font-size: 10px; margin-top: 2px; gap: 5px; }
        }
        .aia__dot {
          width: 5px; height: 5px; border-radius: 50%;
          background: #10b981; box-shadow: 0 0 0 2px rgba(16,185,129,0.15);
        }
        @media (min-width: 640px) {
          .aia__dot { width: 6px; height: 6px; }
        }

        /* ── Actions ─────────────────────────────── */
        .aia__acts { display: flex; gap: 4px; align-items: center; }
        @media (min-width: 640px) {
          .aia__acts { gap: 6px; }
        }
        .btn {
          display: flex; align-items: center; gap: 3px;
          padding: 5px 8px; border-radius: 6px;
          border: 1px solid var(--border);
          background: var(--bg); color: var(--fg);
          cursor: pointer; font-size: 10px; font-weight: 700;
          transition: all 0.2s;
          white-space: nowrap;
        }
        @media (min-width: 640px) {
          .btn { padding: 6px 10px; border-radius: 8px; font-size: 11px; gap: 4px; }
        }
        .btn:hover { background: var(--surf); border-color: var(--muted); }
        .btn--on { background: var(--accent); color: #fff; border-color: var(--accent); }
        .btn--close { background: #ef4444; color: #fff; border-color: #ef4444; padding: 5px 8px; }
        @media (min-width: 640px) {
            .btn--close { padding: 6px 10px; }
        }

        .ltog { display: flex; border: 1px solid var(--border); border-radius: 6px; overflow: hidden; }
        @media (min-width: 640px) {
          .ltog { border-radius: 8px; }
        }
        .ltog__opt {
          padding: 5px 6px; font-size: 9px; font-weight: 800;
          border: none; background: transparent; color: var(--muted);
          cursor: pointer; transition: all 0.2s;
        }
        @media (min-width: 640px) {
          .ltog__opt { padding: 6px 10px; font-size: 10px; }
        }
        .ltog__opt--on { background: var(--accent); color: #fff; }

        /* ── Chat ────────────────────────────────── */
        .aia__chat {
          flex: 1; overflow-y: auto; padding: 12px 10px;
          display: flex; flex-direction: column; gap: 12px;
        }
        @media (min-width: 640px) {
          .aia__chat { padding: 20px 16px; gap: 16px; }
        }
        .aia__chat::-webkit-scrollbar { width: 4px; }
        .aia__chat::-webkit-scrollbar-thumb { background: var(--border); border-radius: 10px; }

        .row { display: flex; gap: 8px; }
        @media (min-width: 640px) {
            .row { gap: 10px; }
        }
        .row--user { flex-direction: row-reverse; }
        .av {
          width: 24px; height: 24px; border-radius: 6px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          font-size: 8px; font-weight: 900;
        }
        @media (min-width: 640px) {
          .av { width: 28px; height: 28px; border-radius: 8px; font-size: 9px; }
        }
        .av--user { background: #475569; color: #fff; }
        .av--bot { background: linear-gradient(135deg, var(--accent), var(--accent2)); color: #fff; }

        .bub {
          max-width: 92%; padding: 8px 12px; border-radius: 14px;
          font-size: 12px; line-height: 1.45;
        }
        @media (min-width: 640px) {
          .bub { max-width: 85%; padding: 10px 14px; border-radius: 16px; font-size: 13px; line-height: 1.5; }
        }
        .bub--user { background: var(--accent); color: #fff; border-bottom-right-radius: 4px; box-shadow: 0 4px 12px rgba(37,99,235,0.1); }
        .bub--light, .bub--dark { background: var(--bub-bg); color: var(--fg); border: 1px solid var(--bub-bd); border-bottom-left-radius: 4px; }

        .bub__text { white-space: pre-wrap; }
        .ic { padding: 1px 3px; background: rgba(0,0,0,0.05); border-radius: 3px; font-family: 'Fira Code', monospace; font-size: 0.9em; color: var(--accent); }
        @media (min-width: 640px) {
            .ic { padding: 2px 5px; border-radius: 4px; }
        }

        /* ── Code Blocks ────────────────────────── */
        .cb { border-radius: 8px; overflow: hidden; margin: 8px 0; background: #011627; border: 1px solid rgba(255,255,255,0.08); }
        @media (min-width: 640px) {
          .cb { border-radius: 10px; margin: 10px 0; }
        }
        .cb__bar {
          display: flex; align-items: center; gap: 6px; padding: 6px 10px;
          background: rgba(255,255,255,0.04); border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        @media (min-width: 640px) {
          .cb__bar { gap: 8px; padding: 8px 14px; }
        }
        .cb__dots { display: flex; gap: 4px; flex: 1; }
        @media (min-width: 640px) {
          .cb__dots { gap: 5px; }
        }
        .cb__dots span { width: 6px; height: 6px; border-radius: 50%; }
        @media (min-width: 640px) {
          .cb__dots span { width: 8px; height: 8px; }
        }
        .cb__dots span:nth-child(1) { background: #ff5f56; }
        .cb__dots span:nth-child(2) { background: #ffbd2e; }
        .cb__dots span:nth-child(3) { background: #27c93f; }
        .cb__lang { font-size: 8px; font-weight: 800; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 0.05em; }
        @media (min-width: 640px) {
          .cb__lang { font-size: 9px; }
        }
        .cb__copy { background: transparent; border: 1px solid rgba(255,255,255,0.1); color: #fff; font-size: 8px; padding: 2px 6px; border-radius: 4px; cursor: pointer; }
        @media (min-width: 640px) {
          .cb__copy { font-size: 9px; padding: 3px 8px; border-radius: 5px; }
        }
        .cb__scroll { overflow-x: auto; padding: 8px; font-family: 'Fira Code', monospace; font-size: 11px; line-height: 1.35; }
        @media (min-width: 640px) {
          .cb__scroll { padding: 10px; font-size: 12px; line-height: 1.45; }
        }
        .cb__ln { color: rgba(255,255,255,0.15); text-align: right; padding-right: 8px; user-select: none; }
        @media (min-width: 640px) {
          .cb__ln { padding-right: 10px; }
        }
        
        /* ── Quiz ───────────────────────────────── */
        .qz { border-radius: 10px; background: var(--surf); border: 1px solid var(--border); overflow: hidden; margin-top: 6px; }
        @media (min-width: 640px) {
          .qz { border-radius: 12px; margin-top: 8px; }
        }
        .qz__prog-track { height: 2px; background: rgba(0,0,0,0.04); }
        @media (min-width: 640px) {
          .qz__prog-track { height: 3px; }
        }
        .qz__prog-fill { height: 100%; background: linear-gradient(90deg, var(--accent), var(--accent2)); transition: width 0.3s; }
        .qz__head { padding: 10px 10px 4px; display: flex; align-items: center; justify-content: space-between; }
        @media (min-width: 640px) {
            .qz__head { padding: 14px 14px 6px; }
        }
        .qz__badge { font-size: 8px; font-weight: 800; text-transform: uppercase; color: var(--accent); }
        .qz__q { font-size: 13px; font-weight: 700; padding: 0 10px 10px; }
        @media (min-width: 640px) {
          .qz__q { font-size: 14px; padding: 0 14px 14px; }
        }
        .qz__opts { padding: 0 10px 10px; display: flex; flex-direction: column; gap: 5px; }
        @media (min-width: 640px) {
          .qz__opts { padding: 0 14px 14px; gap: 6px; }
        }
        .qz__opt {
          width: 100%; text-align: left; padding: 6px 10px; border: 1.5px solid var(--border); border-radius: 10px;
          background: var(--bg); cursor: pointer; font-size: 12px; font-weight: 600; transition: all 0.2s;
          display: flex; align-items: center; gap: 8px;
        }
        @media (min-width: 640px) {
          .qz__opt { padding: 8px 12px; border-radius: 12px; font-size: 13px; gap: 10px; }
        }
        .qz__opt:hover:not(:disabled) { border-color: var(--accent); background: rgba(37,99,235,0.03); }
        .qz__opt-label {
          width: 24px; height: 24px; border-radius: 6px; background: var(--surf);
          display: flex; align-items: center; justify-content: center;
          font-size: 10px; font-weight: 900; color: var(--muted); border: 1px solid var(--border); flex-shrink: 0;
          transition: all 0.2s;
        }
        @media (min-width: 640px) {
          .qz__opt-label { width: 28px; height: 28px; border-radius: 8px; font-size: 11px; }
        }
        .qz__opt--ok { border-color: #10b981; background: rgba(16,185,129,0.05); color: #10b981; }
        .qz__opt--ok .qz__opt-label { background: #10b981; color: #fff; border-color: #10b981; }
        .qz__opt--bad { border-color: #ef4444; background: rgba(239,68,68,0.05); color: #ef4444; }
        .qz__opt--bad .qz__opt-label { background: #ef4444; color: #fff; border-color: #ef4444; }
        .qz__opt--dim { opacity: 0.45; filter: grayscale(1); }
        
        .qz__explain { padding: 10px; background: rgba(0,0,0,0.02); font-size: 12px; font-style: italic; border-top: 1px solid var(--border); color: var(--muted); line-height: 1.45; }
        @media (min-width: 640px) {
          .qz__explain { padding: 14px; font-size: 13px; line-height: 1.5; }
        }
        .qz__next { width: calc(100% - 20px); margin: 0 10px 10px; padding: 8px; border: none; border-radius: 8px; background: var(--accent); color: #fff; font-weight: 800; cursor: pointer; font-size: 12px; }
        @media (min-width: 640px) {
          .qz__next { width: calc(100% - 28px); margin: 0 14px 14px; padding: 10px; border-radius: 10px; font-size: 13px; }
        }

        /* ── Typing ──────────────────────────────── */
        .typing { display: flex; gap: 3px; padding: 8px 12px; background: var(--surf); border-radius: 12px; width: fit-content; }
        @media (min-width: 640px) {
            .typing { padding: 10px 14px; border-radius: 14px; }
        }
        .typing span { width: 4px; height: 4px; border-radius: 50%; background: var(--accent); animation: bounce 1s infinite; }
        @media (min-width: 640px) {
            .typing span { width: 5px; height: 5px; }
        }
        .typing span:nth-child(2) { animation-delay: 0.2s; }
        .typing span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes bounce { 0%, 100% { transform: scale(1); opacity: 0.4; } 50% { transform: scale(1.4); opacity: 1; } }

        /* ── Footer / Input ──────────────────────── */
        .aia__ft { padding: 10px 14px; border-top: 1px solid var(--border); background: var(--bg); }
        @media (min-width: 640px) {
          .aia__ft { padding: 14px 18px; }
        }
        .chips { display: flex; gap: 5px; overflow-x: auto; padding-bottom: 8px; scrollbar-width: none; }
        @media (min-width: 640px) {
          .chips { gap: 6px; padding-bottom: 10px; }
        }
        .chips::-webkit-scrollbar { display: none; }
        .chip { padding: 4px 10px; border-radius: 14px; border: 1px solid var(--border); background: var(--surf); font-size: 10px; font-weight: 700; cursor: pointer; white-space: nowrap; transition: all 0.2s; }
        @media (min-width: 640px) {
          .chip { padding: 5px 12px; border-radius: 16px; font-size: 11px; }
        }
        .chip:hover { border-color: var(--accent); color: var(--accent); }

        .irow { display: flex; gap: 6px; align-items: flex-end; }
        @media (min-width: 640px) {
          .irow { gap: 10px; }
        }
        .ibox {
          flex: 1; display: flex; align-items: center; gap: 4px; padding: 6px 12px;
          background: var(--surf); border: 1px solid var(--border); border-radius: 16px; transition: all 0.2s;
        }
        @media (min-width: 640px) {
          .ibox { gap: 6px; padding: 8px 14px; border-radius: 20px; }
        }
        .ibox:focus-within { border-color: var(--accent); background: var(--bg); box-shadow: 0 0 0 3px rgba(37,99,235,0.08); }
        
        .ifield { flex: 1; border: none; background: transparent; outline: none; font-size: 13px; color: var(--fg); min-height: 20px; }
        @media (min-width: 640px) {
          .ifield { font-size: 14px; }
        }
        .ibtn { width: 24px; height: 24px; border-radius: 50%; border: none; background: transparent; cursor: pointer; font-size: 14px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
        @media (min-width: 640px) {
          .ibtn { width: 28px; height: 28px; font-size: 16px; }
        }
        .ibtn:hover { background: rgba(0,0,0,0.04); color: var(--accent); }
        .ibtn--rec { color: #ef4444; animation: pulse 1s infinite; }

        .send {
          width: 32px; height: 32px; border-radius: 50%; border: none;
          background: var(--accent); color: #fff; cursor: pointer; font-size: 14px;
          display: flex; align-items: center; justify-content: center; transition: all 0.2s;
        }
        @media (min-width: 640px) {
          .send { width: 36px; height: 36px; font-size: 16px; }
        }
        .send:hover:not(:disabled) { transform: scale(1.05); box-shadow: 0 4px 10px rgba(37,99,235,0.2); }
        .send:disabled { background: var(--border); opacity: 0.5; cursor: not-allowed; }

        .aia__cap { margin-top: 8px; text-align: center; font-size: 8px; font-weight: 800; color: var(--muted); text-transform: uppercase; letter-spacing: 0.04em; opacity: 0.6; }
        @media (min-width: 640px) {
          .aia__cap { margin-top: 10px; font-size: 9px; letter-spacing: 0.05em; }
        }


      `}</style>

      <div className={`aia${isDarkMode ? " aia--dark" : ""}`}>

        {/* ── Header ──────────────────────────────────────── */}
        <header className="aia__hd">
          <div className="aia__id">
            <div className="aia__av"><Zap className="w-5 h-5 fill-white" /></div>
            <div>
              <div className="aia__name">AI Mentor <em>Pro</em></div>
              <div className="aia__st">
                <span className="aia__dot" />
                {status}
              </div>
            </div>
          </div>

          <div className="aia__acts">
            <div className="ltog">
              <button className={`ltog__opt${lang === "en-US" ? " ltog__opt--on" : ""}`} onClick={() => setLang("en-US")}>EN</button>
              <button className={`ltog__opt${lang === "ur-PK" ? " ltog__opt--on" : ""}`} onClick={() => setLang("ur-PK")}>UR</button>
            </div>

            <button className={`btn${quizMode ? " btn--on" : ""}`} onClick={() => setQuizMode((v) => !v)}>
              🧠 {quizMode ? "Quiz On" : "Quiz"}
            </button>

            <button
              className={`btn${voiceOn ? " btn--on" : ""}`}
              onClick={() => { setVoiceOn((v) => !v); if (voiceOn) speechManager.stop(); }}
            >
              {voiceOn ? "🔊" : "🔇"}
            </button>

            {onClose && <button className="btn btn--close" onClick={onClose}>✕</button>}
          </div>
        </header>

        {/* ── Chat ────────────────────────────────────────── */}
        <main className="aia__chat">
          {messages.map((msg) => <Bubble key={msg.id} message={msg} isDarkMode={isDarkMode} />)}
          {loading && <TypingDots />}
          <div ref={bottomRef} />
        </main>

        {/* ── Footer / Input ───────────────────────────────── */}
        <footer className="aia__ft">
          <div className="chips">
            <button className="chip" onClick={() => setInput("Explain 'Promises' at Level 1 using an analogy")}>👶 Beginner</button>
            <button className="chip" onClick={() => setInput("Deep dive into Event Loop at Level 10")}>🧙 Expert</button>
            <button className="chip" onClick={() => setInput("Analyze this code for security vulnerabilities")}>🛡️ Security</button>
            <button className="chip" onClick={() => { setQuizMode(true); setInput("Quiz me on JavaScript fundamentals"); }}>🧠 Quiz Me</button>
          </div>

          {file && (
            <div className="fprev">
              <span>{file.preview ? "🖼" : "📄"}</span>
              <div>
                <p className="fprev__name">{file.name}</p>
                <p className="fprev__tag">Ready</p>
              </div>
              <button className="fprev__rm" onClick={() => setFile(null)}>×</button>
            </div>
          )}

          <div className="irow">
            <div className="ibox">
              <button className="ibtn" onClick={() => fileRef.current?.click()}>📎</button>
              <input
                ref={inputRef}
                className="ifield"
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKey}
                disabled={loading}
                placeholder={listening ? "Listening…" : quizMode ? "Which topic to quiz on?" : "Ask anything…"}
              />
              {hasMic && (
                <button className={`ibtn${listening ? " ibtn--rec" : ""}`} onClick={toggleMic}>
                  {listening ? "🔴" : "🎙"}
                </button>
              )}
            </div>

            <button className={`send${canSend ? " send--on" : " send--off"}`} onClick={send} disabled={!canSend}>
              {loading ? "⏳" : "➤"}
            </button>
          </div>

          <div className="aia__cap">
            <span className="cap-item">{voiceOn ? "Voice Active" : "Voice Muted"}</span>
            <span className="cap-item">·</span>
            <span className="cap-item">Powered by Claude</span>
          </div>
        </footer>

        <input
          ref={fileRef}
          type="file"
          style={{ display: "none" }}
          accept=".js,.ts,.jsx,.tsx,.json,.html,.css,.txt,.md,.py,.java,.cpp,.c"
          onChange={onFileChange}
        />
      </div>
    </>
  );
}

export default AIAssistant;
