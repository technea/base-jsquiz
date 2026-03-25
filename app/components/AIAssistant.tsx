"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Zap } from "lucide-react";

// ─────────────────────────────────────────────────────────────────
//  MODULE: speechManager
//  Singleton voice queue — one instance, no double-speak.
// ─────────────────────────────────────────────────────────────────

const speechManager = (() => {
  let active = false;
  const subs = new Set();

  const broadcast = (val) => {
    active = val;
    subs.forEach((fn) => fn(val));
  };

  const pickVoice = (lang) => {
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

  const speakSegment = (text, lang) =>
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

  const sanitize = (raw) =>
    raw
      .replace(/```[\s\S]*?```/g, " Code block. ")
      .replace(/[*_`#]/g, "")
      .replace(/\n+/g, " ")
      .trim()
      .slice(0, 500);

  return {
    get speaking() { return active; },

    subscribe(fn) {
      subs.add(fn);
      return () => subs.delete(fn);
    },

    stop() {
      if (!window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      broadcast(false);
    },

    async say(rawText) {
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

const QUIZ_STATE = Object.freeze({ ANSWERING: "ANSWERING", ANSWERED: "ANSWERED", COMPLETE: "COMPLETE" });

function createQuizMachine(questions) {
  let status = QUIZ_STATE.ANSWERING;
  let idx = 0;
  let score = 0;
  let chosen = null;
  const subs = new Set();

  const snap = () =>
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
    subscribe: (fn) => { subs.add(fn); return () => subs.delete(fn); },
    snapshot: snap,

    answer(optionId: string) {
      if (status !== QUIZ_STATE.ANSWERING) return;
      const q = questions[idx];
      const opt = q.options.find((o: any) => o.id === optionId);
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

const parser = {
  parse(text: string) {
    const parts = [];
    // Robust quiz extraction: handle spaces inside tags and remove any leftover bracket text
    const quizRx = /\[\[\s*QUIZ\s*:\s*START\s*\]\]([\s\S]*?)\[\[\s*QUIZ\s*:\s*END\s*\]\]/gi;
    let lastIdx = 0;
    let m;

    while ((m = quizRx.exec(text)) !== null) {
      if (m.index > lastIdx) {
        const pre = text.slice(lastIdx, m.index).trim();
        if (pre) parts.push({ type: "text", content: pre });
      }
      try {
        const qs = JSON.parse(m[1].trim());
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
    let restParts = [];

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

  inlineMarkdown(text) {
    return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((seg, i) => {
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

function CodeBlock({ code, lang }) {
  const [copied, setCopied] = useState(false);

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
            {code.split("\n").map((line, i) => (
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

function QuizCard({ questions }: { questions: any[] }) {
  const machineRef = useRef<any>(null);
  if (!machineRef.current) machineRef.current = createQuizMachine(questions);

  const [snap, setSnap] = useState(() => machineRef.current.snapshot());

  useEffect(() => machineRef.current.subscribe(setSnap), []);

  const { ANSWERING, ANSWERED, COMPLETE } = QUIZ_STATE;
  const isAnswered = snap.status === ANSWERED || snap.status === COMPLETE;

  const optClass = (opt: any) => {
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
        {snap.question.options.map((opt: any) => (
          <button
            key={opt.id}
            className={optClass(opt)}
            disabled={snap.status !== ANSWERING}
            onClick={() => machineRef.current.answer(opt.id)}
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

      {snap.status === ANSWERED && (
        <button className="qz__next" onClick={() => machineRef.current?.next()}>
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

function Bubble({ message, isDarkMode }) {
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
            {parts.map((part, i) => {
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
//  COMPONENT: AIAssistant  ← main export
// ─────────────────────────────────────────────────────────────────

export function AIAssistant({ isDarkMode = false, onClose }) {
  const [messages, setMessages] = useState([{
    id: "welcome",
    role: "assistant",
    content: `Hey there! 👋 I'm your **Human-Centric AI Mentor**.

I break down complex code at any level you need.
• **Level 1** — Explain like I'm 5 (analogies & stories)
• **Level 10** — Expert technical deep dive
• **Any Language** — JS, Python, C++, and more

Paste code or pick a command below! 🚀`,
  }]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [hasMic, setHasMic] = useState(false);
  const [file, setFile] = useState(null);
  const [quizMode, setQuizMode] = useState(false);
  const [lang, setLang] = useState("en-US");

  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const fileRef = useRef(null);
  const recRef = useRef(null);

  // Subscribe to speech state
  useEffect(() => {
    const unsub = speechManager.subscribe(setSpeaking);
    return () => { unsub(); speechManager.stop(); recRef.current?.stop(); };
  }, []);

  // Detect mic support
  useEffect(() => {
    setHasMic(!!(window.SpeechRecognition || window.webkitSpeechRecognition));
  }, []);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // ── File handler ─────────────────────────────────────────────

  function onFileChange(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) { alert("Max file size: 10 MB"); return; }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target.result;
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
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Voice input requires Chrome or Edge."); return; }

    if (listening) { recRef.current?.stop(); setListening(false); return; }

    speechManager.stop();
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = lang;

    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onerror = (e) => { if (e.error !== "no-speech") alert(`Voice error: ${e.error}`); setListening(false); };
    rec.onresult = (e) => {
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
    const userMsg = {
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
      const payload = {
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

  function onKey(e) {
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
        }
        .aia--dark {
          --bg:       #0f172a;
          --fg:       #f8fafc;
          --border:   rgba(255,255,255,0.08);
          --surf:     #1e293b;
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
          padding: 16px 20px;
          border-bottom: 1px solid var(--border);
          background: var(--bg); z-index: 10;
        }
        .aia__id { display: flex; align-items: center; gap: 12px; }
        .aia__av {
          width: 42px; height: 42px; border-radius: 14px;
          background: linear-gradient(135deg, var(--accent), var(--accent2));
          display: flex; align-items: center; justify-content: center;
          color: #fff; font-weight: 800; font-size: 15px;
          box-shadow: 0 4px 12px rgba(37,99,235,0.2);
        }
        .aia__name { font-size: 16px; font-weight: 800; letter-spacing: -0.02em; }
        .aia__name em { color: var(--accent); font-style: normal; }
        .aia__st {
          font-size: 11px; color: var(--muted); margin-top: 2px;
          display: flex; align-items: center; gap: 6px; font-weight: 600;
        }
        .aia__dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: #10b981; box-shadow: 0 0 0 2px rgba(16,185,129,0.2);
        }

        /* ── Actions ─────────────────────────────── */
        .aia__acts { display: flex; gap: 8px; align-items: center; }
        .btn {
          display: flex; align-items: center; gap: 6px;
          padding: 8px 12px; border-radius: 10px;
          border: 1px solid var(--border);
          background: var(--bg); color: var(--fg);
          cursor: pointer; font-size: 12px; font-weight: 700;
          transition: all 0.2s;
        }
        .btn:hover { background: var(--surf); border-color: var(--muted); }
        .btn--on { background: var(--accent); color: #fff; border-color: var(--accent); }
        .btn--close { background: #ef4444; color: #fff; border-color: #ef4444; }

        .ltog { display: flex; border: 1px solid var(--border); border-radius: 10px; overflow: hidden; }
        .ltog__opt {
          padding: 8px 12px; font-size: 11px; font-weight: 800;
          border: none; background: transparent; color: var(--muted);
          cursor: pointer; transition: all 0.2s;
        }
        .ltog__opt--on { background: var(--accent); color: #fff; }

        /* ── Chat ────────────────────────────────── */
        .aia__chat {
          flex: 1; overflow-y: auto; padding: 24px 20px;
          display: flex; flex-direction: column; gap: 20px;
        }
        .aia__chat::-webkit-scrollbar { width: 5px; }
        .aia__chat::-webkit-scrollbar-thumb { background: var(--border); border-radius: 10px; }

        .row { display: flex; gap: 12px; }
        .row--user { flex-direction: row-reverse; }
        .av {
          width: 32px; height: 32px; border-radius: 10px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          font-size: 10px; font-weight: 900;
        }
        .av--user { background: #475569; color: #fff; }
        .av--bot { background: linear-gradient(135deg, var(--accent), var(--accent2)); color: #fff; }

        .bub {
          max-width: 85%; padding: 12px 16px; border-radius: 18px;
          font-size: 14px; line-height: 1.6;
        }
        .bub--user { background: var(--accent); color: #fff; border-bottom-right-radius: 4px; box-shadow: 0 4px 15px rgba(37,99,235,0.15); }
        .bub--light, .bub--dark { background: var(--bub-bg); color: var(--fg); border: 1px solid var(--bub-bd); border-bottom-left-radius: 4px; }

        .bub__text { white-space: pre-wrap; }
        .ic { padding: 2px 6px; background: rgba(0,0,0,0.1); border-radius: 6px; font-family: 'Fira Code', monospace; font-size: 0.9em; color: var(--accent); }

        /* ── Code Blocks ────────────────────────── */
        .cb { border-radius: 12px; overflow: hidden; margin: 12px 0; background: #011627; border: 1px solid rgba(255,255,255,0.1); }
        .cb__bar {
          display: flex; align-items: center; gap: 10px; padding: 10px 16px;
          background: rgba(255,255,255,0.05); border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .cb__dots { display: flex; gap: 6px; flex: 1; }
        .cb__dots span { width: 10px; height: 10px; border-radius: 50%; }
        .cb__dots span:nth-child(1) { background: #ff5f56; }
        .cb__dots span:nth-child(2) { background: #ffbd2e; }
        .cb__dots span:nth-child(3) { background: #27c93f; }
        .cb__lang { font-size: 10px; font-weight: 800; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.1em; }
        .cb__copy { background: transparent; border: 1px solid rgba(255,255,255,0.1); color: #fff; font-size: 10px; padding: 4px 10px; border-radius: 6px; cursor: pointer; }
        .cb__scroll { overflow-x: auto; padding: 12px; font-family: 'Fira Code', monospace; font-size: 13px; line-height: 1.5; }
        .cb__ln { color: rgba(255,255,255,0.2); text-align: right; padding-right: 12px; user-select: none; }
        
        /* ── Quiz ───────────────────────────────── */
        .qz { border-radius: 16px; background: var(--surf); border: 1px solid var(--border); overflow: hidden; margin-top: 10px; }
        .qz__prog-track { height: 4px; background: rgba(0,0,0,0.05); }
        .qz__prog-fill { height: 100%; background: linear-gradient(90deg, var(--accent), var(--accent2)); transition: width 0.3s; }
        .qz__head { padding: 16px 16px 8px; display: flex; align-items: center; justify-content: space-between; }
        .qz__badge { font-size: 10px; font-weight: 800; text-transform: uppercase; color: var(--accent); }
        .qz__q { font-size: 16px; font-weight: 700; padding: 0 16px 16px; }
        .qz__opts { padding: 0 16px 16px; display: flex; flex-direction: column; gap: 8px; }
        .qz__opt {
          width: 100%; text-align: left; padding: 10px 14px; border: 1.5px solid var(--border); border-radius: 14px;
          background: var(--bg); cursor: pointer; font-size: 14px; font-weight: 600; transition: all 0.2s;
          display: flex; align-items: center; gap: 14px;
        }
        .qz__opt:hover:not(:disabled) { border-color: var(--accent); background: rgba(37,99,235,0.04); }
        .qz__opt-label {
          width: 32px; height: 32px; border-radius: 10px; background: var(--surf);
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 900; color: var(--muted); border: 1px solid var(--border); flex-shrink: 0;
          transition: all 0.2s;
        }
        .qz__opt--ok { border-color: #10b981; background: rgba(16,185,129,0.06); color: #10b981; }
        .qz__opt--ok .qz__opt-label { background: #10b981; color: #fff; border-color: #10b981; }
        .qz__opt--bad { border-color: #ef4444; background: rgba(239,68,68,0.06); color: #ef4444; }
        .qz__opt--bad .qz__opt-label { background: #ef4444; color: #fff; border-color: #ef4444; }
        .qz__opt--dim { opacity: 0.45; filter: grayscale(1); }
        
        .qz__explain { padding: 16px; background: rgba(0,0,0,0.03); font-size: 14px; font-style: italic; border-top: 1px solid var(--border); color: var(--muted); line-height: 1.6; }
        .qz__next { width: calc(100% - 32px); margin: 0 16px 16px; padding: 12px; border: none; border-radius: 12px; background: var(--accent); color: #fff; font-weight: 800; cursor: pointer; }

        /* ── Typing ──────────────────────────────── */
        .typing { display: flex; gap: 4px; padding: 12px 16px; background: var(--surf); border-radius: 16px; width: fit-content; }
        .typing span { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); animation: bounce 1s infinite; }
        .typing span:nth-child(2) { animation-delay: 0.2s; }
        .typing span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes bounce { 0%, 100% { transform: scale(1); opacity: 0.4; } 50% { transform: scale(1.4); opacity: 1; } }

        /* ── Footer / Input ──────────────────────── */
        .aia__ft { padding: 16px 20px; border-top: 1px solid var(--border); background: var(--bg); }
        .chips { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 12px; scrollbar-width: none; }
        .chips::-webkit-scrollbar { display: none; }
        .chip { padding: 6px 14px; border-radius: 20px; border: 1px solid var(--border); background: var(--surf); font-size: 12px; font-weight: 700; cursor: pointer; white-space: nowrap; transition: all 0.2s; }
        .chip:hover { border-color: var(--accent); color: var(--accent); }

        .irow { display: flex; gap: 12px; align-items: flex-end; }
        .ibox {
          flex: 1; display: flex; align-items: center; gap: 8px; padding: 10px 16px;
          background: var(--surf); border: 1px solid var(--border); border-radius: 24px; transition: all 0.2s;
        }
        .ibox:focus-within { border-color: var(--accent); background: var(--bg); box-shadow: 0 0 0 4px rgba(37,99,235,0.1); }
        
        .ifield { flex: 1; border: none; background: transparent; outline: none; font-size: 15px; color: var(--fg); min-height: 24px; }
        .ibtn { width: 32px; height: 32px; border-radius: 50%; border: none; background: transparent; cursor: pointer; font-size: 18px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
        .ibtn:hover { background: rgba(0,0,0,0.05); color: var(--accent); }
        .ibtn--rec { color: #ef4444; animation: pulse 1s infinite; }

        .send {
          width: 44px; height: 44px; border-radius: 50%; border: none;
          background: var(--accent); color: #fff; cursor: pointer; font-size: 20px;
          display: flex; align-items: center; justify-content: center; transition: all 0.2s;
        }
        .send:hover:not(:disabled) { transform: scale(1.05); box-shadow: 0 4px 12px rgba(37,99,235,0.3); }
        .send:disabled { background: var(--border); opacity: 0.5; cursor: not-allowed; }

        .aia__cap { margin-top: 12px; text-align: center; font-size: 10px; font-weight: 800; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; opacity: 0.6; }

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
