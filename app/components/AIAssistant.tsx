"use client";

import { useState, useEffect, useRef, useCallback } from "react";

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
      utt.onend = () => resolve();
      utt.onerror = () => resolve();
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
//  MODULE: highlighter
//  Lightweight JS/TS syntax colorizer — stateless, pure.
// ─────────────────────────────────────────────────────────────────

const highlighter = (() => {
  const JS_LANGS = new Set(["js", "javascript", "ts", "typescript", "jsx", "tsx"]);

  const esc = (s) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

  return {
    colorize(raw, lang) {
      const code = esc(raw);
      if (!JS_LANGS.has(lang)) return code;

      return code
        .replace(/(\/\/[^\n]*)/g, '<span class="hl-comment">$1</span>')
        .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="hl-comment">$1</span>')
        .replace(/(&quot;[^&]*?&quot;|&#39;[^&]*?&#39;|`[^`]*`)/g, '<span class="hl-string">$1</span>')
        .replace(/\b(const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|class|new|this|typeof|instanceof|async|await|try|catch|finally|throw|import|export|default|from|of|in|extends|super|null|undefined|true|false)\b/g, '<span class="hl-keyword">$1</span>')
        .replace(/\b(-?\d+\.?\d*)\b/g, '<span class="hl-number">$1</span>')
        .replace(/\b([A-Za-z_$][A-Za-z0-9_$]*)(?=\s*\()/g, '<span class="hl-fn">$1</span>');
    },
  };
})();

// ─────────────────────────────────────────────────────────────────
//  MODULE: quizMachine
//  Factory for quiz state — ANSWERING → ANSWERED → COMPLETE
// ─────────────────────────────────────────────────────────────────

const QUIZ_STATE = Object.freeze({ ANSWERING: "ANSWERING", ANSWERED: "ANSWERED", COMPLETE: "COMPLETE" });

function createQuizMachine(questions: any[]) {
  let status = QUIZ_STATE.ANSWERING;
  let idx = 0;
  let score = 0;
  let chosen = null;
  const subs = new Set<(snapshot: any) => void>();

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
    subscribe: (fn: (snapshot: any) => void) => { subs.add(fn); return () => subs.delete(fn); },
    snapshot: snap,

    answer(optionId: any) {
      if (status !== QUIZ_STATE.ANSWERING) return;
      const opt = questions[idx].options.find((o: any) => o.id === optionId);
      if (!opt) return;
      chosen = optionId;
      if (opt.isCorrect) score++;
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
  parse(text) {
    const parts = [];
    const quizRx = /\[\[QUIZ:START\]\]([\s\S]*?)\[\[QUIZ:END\]\]/g;
    let lastIdx = 0;
    let m;

    // Extract quiz blocks first
    while ((m = quizRx.exec(text)) !== null) {
      if (m.index > lastIdx) parts.push({ type: "text", content: text.slice(lastIdx, m.index) });
      try {
        const qs = JSON.parse(m[1]);
        if (Array.isArray(qs) && qs.length) parts.push({ type: "quiz", questions: qs });
      } catch {
        parts.push({ type: "text", content: m[0] });
      }
      lastIdx = m.index + m[0].length;
    }

    // Then parse remaining text for code fences
    const rest = text.slice(lastIdx);
    const codeRx = /```(\w*)\n?([\s\S]*?)```/g;
    let cursor = 0;

    while ((m = codeRx.exec(rest)) !== null) {
      if (m.index > cursor) parts.push({ type: "text", content: rest.slice(cursor, m.index) });
      parts.push({ type: "code", lang: m[1] || "javascript", content: m[2].trim() });
      cursor = m.index + m[0].length;
    }

    if (cursor < rest.length) parts.push({ type: "text", content: rest.slice(cursor) });
    return parts;
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
                  <pre><code dangerouslySetInnerHTML={{ __html: line ? highlighter.colorize(line, lang) : "<br/>" }} /></pre>
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

function QuizCard({ questions }) {
  const machineRef = useRef(null);
  if (!machineRef.current) machineRef.current = createQuizMachine(questions);

  const [snap, setSnap] = useState(() => machineRef.current.snapshot());

  useEffect(() => machineRef.current.subscribe(setSnap), []);

  const { ANSWERING, ANSWERED, COMPLETE } = QUIZ_STATE;
  const isAnswered = snap.status === ANSWERED || snap.status === COMPLETE;

  const optClass = (opt: any) => {
    const base = "qz__opt";
    if (snap.status === ANSWERING) return base;
    if (opt.isCorrect) return `${base} qz__opt--ok`;
    if (snap.chosen === opt.id && !opt.isCorrect) return `${base} qz__opt--bad`;
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
            onClick={() => machineRef.current?.answer(opt.id)}
          >
            <span className="qz__opt-dot" />
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
          font-family: 'Söhne', 'DM Sans', ui-sans-serif, system-ui, sans-serif;
          background: var(--bg); color: var(--fg);
        }
        .aia--dark {
          --bg:       #0c0f18;
          --fg:       #dde3f0;
          --border:   #1d2535;
          --surf:     #141824;
          --muted:    #6b7fa8;
          --bub-bg:   #1d2535;
          --bub-bd:   #273047;
          --accent:   #0052FF;
          --accent2:  #3B82F6;
        }
        .aia:not(.aia--dark) {
          --bg:       #fafbff;
          --fg:       #0f172a;
          --border:   #e4e8f2;
          --surf:     #f1f4fc;
          --muted:    #7280a0;
          --bub-bg:   #f1f4fc;
          --bub-bd:   #e4e8f2;
          --accent:   #0052FF;
          --accent2:  #0041CC;
        }

        /* ── Header ──────────────────────────────── */
        .aia__hd {
          display: flex; align-items: center; justify-content: space-between;
          padding: 13px 18px;
          border-bottom: 1px solid var(--border);
          flex-shrink: 0;
          background: var(--bg);
        }
        .aia__id { display: flex; align-items: center; gap: 11px; }
        .aia__av {
          width: 40px; height: 40px; border-radius: 12px;
          background: linear-gradient(135deg, var(--accent), var(--accent2));
          display: flex; align-items: center; justify-content: center;
          color: #fff; font-weight: 800; font-size: 14px; letter-spacing: -0.5px;
        }
        .aia__name { font-size: 15px; font-weight: 700; letter-spacing: -0.3px; }
        .aia__name em { color: var(--accent); font-style: normal; }
        .aia__st {
          font-size: 11px; color: var(--muted); margin-top: 1px;
          display: flex; align-items: center; gap: 5px;
        }
        .aia__dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 0 2px rgba(34,197,94,0.25);
        }
        .aia__acts { display: flex; gap: 6px; align-items: center; }

        /* ── Buttons ──────────────────────────────── */
        .btn {
          display: flex; align-items: center; gap: 5px;
          padding: 7px 11px; border-radius: 9px;
          border: 1px solid var(--border);
          background: transparent; color: var(--fg);
          cursor: pointer; font-size: 11px; font-weight: 700;
          transition: background 0.12s, color 0.12s, border-color 0.12s;
        }
        .btn:hover { background: var(--surf); }
        .btn--on { background: var(--accent); color: #fff; border-color: var(--accent); }
        .btn--close { background: var(--accent); color: #fff; border-color: var(--accent); }
        .btn--close:hover { opacity: 0.9; }

        /* ── Lang toggle ─────────────────────────── */
        .ltog {
          display: flex; border: 1px solid var(--border); border-radius: 9px; overflow: hidden;
        }
        .ltog__opt {
          padding: 6px 10px; font-size: 11px; font-weight: 700;
          border: none; background: transparent; color: var(--muted);
          cursor: pointer; transition: background 0.12s, color 0.12s;
        }
        .ltog__opt--on { background: var(--accent); color: #fff; }

        /* ── Chat area ──────────────────────────── */
        .aia__chat {
          flex: 1; overflow-y: auto;
          padding: 22px 16px; display: flex; flex-direction: column;
          gap: 18px; scroll-behavior: smooth;
        }
        .aia__chat::-webkit-scrollbar { width: 4px; }
        .aia__chat::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }

        /* ── Message rows ────────────────────────── */
        .row { display: flex; align-items: flex-start; gap: 10px; }
        .row--user { flex-direction: row-reverse; }

        .av {
          width: 32px; height: 32px; border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          font-size: 10px; font-weight: 900; flex-shrink: 0;
        }
        .av--user { background: #374151; color: #fff; }
        .av--bot  { background: linear-gradient(135deg, var(--accent), var(--accent2)); color: #fff; }

        .bub {
          max-width: 80%; padding: 10px 14px;
          border-radius: 16px; font-size: 13px; line-height: 1.6;
        }
        .bub--user  { background: var(--accent); color: #fff; border-bottom-right-radius: 4px; }
        .bub--light { background: var(--bub-bg); color: var(--fg); border-bottom-left-radius: 4px; border: 1px solid var(--bub-bd); }
        .bub--dark  { background: var(--bub-bg); color: var(--fg); border-bottom-left-radius: 4px; border: 1px solid var(--bub-bd); }

        .bub__text { white-space: pre-wrap; }
        .bub__body { display: flex; flex-direction: column; gap: 8px; }

        .bub__file {
          display: flex; align-items: center; gap: 9px;
          background: rgba(0,0,0,0.08); border-radius: 9px;
          padding: 7px 10px; margin-bottom: 8px;
        }
        .bub__img   { width: 34px; height: 34px; border-radius: 6px; object-fit: cover; }
        .bub__file-icon { font-size: 22px; }
        .bub__fname { font-size: 12px; font-weight: 600; }
        .bub__fmeta { font-size: 10px; opacity: 0.5; text-transform: uppercase; letter-spacing: 0.05em; }

        /* ── Inline code ────────────────────────── */
        .ic {
          padding: 2px 5px; background: #1a1e2e; color: #a78bfa;
          border-radius: 4px; font-family: 'Fira Code', monospace; font-size: 12px;
        }

        /* ── Code block ─────────────────────────── */
        .cb { border-radius: 12px; overflow: hidden; border: 1px solid #21262d; background: #0d1117; margin: 6px 0; }
        .cb__bar {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 13px; background: #161b22;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .cb__dots { display: flex; gap: 5px; }
        .cb__dots span { width: 10px; height: 10px; border-radius: 50%; }
        .cb__dots span:nth-child(1) { background: #f87171; }
        .cb__dots span:nth-child(2) { background: #fbbf24; }
        .cb__dots span:nth-child(3) { background: #34d399; }
        .cb__lang {
          font-size: 10px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.1em; color: #4b5563; flex: 1;
        }
        .cb__copy {
          background: transparent; border: none; cursor: pointer;
          font-size: 11px; font-weight: 700; color: #4b5563;
          padding: 3px 9px; border-radius: 5px; transition: all 0.12s;
        }
        .cb__copy:hover { background: rgba(255,255,255,0.06); color: #e2e8f0; }
        .cb__scroll { overflow-x: auto; }
        .cb__scroll table { border-collapse: collapse; width: 100%; }
        .cb__ln {
          text-align: right; padding: 1px 10px;
          color: #374151; font-size: 12px; font-family: monospace;
          border-right: 1px solid rgba(255,255,255,0.04);
          user-select: none; width: 40px;
        }
        .cb__line { padding: 1px 13px; }
        .cb__line pre { margin: 0; }
        .cb__line code { font-family: 'Fira Code', monospace; font-size: 13px; line-height: 1.65; }

        .hl-keyword { color: #c792ea; font-weight: 600; }
        .hl-string  { color: #c3e88d; }
        .hl-number  { color: #f78c6c; }
        .hl-comment { color: #4a5568; font-style: italic; }
        .hl-fn      { color: #82aaff; }

        /* ── Quiz ───────────────────────────────── */
        .qz {
          border: 1px solid rgba(91,99,245,0.2);
          background: rgba(91,99,245,0.03);
          border-radius: 16px; padding: 0;
          overflow: hidden;
        }
        .qz__prog-track { height: 3px; background: rgba(91,99,245,0.12); }
        .qz__prog-fill  { height: 100%; background: linear-gradient(90deg, var(--accent), var(--accent2)); transition: width 0.4s ease; }

        .qz__head {
          display: flex; align-items: center; gap: 8px;
          padding: 14px 16px 0;
        }
        .qz__badge {
          font-size: 9px; font-weight: 900; text-transform: uppercase;
          letter-spacing: 0.18em; color: var(--accent);
          background: rgba(91,99,245,0.1);
          padding: 3px 8px; border-radius: 5px;
        }
        .qz__counter { font-size: 12px; font-weight: 700; flex: 1; color: var(--muted); }
        .qz__score   { font-size: 11px; font-weight: 700; color: var(--fg); }

        .qz__q {
          font-size: 14px; font-weight: 700; line-height: 1.5;
          padding: 12px 16px 8px;
        }
        .qz__opts { display: flex; flex-direction: column; gap: 7px; padding: 0 16px; }

        .qz__opt {
          width: 100%; text-align: left;
          padding: 11px 14px;
          border: 1.5px solid var(--border);
          border-radius: 11px;
          background: transparent; color: var(--fg);
          font-size: 13px; font-weight: 600;
          cursor: pointer; display: flex; align-items: center; gap: 10px;
          transition: border-color 0.15s, background 0.15s, transform 0.1s, opacity 0.15s;
        }
        .qz__opt-dot {
          width: 14px; height: 14px; border-radius: 50%;
          border: 2px solid var(--border); flex-shrink: 0;
          transition: border-color 0.15s, background 0.15s;
        }
        .qz__opt:hover:not(:disabled) { border-color: var(--accent); background: rgba(91,99,245,0.05); transform: translateX(3px); }
        .qz__opt:hover:not(:disabled) .qz__opt-dot { border-color: var(--accent); }

        .qz__opt--ok  { border-color: #10b981 !important; background: rgba(16,185,129,0.05) !important; color: #10b981 !important; }
        .qz__opt--ok  .qz__opt-dot { border-color: #10b981; background: #10b981; }
        .qz__opt--bad { border-color: #ef4444 !important; background: rgba(239,68,68,0.05) !important; color: #ef4444 !important; }
        .qz__opt--bad .qz__opt-dot { border-color: #ef4444; background: #ef4444; }
        .qz__opt--dim { opacity: 0.3; }
        .qz__opt:disabled { cursor: default; }

        .qz__explain {
          margin: 10px 16px 0;
          padding: 11px 13px;
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--border);
          border-radius: 11px;
          font-size: 12px; line-height: 1.65; font-style: italic;
        }
        .qz__explain-tag {
          display: block; font-size: 9px; font-weight: 900;
          text-transform: uppercase; letter-spacing: 0.15em;
          font-style: normal; margin-bottom: 4px; color: var(--accent);
        }
        .qz__next {
          display: block; width: calc(100% - 32px); margin: 12px 16px;
          padding: 11px; border: none; border-radius: 11px;
          background: linear-gradient(135deg, var(--accent), var(--accent2));
          color: #fff; font-size: 13px; font-weight: 700;
          cursor: pointer; transition: opacity 0.12s;
        }
        .qz__next:hover { opacity: 0.88; }

        .qz__done {
          display: flex; align-items: center; gap: 12px;
          margin: 12px 16px 16px;
          padding: 12px 14px;
          background: rgba(16,185,129,0.07);
          border: 1px solid rgba(16,185,129,0.2);
          border-radius: 11px;
        }
        .qz__done-icon   { font-size: 28px; }
        .qz__done-title  { font-size: 13px; font-weight: 800; color: #10b981; }
        .qz__done-sub    { font-size: 12px; color: var(--muted); margin-top: 2px; }

        /* ── Typing dots ─────────────────────────── */
        .typing {
          display: flex; gap: 4px; padding: 14px 16px;
          background: var(--bub-bg); border: 1px solid var(--bub-bd);
          border-radius: 16px; border-bottom-left-radius: 4px;
        }
        .typing span {
          width: 7px; height: 7px; border-radius: 50%;
          background: var(--accent);
          animation: bounce 0.8s ease-in-out infinite;
        }
        .typing span:nth-child(2) { animation-delay: 0.16s; }
        .typing span:nth-child(3) { animation-delay: 0.32s; }
        @keyframes bounce { 0%,100%{transform:scale(1);opacity:0.4} 50%{transform:scale(1.5);opacity:1} }

        /* ── Input area ─────────────────────────── */
        .aia__ft {
          padding: 12px 15px;
          border-top: 1px solid var(--border);
          background: var(--surf);
          flex-shrink: 0;
        }

        /* Chips */
        .chips {
          display: flex; gap: 7px; overflow-x: auto;
          padding-bottom: 10px; scrollbar-width: none;
        }
        .chips::-webkit-scrollbar { display: none; }
        .chip {
          white-space: nowrap; padding: 5px 11px;
          font-size: 11px; font-weight: 700;
          border: 1px solid var(--border);
          border-radius: 7px; background: var(--bg); color: var(--muted);
          cursor: pointer; transition: color 0.12s, border-color 0.12s;
        }
        .chip:hover { color: var(--accent); border-color: rgba(91,99,245,0.35); }

        /* File preview */
        .fprev {
          display: flex; align-items: center; gap: 9px;
          padding: 7px 11px; margin-bottom: 9px;
          background: rgba(91,99,245,0.06);
          border: 1px solid rgba(91,99,245,0.18);
          border-radius: 11px; width: fit-content; max-width: 100%;
        }
        .fprev__name  { font-size: 12px; font-weight: 600; }
        .fprev__tag   { font-size: 10px; color: var(--accent); font-weight: 700; text-transform: uppercase; }
        .fprev__rm {
          background: transparent; border: none; cursor: pointer;
          color: var(--muted); font-size: 15px; padding: 0 3px; margin-left: 3px;
        }
        .fprev__rm:hover { color: #ef4444; }

        /* Input row */
        .irow { display: flex; gap: 7px; align-items: center; }
        .ibox {
          flex: 1; display: flex; align-items: center; gap: 3px;
          border: 1.5px solid var(--border); border-radius: 24px;
          background: var(--bg); padding: 5px 9px;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .ibox:focus-within { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(91,99,245,0.1); }

        .ibtn {
          width: 30px; height: 30px; border-radius: 7px;
          border: none; background: transparent; color: var(--muted);
          cursor: pointer; font-size: 15px;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.12s, color 0.12s; flex-shrink: 0;
        }
        .ibtn:hover { background: rgba(91,99,245,0.08); color: var(--accent); }
        .ibtn--rec { background: #ef4444; color: #fff; animation: pulse 1s infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.65} }

        .ifield {
          flex: 1; border: none; background: transparent;
          outline: none; font-size: 13px; color: var(--fg);
          padding: 5px 4px;
        }
        .ifield::placeholder { color: var(--muted); }

        .send {
          width: 42px; height: 42px; border-radius: 13px;
          border: none; cursor: pointer; font-size: 17px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; transition: opacity 0.12s, transform 0.1s;
        }
        .send--on  { background: linear-gradient(135deg, var(--accent), var(--accent2)); color: #fff; }
        .send--on:hover  { opacity: 0.9; transform: scale(1.04); }
        .send--on:active { transform: scale(0.95); }
        .send--off { background: var(--surf); color: var(--muted); cursor: not-allowed; }

        .aia__cap {
          display: flex; justify-content: center; gap: 14px; margin-top: 9px;
        }
        .cap-item {
          font-size: 10px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.08em; color: var(--muted); opacity: 0.45;
        }
      `}</style>

      <div className={`aia${isDarkMode ? " aia--dark" : ""}`}>

        {/* ── Header ──────────────────────────────────────── */}
        <header className="aia__hd">
          <div className="aia__id">
            <div className="aia__av">AI</div>
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
