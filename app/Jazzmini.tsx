"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  onSnapshot,
  Firestore,
  collection,
  query,
  orderBy,
  limit,
  getDocs
} from 'firebase/firestore';
import { CheckCircle, XCircle, RefreshCw, Trophy, BookOpen, Lock, Unlock, Zap, AlertCircle, Wallet, Sun, Moon, ArrowRight, Award, Timer, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { QUIZ_DATA } from './quizData';

// Type definitions for Ethereum provider
interface EthereumProvider {
  isMetaMask?: boolean;
  isCoinbaseBrowser?: boolean;
  isBase?: boolean;
  request: (args: { method: string; params?: any[] | Record<string, any> }) => Promise<any>;
}

// Farcaster SDK import with fallback
let sdk: any = null;
try {
  const farcasterSdk = require('@farcaster/miniapp-sdk');
  sdk = farcasterSdk.sdk;
} catch (e) {
  console.warn('Farcaster SDK not available, using web3 provider fallback');
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
};

const appId = 'js-level-quiz-default';
const PUBLIC_COLLECTION_PATH = `artifacts/${appId}/stats`;
const GLOBAL_STATS_DOC_ID = 'global_progress';
const QUESTIONS_PER_LEVEL = 10;
const TOTAL_LEVELS = 10;
const PASS_THRESHOLD = 7;

// ✅ Contract address and ABI (validated)
const QUIZ_CONTRACT_ADDRESS = '0x2315d55F06E19D21Ebda68Aa1E54F9aF6924dcE5';
// AI NOTE: Updating ABI to support score saving on blockchain
const QUIZ_CONTRACT_ABI = [{
  "inputs": [
    { "internalType": "uint256", "name": "level", "type": "uint256" },
    { "internalType": "uint256", "name": "score", "type": "uint256" }
  ],
  "name": "completeLevel",
  "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
  "stateMutability": "nonpayable",
  "type": "function"
}];

// ✅ Security: Validate contract address format
const isValidAddress = (address: string): boolean => {
  return /^0x[0-9a-fA-F]{40}$/.test(address);
};

// ✅ Get wallet provider — Farcaster SDK first, then window.ethereum
const getWalletProvider = (): EthereumProvider | null => {
  if (typeof window === 'undefined') return null;

  // 🥇 Priority 1: Farcaster / Base App SDK provider
  try {
    if (sdk && sdk.wallet && sdk.wallet.ethProvider) {
      const sdkProvider = sdk.wallet.ethProvider;
      if (typeof sdkProvider.request === 'function') {
        return sdkProvider as EthereumProvider;
      }
    }
  } catch (e) { /* not in Farcaster */ }

  // 🥈 Priority 2: window.ethereum (MetaMask, Coinbase, etc.)
  let ethereum = (window as any).ethereum;
  if (!ethereum && (window as any).MetaMask) {
    ethereum = (window as any).MetaMask;
  }
  if (!ethereum) return null;
  if (typeof ethereum.request !== 'function') return null;

  return ethereum;
};

// ✅ Security: Detect which wallets are available
const getAvailableWallets = (): string[] => {
  if (typeof window === 'undefined') return [];
  const ethereum = (window as any).ethereum;
  if (!ethereum) return [];

  const wallets: string[] = [];
  if (ethereum.isMetaMask) wallets.push('MetaMask');
  if (ethereum.isCoinbaseBrowser) wallets.push('Coinbase Wallet');
  if (ethereum.isBase) wallets.push('Base App');

  // Default to MetaMask-compatible if no specific identification
  if (wallets.length === 0 && typeof ethereum.request === 'function') {
    wallets.push('Browser Wallet');
  }

  return wallets;
};

// ✅ Security: Safely encode function calls (replaces manual hex encoding)
const encodeFunctionCall = (functionSignature: string, params: any[]): string => {
  if (functionSignature !== 'completeLevel') {
    throw new Error('Unsupported function');
  }

  if (!Array.isArray(params) || params.length !== 2) {
    throw new Error('Invalid parameters: expected level and score');
  }

  const [level, score] = params;
  if (typeof level !== 'number' || level < 1 || level > TOTAL_LEVELS) {
    throw new Error(`Invalid level: must be between 1 and ${TOTAL_LEVELS}`);
  }
  if (typeof score !== 'number' || score < 0 || score > QUESTIONS_PER_LEVEL) {
    throw new Error(`Invalid score: must be between 0 and ${QUESTIONS_PER_LEVEL}`);
  }

  // Selector for completeLevel(uint256,uint256) = 0x7166164f
  // (Encoded: Selector + Level (32 bytes) + Score (32 bytes))
  return '0x7166164f' +
    level.toString(16).padStart(64, '0') +
    score.toString(16).padStart(64, '0');
};

// Official Base Blue Color Constant
const BASE_BLUE = '#0052FF';

const JS_QUOTES = [
  "Any application that can be written in JavaScript, will eventually be written in JavaScript. — Atwood's Law",
  "JavaScript is the duct tape of the Internet. — Charlie Campbell",
  "Code is read much more often than it is written. — Guido van Rossum",
  "It's not a bug. It's an undocumented feature!",
  "Always code as if the guy who ends up maintaining your code will be a violent psychopath who knows where you live.",
  "First, solve the problem. Then, write the code. — John Johnson",
  "Make it work, make it right, make it fast. — Kent Beck",
  "In theory, there is no difference between theory and practice. But, in practice, there is."
];

type QuizQuestion = {
  level: number;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
};

type GlobalStats = {
  maxScore: number;
  highestLevel: number;
};

const LEVEL_TOPICS = [
  'JS Basics', 'Functions', 'Objects & Prototypes', 'Arrays & HOF',
  'Async & Promises', 'DOM & Events', 'Error Handling', 'Classes & OOP',
  'Advanced Concepts', 'Expert Topics'
];

const LEVEL_ICONS = ['🟡', '🔧', '📦', '🗂️', '⏳', '🖥️', '🛡️', '🏛️', '🧠', '🚀'];

const LEARNING_CONTENT: Record<number, { title: string; points: string[]; code: string }[]> = {
  1: [
    {
      title: 'var vs let vs const',
      points: ['`var` is function-scoped and gets hoisted to top', '`let` is block-scoped — use it when value changes', '`const` is block-scoped — use it when value is fixed', '✅ Rule: Always prefer `const`, use `let` only when needed'],
      code: 'var x = 1;      // hoisted, function-scoped\nlet y = 2;      // block-scoped, reassignable\nconst z = 3;    // block-scoped, fixed\n\n// z = 4; ❌ Error! Cannot reassign const'
    },
    {
      title: 'Type Coercion & Equality',
      points: ['`==` converts types before comparing (loose)', '`===` checks both value AND type (strict)', '`2 + "2"` gives `"22"` — JS converts number to string', '✅ Always use `===` to avoid sneaky bugs'],
      code: '2 == "2"   // ✅ true  (coercion happens)\n2 === "2"  // ❌ false (different types)\n\n2 + "2"   // "22" (string concat)\n2 - "2"   // 0    (math operation)'
    },
    {
      title: 'Arrays — The Basics',
      points: ['`push()` adds to end, `pop()` removes from end', '`shift()` removes from start, `unshift()` adds to start', '`typeof []` returns `"object"` — surprising but true!', '✅ Use `Array.isArray(x)` to reliably check for arrays'],
      code: 'const arr = [1, 2, 3];\narr.push(4);        // [1, 2, 3, 4]\narr.pop();          // [1, 2, 3]\narr.unshift(0);     // [0, 1, 2, 3]\n\nArray.isArray(arr); // true ✅'
    },
  ],
  2: [
    {
      title: 'Function Types',
      points: ['Function declarations are hoisted — usable before defined', 'Function expressions are NOT hoisted', 'Arrow functions inherit `this` from surrounding code', '✅ Use arrow functions for callbacks, declarations for main logic'],
      code: '// Declaration (hoisted) ✅\nfunction greet() { return "Hi"; }\n\n// Expression (NOT hoisted)\nconst greet2 = function() { return "Hi"; };\n\n// Arrow function\nconst greet3 = () => "Hi";'
    },
    {
      title: 'Closures',
      points: ['A closure is when inner function "remembers" outer variables', 'Every function creates a new closure when called', 'Great for keeping data private (encapsulation)', '✅ Counter pattern is the classic closure example'],
      code: 'function makeCounter() {\n  let count = 0; // private!\n  return () => ++count;\n}\n\nconst counter = makeCounter();\ncounter(); // 1\ncounter(); // 2\ncounter(); // 3'
    },
    {
      title: 'Spread & Destructuring',
      points: ['Spread `...` expands array/object into individual items', 'Destructuring lets you extract values cleanly', 'You can set default values in destructuring', '✅ Use spread to copy arrays/objects without mutating'],
      code: 'const [a, b, ...rest] = [1, 2, 3, 4];\n// a=1, b=2, rest=[3,4]\n\nconst { name, age = 25 } = { name: "Ali" };\n// name="Ali", age=25 (default)\n\nconst copy = [...arr]; // safe copy'
    },
  ],
  3: [
    {
      title: 'Objects',
      points: ['Objects store related data as key-value pairs', '`Object.keys()` returns array of keys', '`Object.assign()` merges objects without mutation', '✅ Use spread `{...obj}` for clean shallow copies'],
      code: 'const user = { name: "Ali", age: 22 };\n\nObject.keys(user);     // ["name", "age"]\nObject.values(user);   // ["Ali", 22]\n\nconst updated = { ...user, age: 23 }; // copy + update'
    },
    {
      title: 'Prototypes & Inheritance',
      points: ['Every JS object has a hidden `__proto__` link', 'Prototypes form a chain — this is how inheritance works', '`Object.create(proto)` sets the prototype explicitly', '✅ ES6 classes use prototypes under the hood — same thing!'],
      code: 'const animal = { speak() { return "..." } };\nconst dog = Object.create(animal);\ndog.breed = "Husky";\n\ndog.speak(); // works! (from prototype)\ndog.hasOwnProperty("breed"); // true'
    },
    {
      title: 'null vs undefined',
      points: ['`undefined` — variable declared but never given a value', '`null` — intentionally set to "nothing"', '`typeof null` is `"object"` — a famous JS bug from 1995!', '✅ Use `value == null` to check for both at once'],
      code: 'let a;           // undefined (not set)\nlet b = null;    // null (intentional)\n\ntypeof undefined // "undefined"\ntypeof null      // "object" (JS bug!)\n\na == null  // true (catches both)'
    },
  ],
  4: [
    {
      title: 'Array Higher-Order Methods',
      points: ['`map()` — transform every item, returns new array', '`filter()` — keep only items that pass the test', '`reduce()` — collapse array into one value', '✅ These never modify the original array — safe to use!'],
      code: 'const nums = [1, 2, 3, 4, 5];\n\nnums.map(x => x * 2);      // [2,4,6,8,10]\nnums.filter(x => x > 2);   // [3,4,5]\nnums.reduce((a, b) => a + b, 0); // 15'
    },
    {
      title: 'Chaining Methods',
      points: ['Array methods return new arrays — so you can chain them!', 'Chain multiple operations in one readable line', '`slice()` is safe (no mutation), `splice()` mutates', '✅ Chain pattern: filter first, then map for best performance'],
      code: 'const data = [1, 2, 3, 4, 5, 6];\n\ndata\n  .filter(x => x % 2 === 0) // [2, 4, 6]\n  .map(x => x * 10)          // [20, 40, 60]\n  .slice(0, 2);              // [20, 40]'
    },
    {
      title: 'Immutability Patterns',
      points: ['Always copy before modifying to avoid side effects', 'Use spread `[...arr]` to copy arrays', 'Use spread `{...obj}` to copy objects', '✅ Sort a copy: `[...arr].sort()` not `arr.sort()`!'],
      code: 'const original = [3, 1, 2];\n\n// ❌ BAD: mutates original\noriginal.sort();\n\n// ✅ GOOD: sort a copy\nconst sorted = [...original].sort();\nconsole.log(original); // unchanged!'
    },
  ],
  5: [
    {
      title: 'Promises',
      points: ['A Promise represents a future value — pending/fulfilled/rejected', '`.then()` for success, `.catch()` for errors', '`.finally()` always runs regardless of outcome', '✅ `Promise.all([...])` runs multiple promises in parallel'],
      code: 'fetch("https://api.com/data")\n  .then(res => res.json())   // success\n  .then(data => console.log(data))\n  .catch(err => console.error(err)) // error\n  .finally(() => console.log("Done!"))'
    },
    {
      title: 'Async / Await',
      points: ['`async` before a function makes it return a Promise', '`await` pauses until the Promise resolves', 'Use `try/catch` to handle errors with async/await', '✅ Much cleaner than chaining `.then().then().then()`'],
      code: 'async function loadUser() {\n  try {\n    const res = await fetch("/api/user");\n    const user = await res.json();\n    return user;\n  } catch (err) {\n    console.error("Failed:", err);\n  }\n}'
    },
    {
      title: 'The Event Loop',
      points: ['JS is single-threaded — one thing at a time', 'Call Stack runs your synchronous code', 'Promises go to Microtask Queue (runs first)', '✅ setTimeout goes to Macrotask Queue (runs last)'],
      code: 'console.log("1");           // runs first\n\nsetTimeout(() => {\n  console.log("3");          // runs last\n}, 0);\n\nPromise.resolve().then(() => {\n  console.log("2");          // runs second\n});\n// Output: 1, 2, 3'
    },
  ],
  6: [
    {
      title: 'DOM Selection',
      points: ['`getElementById()` — fastest, for unique elements', '`querySelector()` — CSS selector syntax, first match only', '`querySelectorAll()` — returns all matches as NodeList', '✅ Use `querySelector` for modern, flexible selection'],
      code: 'document.getElementById("btn");\ndocument.querySelector(".card");      // first match\ndocument.querySelectorAll("li");      // all <li>\n\n// Convert NodeList to Array\n[...document.querySelectorAll("li")]'
    },
    {
      title: 'Events & Listeners',
      points: ['`addEventListener()` attaches handler without overwriting others', 'Events bubble up: child → parent → document', 'Use `event.stopPropagation()` to stop bubbling', '✅ Remove listeners when not needed to prevent memory leaks'],
      code: 'const btn = document.querySelector("#btn");\n\nbtn.addEventListener("click", (e) => {\n  console.log("Clicked!", e.target);\n  e.stopPropagation(); // stop bubbling\n});'
    },
    {
      title: 'Web Storage',
      points: ['`localStorage` — persists even after browser closes', '`sessionStorage` — cleared when tab/browser closes', 'Both only store strings — JSON needed for objects', '✅ Never store passwords or tokens in localStorage!'],
      code: '// Save data\nlocalStorage.setItem("user", JSON.stringify({ name: "Ali" }));\n\n// Read data\nconst user = JSON.parse(localStorage.getItem("user"));\n\n// Remove\nlocalStorage.removeItem("user");'
    },
  ],
  7: [
    {
      title: 'Error Handling',
      points: ['`try/catch` catches runtime errors gracefully', '`finally` block always runs — perfect for cleanup', 'Throw custom errors with `throw new Error("message")`', '✅ Error types: TypeError, RangeError, ReferenceError'],
      code: 'try {\n  const data = JSON.parse("invalid json");\n} catch (err) {\n  console.error(err.message); // logs error\n} finally {\n  console.log("Always runs"); // cleanup\n}'
    },
    {
      title: 'Debugging Like a Pro',
      points: ['`console.log/warn/error/table` — different log levels', '`console.table(arr)` shows data as a table — very useful!', '`debugger` statement pauses execution in DevTools', '✅ Use browser DevTools → Sources to set breakpoints'],
      code: 'console.log("Value:", x);\nconsole.warn("Careful!");\nconsole.error("Something broke!");\nconsole.table([{name:"Ali", age:22}]);\n\ndebugger; // pause here in DevTools'
    },
    {
      title: 'Type Checking',
      points: ['`typeof` returns a string: "number", "string", "boolean" etc.', '`instanceof` checks if object was created by a constructor', '`Number.isNaN()` is safer than `isNaN()` (global is buggy)', '✅ Use TypeScript for full type safety at compile time'],
      code: 'typeof 42           // "number"\ntypeof "hello"      // "string"\ntypeof null         // "object" (bug!)\ntypeof undefined    // "undefined"\n\n[] instanceof Array  // true\nNumber.isNaN(NaN)   // true ✅'
    },
  ],
  8: [
    {
      title: 'ES6 Classes',
      points: ['`class` is clean syntax over JavaScript prototypes', '`constructor()` runs automatically when you create an instance', '`extends` for inheritance, `super()` calls parent constructor', '✅ Static methods belong to the class, not objects'],
      code: 'class Animal {\n  constructor(name) { this.name = name; }\n  speak() { return `${this.name} speaks`; }\n}\n\nclass Dog extends Animal {\n  speak() { return `${this.name} barks!`; }\n}\n\nconst d = new Dog("Rex");\nd.speak(); // "Rex barks!"'
    },
    {
      title: 'OOP — 4 Core Principles',
      points: ['🔒 Encapsulation: keep data + methods together in one class', '👨‍👧 Inheritance: child class reuses parent class code', '🔄 Polymorphism: same method name, different behaviour', '🙈 Abstraction: hide the complexity, show only what is needed'],
      code: '// Polymorphism example\nclass Shape {\n  area() { return 0; }\n}\nclass Circle extends Shape {\n  constructor(r) { super(); this.r = r; }\n  area() { return Math.PI * this.r ** 2; }\n}'
    },
    {
      title: 'Getters & Setters',
      points: ['`get` — read a computed value like a regular property', '`set` — intercept assignment and add validation', 'Accessed with dot notation — looks like a property!', '✅ Perfect for validation or computed properties'],
      code: 'class User {\n  constructor(name) { this._name = name; }\n\n  get name() { return this._name.toUpperCase(); }\n  set name(val) {\n    if (val.length < 2) throw new Error("Too short!");\n    this._name = val;\n  }\n}'
    },
  ],
  9: [
    {
      title: 'Advanced Function Patterns',
      points: ['Currying: break a function into chain of single-argument calls', 'Memoization: cache results so expensive work is not repeated', 'Debounce: wait until user stops typing before calling function', '✅ Throttle: ensure function runs at most once per interval'],
      code: '// Currying\nconst add = a => b => a + b;\nadd(2)(3); // 5\n\n// Memoization\nfunction memoize(fn) {\n  const cache = {};\n  return x => cache[x] ?? (cache[x] = fn(x));\n}'
    },
    {
      title: 'Symbols & Iterators',
      points: ['`Symbol()` creates a globally unique key — never clashes', 'Symbols as object keys avoid accidental overwrites', 'Iterators implement `Symbol.iterator` protocol', '✅ `for...of` works on anything with `Symbol.iterator`'],
      code: 'const id = Symbol("id");\nconst user = { [id]: 123, name: "Ali" };\n\n// Custom iterator\nconst range = {\n  [Symbol.iterator]() {\n    let n = 0;\n    return { next: () => ({ value: n++, done: n > 3 }) };\n  }\n};\'\n[...range]; // [0, 1, 2]'
    },
    {
      title: 'Proxies & Reflect',
      points: ['`Proxy` wraps any object and intercepts get/set/delete', 'Great for validation, logging, and reactive state', '`Reflect` gives you the default behaviour inside traps', '✅ Vue 3 uses Proxy for its entire reactivity system'],
      code: 'const handler = {\n  get(target, key) {\n    console.log(`Reading: ${key}`);\n    return Reflect.get(target, key);\n  }\n};\n\nconst proxy = new Proxy({ x: 1 }, handler);\nproxy.x; // logs "Reading: x", returns 1'
    },
  ],
  10: [
    {
      title: 'call, apply, bind',
      points: ['All three let you manually set what `this` refers to', '`call(ctx, arg1, arg2)` — invokes immediately with separate args', '`apply(ctx, [args])` — same but args as array', '`bind(ctx)` — returns a NEW function, does not call immediately'],
      code: 'function greet(greeting) {\n  return `${greeting}, ${this.name}!`;\n}\nconst user = { name: "Ali" };\n\ngreet.call(user, "Hello");    // "Hello, Ali!"\ngreet.apply(user, ["Hi"]);   // "Hi, Ali!"\nconst fn = greet.bind(user); // new function\nfn("Hey");                   // "Hey, Ali!"'
    },
    {
      title: 'Generators',
      points: ['`function*` creates a generator — a pausable function', '`yield` pauses and sends a value out', '`next()` resumes from where it paused', '✅ Great for lazy sequences, infinite data, and async flows'],
      code: 'function* count() {\n  yield 1;\n  yield 2;\n  yield 3;\n}\n\nconst gen = count();\ngen.next(); // { value: 1, done: false }\ngen.next(); // { value: 2, done: false }\ngen.next(); // { value: 3, done: false }\ngen.next(); // { value: undefined, done: true }'
    },
    {
      title: 'Memory & Performance',
      points: ['Memory leak: old references block garbage collection', 'Garbage Collector frees memory when nothing references the object', 'JIT: JS engines compile hot code to fast machine code', '✅ Avoid large closures holding data you no longer need'],
      code: '// Memory leak example (avoid this!)\nconst cache = [];\nfunction leaky() {\n  cache.push(new Array(1000000)); // never freed!\n}\n\n// Good: clear when done\nfunction safe() {\n  let big = new Array(1000000);\n  // ... use it ...\n  big = null; // freed!\n}'
    },
  ],
};

const MAX_FREE_ATTEMPTS = 2;

export default function JSQuizApp() {
  const [db, setDb] = useState<Firestore | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [globalStats, setGlobalStats] = useState<GlobalStats>({ maxScore: 0, highestLevel: 1 });
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [authReady, setAuthReady] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [themeLoaded, setThemeLoaded] = useState(false);

  const [currentLevel, setCurrentLevel] = useState(1);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [quizState, setQuizState] = useState<'start' | 'in_progress' | 'result'>('start');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [levelPassed, setLevelPassed] = useState(false);
  const [txStatus, setTxStatus] = useState("");
  const [autoProgressing, setAutoProgressing] = useState(false);
  const [showMetaMaskHelp, setShowMetaMaskHelp] = useState(false);

  // Wallet connection state
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const [basename, setBasename] = useState<string | null>(null);
  const [availableWallets, setAvailableWallets] = useState<string[]>([]);
  const [walletError, setWalletError] = useState<string | null>(null);

  // Attempt tracking & social unlock
  const [levelAttempts, setLevelAttempts] = useState<Record<number, number>>({});
  const [levelScores, setLevelScores] = useState<Record<number, number>>({});
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paidLevels, setPaidLevels] = useState<Record<number, boolean>>({});
  // Keep social for backward compat (now unused but keeps localStorage logic safe)
  const socialUnlocked: Record<number, boolean> = {};

  // Level 1 reward state
  const [rewardStatus, setRewardStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [rewardTxHash, setRewardTxHash] = useState<string | null>(null);
  const [rewardError, setRewardError] = useState<string | null>(null);

  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'quiz' | 'learn' | 'dashboard'>('quiz');
  const [learningLevel, setLearningLevel] = useState(1);

  const contractAddedRef = useRef(false);

  // --- Load theme preference from localStorage ---
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('quizTheme');
      if (savedTheme === 'light') setIsDarkMode(false);
      setThemeLoaded(true);

      // Load attempts, scores, paid levels
      try {
        const savedAttempts = localStorage.getItem('quizAttempts');
        if (savedAttempts) setLevelAttempts(JSON.parse(savedAttempts));
        const savedScores = localStorage.getItem('quizScores');
        if (savedScores) setLevelScores(JSON.parse(savedScores));
        const savedPaid = localStorage.getItem('quizPaidLevels');
        if (savedPaid) setPaidLevels(JSON.parse(savedPaid));
      } catch { }
    }
  }, []);

  // --- Save theme preference to localStorage ---
  useEffect(() => {
    if (typeof window !== 'undefined' && themeLoaded) {
      localStorage.setItem('quizTheme', isDarkMode ? 'dark' : 'light');
    }
  }, [isDarkMode, themeLoaded]);

  // --- Initialize Firebase & Auth ---
  useEffect(() => {
    try {
      if (!firebaseConfig.projectId) {
        console.warn('Firebase config not set. Using local-only mode.');
        setUserId(`local-${crypto.randomUUID()}`);
        setAuthReady(true);
        return;
      }
      const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
      setDb(getFirestore(app));
      const auth = getAuth(app);

      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) setUserId(user.uid);
        else signInAnonymously(auth).catch(() => setUserId(`local-${crypto.randomUUID()}`));
        setAuthReady(true);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Firebase initialization error:', error);
      setUserId(`local-${crypto.randomUUID()}`);
      setAuthReady(true);
    }
  }, []);

  // ✅ Wallet detection + Farcaster/Base App auto-connect
  useEffect(() => {
    const checkWallets = () => {
      const wallets = getAvailableWallets();
      setAvailableWallets(wallets);
    };

    // 🚀 Farcaster / Base App: Auto-connect via SDK
    const tryFarcasterAutoConnect = async () => {
      try {
        if (sdk && sdk.wallet && sdk.wallet.ethProvider) {
          const sdkProvider = sdk.wallet.ethProvider;
          if (typeof sdkProvider.request === 'function') {
            console.log('Farcaster SDK detected — attempting auto-connect...');
            // First check if already connected
            const existingAccounts = await sdkProvider.request({ method: 'eth_accounts' });
            if (existingAccounts && existingAccounts.length > 0) {
              setConnectedAddress(existingAccounts[0]);
              console.log('Farcaster wallet auto-connected (existing):', existingAccounts[0]);
              return;
            }
            // Request connection (Farcaster auto-approves this)
            const accounts = await sdkProvider.request({ method: 'eth_requestAccounts' });
            if (accounts && accounts.length > 0) {
              setConnectedAddress(accounts[0]);
              console.log('Farcaster wallet auto-connected:', accounts[0]);
            }
            return; // SDK connected — no need to check window.ethereum
          }
        }
      } catch (e) {
        console.log('Farcaster auto-connect skipped (not in Farcaster):', e);
      }

      // 🌐 Normal browser: check if already connected (no prompt)
      const provider = getWalletProvider();
      if (provider) {
        try {
          const accounts = await provider.request({ method: 'eth_accounts' });
          if (accounts && accounts.length > 0) {
            setConnectedAddress(accounts[0]);
          }
        } catch (error) {
          console.log('Error checking wallet connection:', error);
        }
      }
    };

    checkWallets();
    tryFarcasterAutoConnect();

    // Retry after delay to catch delayed injections
    const timer = setTimeout(() => {
      checkWallets();
      tryFarcasterAutoConnect();
    }, 1000);

    // Listen for account changes
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length > 0) setConnectedAddress(accounts[0]);
      else setConnectedAddress(null);
    };

    if (typeof window !== 'undefined' && (window as any).ethereum) {
      (window as any).ethereum.on?.('accountsChanged', handleAccountsChanged);
    }
    // Also listen on SDK provider if available
    try {
      if (sdk?.wallet?.ethProvider?.on) {
        sdk.wallet.ethProvider.on('accountsChanged', handleAccountsChanged);
      }
    } catch (e) { }

    return () => {
      clearTimeout(timer);
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        (window as any).ethereum.removeListener?.('accountsChanged', handleAccountsChanged);
      }
      try {
        if (sdk?.wallet?.ethProvider?.removeListener) {
          sdk.wallet.ethProvider.removeListener('accountsChanged', handleAccountsChanged);
        }
      } catch (e) { }
    };
  }, []);

  // ✅ NEW: Fetch Basename (ENS on Base) for the connected address
  useEffect(() => {
    const fetchBasename = async () => {
      if (!connectedAddress) {
        setBasename(null);
        return;
      }

      try {
        // Basenames use the ENS architecture on Base. 
        // We use the Blockscout API as a reliable L2 resolver proxy for miniapps.
        const response = await fetch(`https://base.blockscout.com/api/v2/addresses/${connectedAddress}/names`);
        const data = await response.json();

        if (data && data.items && data.items.length > 0) {
          // Look for a name ending in .base
          const baseNameItem = data.items.find((item: any) => item.name.endsWith('.base'));
          if (baseNameItem) {
            setBasename(baseNameItem.name);
            console.log('Basename found:', baseNameItem.name);
          }
        }
      } catch (error) {
        console.log('Error fetching Basename:', error);
      }
    };

    fetchBasename();
  }, [connectedAddress]);

  // --- Global Stats Listener ---
  useEffect(() => {
    if (!authReady || !db) return;
    const statsRef = doc(db, PUBLIC_COLLECTION_PATH, GLOBAL_STATS_DOC_ID);
    const unsubscribe = onSnapshot(statsRef, (docSnap) => {
      if (docSnap.exists()) setGlobalStats(docSnap.data() as GlobalStats);
      else {
        const initialData = { maxScore: 0, highestLevel: 1, updated: new Date().toISOString() };
        setGlobalStats(initialData);
        setDoc(statsRef, initialData, { merge: true }).catch(console.error);
      }
    });
    return () => unsubscribe();
  }, [authReady, db]);

  // ✅ NEW: Fetch Global Leaderboard (Top 5)
  useEffect(() => {
    if (!db) return;

    const fetchLeaderboard = async () => {
      try {
        const lbQuery = query(
          collection(db, 'leaderboard'),
          orderBy('totalPoints', 'desc'),
          limit(5)
        );
        const snapshot = await getDocs(lbQuery);
        const data = snapshot.docs.map(doc => doc.data());
        setLeaderboard(data);
      } catch (err) {
        console.error('Leaderboard fetch error:', err);
      }
    };

    fetchLeaderboard();
    // Re-fetch when entering dashboard
    if (activeTab === 'dashboard') fetchLeaderboard();
  }, [db, activeTab]);

  const levelQuestions = useMemo(() => QUIZ_DATA.filter(q => q.level === currentLevel), [currentLevel]);
  const currentQuestion = levelQuestions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === levelQuestions.length - 1;

  // Reset question index when level changes
  useEffect(() => {
    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedOption(null);
    setShowExplanation(false);
  }, [currentLevel]);

  // ✅ FIXED: Helper function to add contract to MetaMask (ONCE per session)
  const addContractToMetaMask = useCallback(async () => {
    if (contractAddedRef.current) return; // Already tried this session

    try {
      const provider = getWalletProvider();
      if (!provider) return;

      if (!isValidAddress(QUIZ_CONTRACT_ADDRESS)) {
        console.error('Invalid contract address');
        return;
      }

      await provider.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: QUIZ_CONTRACT_ADDRESS,
            symbol: 'JSQUIZ',
            decimals: 0,
            image: 'https://base-jsquiz.vercel.app/icon-pro.png',
          },
        },
      });
      console.log('Contract added to MetaMask');
      contractAddedRef.current = true;
    } catch (error) {
      console.log('Failed to add contract to MetaMask (normal for custom contracts):', error);
      contractAddedRef.current = true;
    }
  }, []);

  // ✅ NEW: Connect wallet function with proper error handling and retry
  const connectWallet = useCallback(async () => {
    setWalletError(null);
    try {
      // Wait a moment for MetaMask to inject ethereum object
      let provider = getWalletProvider();
      if (!provider) {
        // Try once more after a small delay
        await new Promise(resolve => setTimeout(resolve, 500));
        provider = getWalletProvider();
      }

      if (!provider) {
        setWalletError('No Web3 wallet detected. Please install MetaMask, Coinbase Wallet, or Base App.');
        return;
      }

      try {
        const accounts = await provider.request({
          method: 'eth_requestAccounts',
        });

        if (!accounts || accounts.length === 0) {
          setWalletError('No accounts available. Please connect a wallet account.');
          return;
        }

        setConnectedAddress(accounts[0]);
        setWalletError(null);
        console.log('Wallet connected:', accounts[0]);
      } catch (requestError: any) {
        console.error('Request accounts error:', requestError);

        if (requestError.code === 4001) {
          setWalletError('Connection cancelled. Please try again.');
        } else if (requestError.code === -32002) {
          setWalletError('Connection request already pending. Please check your wallet.');
        } else if (requestError.message?.includes('User rejected') || requestError.message?.includes('rejected')) {
          setWalletError('Connection rejected. Please try again and approve the request.');
        } else {
          setWalletError(requestError.message || 'Failed to connect wallet. Please try again.');
        }
      }
    } catch (error: any) {
      console.error('Wallet connection error:', error);
      setWalletError('Unexpected error connecting wallet. Please try again.');
    }
  }, []);

  // ✅ OPTIMIZED: Send Transaction with better user experience and security
  // Send Master Score to Blockchain
  const userCompleteLevel = useCallback(async (finalScore?: number) => {
    try {
      const activeScore = finalScore !== undefined ? finalScore : score;
      // Validate contract address
      if (!isValidAddress(QUIZ_CONTRACT_ADDRESS)) {
        setTxStatus('❌ Invalid contract address');
        setAutoProgressing(false);
        return;
      }

      setTxStatus(`📤 Saving Score ${activeScore}/${QUESTIONS_PER_LEVEL} for Level ${currentLevel} to Base...`);
      setShowMetaMaskHelp(true);

      const provider = getWalletProvider();
      if (!provider) {
        setTxStatus('❌ No Web3 wallet detected. Please connect a wallet first.');
        setAutoProgressing(false);
        return;
      }

      try {
        // Create a timeout promise
        const requestPromise = provider.request({
          method: 'eth_requestAccounts',
        });

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout: MetaMask did not respond within 30 seconds')), 30000)
        );

        const accounts = await Promise.race([requestPromise, timeoutPromise]) as string[];

        if (!accounts || accounts.length === 0) {
          setTxStatus('❌ No wallet account available');
          setAutoProgressing(false);
          return;
        }

        const account = accounts[0];
        setConnectedAddress(account);
        setTxStatus(`✅ Wallet connected: ${account.slice(0, 6)}...${account.slice(-4)}`);

        // Only try to add contract once per session
        if (!contractAddedRef.current) {
          await addContractToMetaMask();
        }

        // Safely encode function call with validation
        let encodedData: string;
        try {
          encodedData = encodeFunctionCall('completeLevel', [currentLevel, activeScore]);
        } catch (encodeError: any) {
          setTxStatus(`❌ ${encodeError.message}`);
          setAutoProgressing(false);
          return;
        }

        // Send transaction with proper parameters
        const txHash = await provider.request({
          method: 'eth_sendTransaction',
          params: [{
            from: account,
            to: QUIZ_CONTRACT_ADDRESS,
            value: '0',
            data: encodedData,
            gas: '150000',
            chainId: '0x2105', // Base Mainnet
          }],
        });

        if (!txHash || typeof txHash !== 'string') {
          setTxStatus('❌ Transaction failed: Invalid response from wallet');
          setAutoProgressing(false);
          return;
        }

        // Sync with Firestore (Global Leaderboard)
        if (db && account) {
          const totalPoints = Object.values(levelScores).reduce((a, b) => a + b, 0) + (activeScore > (levelScores[currentLevel] || 0) ? (activeScore - (levelScores[currentLevel] || 0)) : 0);
          await setDoc(doc(db, 'leaderboard', account.toLowerCase()), {
            address: account,
            basename: basename,
            totalPoints: totalPoints,
            highestLevel: Math.max(globalStats.highestLevel, currentLevel),
            lastUpdated: new Date().toISOString()
          }, { merge: true });
        }

        setTxStatus(`🚀 Transaction sent! Hash: ${txHash.slice(0, 10)}...`);
        console.log('Transaction sent to contract:', txHash);

        // Show BaseScan link
        setTimeout(() => {
          setTxStatus(prev => `${prev}\n🔍 View on BaseScan: https://basescan.org/tx/${txHash}`);
        }, 1000);

        return txHash;

      } catch (walletErr: any) {
        console.log('Wallet error:', walletErr);

        // Handle timeout specifically
        if (walletErr.message?.includes('timeout') || walletErr.message?.includes('Timeout')) {
          setTxStatus('❌ Request timeout: MetaMask did not respond. Please try again.');
        } else if (walletErr.code === 4001) {
          setTxStatus('❌ Transaction rejected by user');
        } else if (walletErr.message?.includes('insufficient funds')) {
          setTxStatus('❌ Insufficient ETH for gas fees');
        } else if (walletErr.message?.includes('user rejected')) {
          setTxStatus('❌ User rejected the transaction');
        } else if (walletErr.message?.includes('connection') || walletErr.message?.includes('Connection')) {
          setTxStatus('❌ Connection error with wallet. Please check MetaMask.');
        } else {
          setTxStatus(`⚠️ ${walletErr.message?.slice(0, 60) || 'Transaction failed'}`);
        }
        setAutoProgressing(false);
        return null;
      }
    } catch (err: any) {
      setTxStatus("❌ Error: " + (err.message?.slice(0, 60) || 'Transaction failed'));
      setAutoProgressing(false);
      console.error('Transaction error:', err);
      return null;
    }
  }, [currentLevel, addContractToMetaMask]);

  const handleOptionSelect = useCallback((option: string) => {
    if (selectedOption) return;
    setSelectedOption(option);
    if (option === currentQuestion.answer) setScore(prev => prev + 1);
    setShowExplanation(true);
  }, [currentQuestion, selectedOption]);

  const handleNextQuestion = useCallback(async () => {
    setSelectedOption(null);
    setShowExplanation(false);
    if (isLastQuestion) {
      const passed = score >= PASS_THRESHOLD;
      setLevelPassed(passed);
      setQuizState('result');

      // Track attempt count and best score
      const newAttemptsCount = (levelAttempts[currentLevel] || 0) + 1;
      const newAttempts = { ...levelAttempts, [currentLevel]: newAttemptsCount };
      setLevelAttempts(newAttempts);
      localStorage.setItem('quizAttempts', JSON.stringify(newAttempts));

      let earnedPoints = score * 10; // e.g. 70 for failing score of 7
      if (passed) {
        earnedPoints = newAttemptsCount === 1 ? 100 : 80;
      }

      const newScores = { ...levelScores, [currentLevel]: Math.max(levelScores[currentLevel] || 0, earnedPoints) };
      setLevelScores(newScores);
      localStorage.setItem('quizScores', JSON.stringify(newScores));

      if (passed) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#0052FF', '#337AFF', '#0038B2']
        });
        setAutoProgressing(true);
        await userCompleteLevel(earnedPoints); // Save points on-chain
      }
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  }, [isLastQuestion, score, userCompleteLevel, levelAttempts, levelScores, currentLevel]);

  const startQuiz = useCallback((level: number) => {
    const attempts = levelAttempts[level] || 0;
    const paid = paidLevels[level];
    if (attempts >= MAX_FREE_ATTEMPTS && !paid) {
      setCurrentLevel(level);
      setPaymentStatus('idle');
      setPaymentError(null);
      setShowPaymentModal(true);
      return;
    }
    setCurrentLevel(level);
    setTxStatus("");
    setLevelPassed(false);
    setQuizState('in_progress');
    setShowMetaMaskHelp(false);
  }, [levelAttempts, paidLevels]);

  // $0.05 payment = ~0.00002 ETH on Base (in wei: 20000000000000)
  const PAYMENT_WEI = '0x1DFD14000'; // 0.00002 ETH in hex wei ≈ $0.05
  const PAYMENT_RECEIVER = '0x0881e4c7b81dC36Fc4Fc1c82cE0e97bBB0134F93'; // Owner wallet

  // Level 1 Reward: $0.03 USDC on Base (6 decimals → 30000 = $0.03)
  const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'; // USDC contract on Base
  const REWARD_RECEIVER = '0x0881e4c7b81dC36Fc4Fc1c82cE0e97bBB0134F93'; // Owner wallet
  // ERC-20 transfer(address,uint256) selector = 0xa9059cbb
  const REWARD_USDC_DATA = '0xa9059cbb' +
    '0881e4c7b81dc36fc4fc1c82ce0e97bbb0134f93'.padStart(64, '0') +
    (30000).toString(16).padStart(64, '0'); // 30000 = $0.03 USDC

  const handlePaymentUnlock = useCallback(async (level: number) => {
    setPaymentStatus('pending');
    setPaymentError(null);

    try {
      // First ensure wallet is connected
      let provider = getWalletProvider();
      if (!provider) {
        await new Promise(resolve => setTimeout(resolve, 500));
        provider = getWalletProvider();
      }
      if (!provider) {
        setPaymentError('No wallet detected. Please connect MetaMask or Coinbase Wallet first.');
        setPaymentStatus('error');
        return;
      }

      // Get connected account
      const accounts = await provider.request({ method: 'eth_requestAccounts' });
      if (!accounts || accounts.length === 0) {
        setPaymentError('No wallet account found. Please unlock your wallet.');
        setPaymentStatus('error');
        return;
      }
      const account = accounts[0];
      setConnectedAddress(account);

      // Switch to Base Mainnet
      try {
        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x2105' }],
        });
      } catch (switchErr: any) {
        // If chain not added, add it
        if (switchErr.code === 4902) {
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x2105',
              chainName: 'Base',
              nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
              rpcUrls: ['https://mainnet.base.org'],
              blockExplorerUrls: ['https://basescan.org'],
            }],
          });
        }
      }

      // Send $0.05 ETH payment
      const txHash = await provider.request({
        method: 'eth_sendTransaction',
        params: [{
          from: account,
          to: PAYMENT_RECEIVER,
          value: PAYMENT_WEI,
          gas: '21000',
          chainId: '0x2105',
        }],
      });

      if (!txHash) {
        setPaymentError('Transaction failed. Please try again.');
        setPaymentStatus('error');
        return;
      }

      // Payment successful — unlock level
      setPaymentStatus('success');
      const newPaid = { ...paidLevels, [level]: true };
      setPaidLevels(newPaid);
      localStorage.setItem('quizPaidLevels', JSON.stringify(newPaid));

      // Reset attempt count for this level
      const newAttempts = { ...levelAttempts, [level]: 0 };
      setLevelAttempts(newAttempts);
      localStorage.setItem('quizAttempts', JSON.stringify(newAttempts));

      // Auto-close modal and start quiz after 2s
      setTimeout(() => {
        setShowPaymentModal(false);
        setPaymentStatus('idle');
        setCurrentLevel(level);
        setTxStatus('');
        setLevelPassed(false);
        setQuizState('in_progress');
        setShowMetaMaskHelp(false);
      }, 2000);

    } catch (err: any) {
      console.error('Payment error:', err);
      if (err.code === 4001 || err.message?.includes('rejected') || err.message?.includes('cancel')) {
        setPaymentError('Payment cancelled. Try again when ready.');
      } else {
        setPaymentError(err.message?.slice(0, 80) || 'Payment failed. Please try again.');
      }
      setPaymentStatus('error');
    }
  }, [paidLevels, levelAttempts]);

  // ✅ Level 1 Optional Reward Handler — user voluntarily pays $0.03 to support learning
  const handleLevel1Reward = useCallback(async () => {
    setRewardStatus('pending');
    setRewardError(null);

    try {
      let provider = getWalletProvider();
      if (!provider) {
        await new Promise(resolve => setTimeout(resolve, 500));
        provider = getWalletProvider();
      }
      if (!provider) {
        setRewardError('No wallet detected. Please connect MetaMask or Coinbase Wallet first.');
        setRewardStatus('error');
        return;
      }

      // Get connected account
      const accounts = await provider.request({ method: 'eth_requestAccounts' });
      if (!accounts || accounts.length === 0) {
        setRewardError('No wallet account found. Please unlock your wallet.');
        setRewardStatus('error');
        return;
      }
      const account = accounts[0];
      setConnectedAddress(account);

      // Switch to Base Mainnet
      try {
        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x2105' }],
        });
      } catch (switchErr: any) {
        if (switchErr.code === 4902) {
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x2105',
              chainName: 'Base',
              nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
              rpcUrls: ['https://mainnet.base.org'],
              blockExplorerUrls: ['https://basescan.org'],
            }],
          });
        }
      }

      // Send $0.03 USDC wallet-to-wallet on Base via ERC-20 transfer
      const txHash = await provider.request({
        method: 'eth_sendTransaction',
        params: [{
          from: account,
          to: USDC_BASE,          // USDC token contract
          value: '0x0',           // No ETH — token transfer
          data: REWARD_USDC_DATA, // transfer(owner, 30000)
          gas: '0xF424',          // 62500 gas — enough for ERC-20
          chainId: '0x2105',      // Base Mainnet
        }],
      });

      if (!txHash) {
        setRewardError('Transaction failed. Please try again.');
        setRewardStatus('error');
        return;
      }

      setRewardTxHash(txHash);
      setRewardStatus('success');

    } catch (err: any) {
      console.error('Reward payment error:', err);
      if (err.code === 4001 || err.message?.includes('rejected') || err.message?.includes('cancel')) {
        setRewardError('Payment cancelled. No worries, you can always support later!');
      } else {
        setRewardError(err.message?.slice(0, 80) || 'Payment failed. Please try again.');
      }
      setRewardStatus('error');
    }
  }, [REWARD_USDC_DATA, USDC_BASE]);

  // Auto-advance to next level after transaction completes
  useEffect(() => {
    if (!autoProgressing) return;

    const hasTxStatus = txStatus && txStatus.length > 0;
    const txSuccessful = hasTxStatus && (txStatus.includes('🚀') || txStatus.includes('Transaction sent') || txStatus.includes('BaseScan'));

    if (txSuccessful && currentLevel < TOTAL_LEVELS) {
      const timer = setTimeout(() => {
        startQuiz(currentLevel + 1);
        setAutoProgressing(false);
        setShowMetaMaskHelp(false);
      }, 5000); // Give user time to see the success message
      return () => clearTimeout(timer);
    } else if (hasTxStatus && txStatus.includes('❌')) {
      setAutoProgressing(false);
    }
  }, [autoProgressing, txStatus, currentLevel, startQuiz]);

  if (!authReady) return <div className="text-white text-center pt-16 font-semibold">Authenticating...</div>;

  const bgClass = isDarkMode
    ? 'bg-linear-to-br from-slate-900 via-purple-900 to-slate-900 text-white'
    : 'bg-linear-to-br from-cyan-50 via-blue-50 to-indigo-50 text-slate-900';

  const cardClass = isDarkMode
    ? 'glass-dark rounded-xl shadow-2xl'
    : 'glass rounded-xl shadow-2xl';

  const textSecondaryClass = isDarkMode ? 'text-gray-300' : 'text-gray-700';
  const textTertiaryClass = isDarkMode ? 'text-gray-400' : 'text-gray-600';
  const inputClass = isDarkMode
    ? 'glass-dark rounded-lg text-white placeholder-gray-400'
    : 'glass rounded-lg text-gray-900 placeholder-gray-600';

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark' : ''} bg-background text-foreground transition-colors duration-500 overflow-hidden relative`}>
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ x: [0, 100, 0], y: [0, 50, 0] }}
          transition={{ duration: 20, repeat: Infinity }}
          className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{ x: [0, -100, 0], y: [0, -50, 0] }}
          transition={{ duration: 25, repeat: Infinity }}
          className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-[120px]"
        />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:py-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-16"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-premium rounded-2xl shadow-lg shadow-primary/20">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight leading-none">JAZZ<span className="text-primary italic">MINI</span></h1>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">v2.0 Premium Experience</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <nav className="hidden sm:flex items-center glass-card p-1 rounded-2xl mr-2">
              {(['quiz', 'learn', 'dashboard'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    setQuizState('start');
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab
                    ? 'bg-primary text-white shadow-lg'
                    : 'text-slate-500 hover:text-primary'
                    }`}
                >
                  {tab}
                </button>
              ))}
            </nav>

            {/* 🔥 Professional Connect Wallet Button in Header */}
            {connectedAddress ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 px-3 py-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 cursor-default"
              >
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="font-mono text-xs font-bold text-emerald-400 hidden sm:block">
                  {basename || `${connectedAddress.slice(0, 6)}...${connectedAddress.slice(-4)}`}
                </span>
                <Award className="w-4 h-4 text-emerald-400 sm:hidden" />
              </motion.div>
            ) : (
              <motion.button
                onClick={connectWallet}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-premium text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:shadow-xl transition-all group"
              >
                <Wallet className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                <span className="hidden sm:inline">Connect Wallet</span>
                <span className="sm:hidden">Connect</span>
              </motion.button>
            )}

            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-3 glass-card hover:bg-primary/10 hover:text-primary rounded-2xl transition-all"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </motion.div>

        {/* Navigation for Mobile */}
        <div className="flex sm:hidden justify-center mb-8 gap-2">
          {(['quiz', 'learn', 'dashboard'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setQuizState('start');
              }}
              className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all ${activeTab === tab
                ? 'bg-primary text-white'
                : 'glass-card text-slate-500'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'quiz' && quizState === 'start' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-8"
          >
            <div className="space-y-4">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 5, repeat: Infinity }}
                className="w-20 h-20 mx-auto bg-gradient-premium rounded-3xl flex items-center justify-center shadow-lg"
              >
                <BookOpen className="w-10 h-10 text-white" />
              </motion.div>
              <h2 className={`text-4xl sm:text-5xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                JAZZMINI <span className="text-primary italic">Quiz</span>
              </h2>
              <p className={`text-lg sm:text-xl font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'} max-w-2xl mx-auto`}>
                Prepare for your <span className="text-primary font-bold">JavaScript Interview</span>!
                Master concepts with 2 attempts per level.
              </p>

              {/* Motivational JS Quotes */}
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                className={`py-3 px-6 max-w-lg mx-auto rounded-full border border-dashed ${isDarkMode ? 'border-primary/30 bg-primary/5' : 'border-primary/40 bg-primary/5'}`}
              >
                <p className={`text-sm italic font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  "{JS_QUOTES[Math.floor(Math.random() * JS_QUOTES.length)]}"
                </p>
              </motion.div>
            </div>

            {/* Wallet Section */}
            <motion.div
              whileHover={{ scale: 1.01 }}
              className={`p-6 glass-card text-left max-w-md mx-auto ${isDarkMode ? 'glass-blue' : ''}`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-primary/20 text-primary' : 'bg-primary/10 text-primary'}`}>
                  <Wallet className="w-6 h-6" />
                </div>
                <h3 className={`font-bold text-xl ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Web3 Rewards</h3>
              </div>

              {connectedAddress ? (
                <div className="flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <div>
                    <p className="text-sm font-bold text-emerald-500">{basename || 'Connected'}</p>
                    <p className="font-mono text-xs opacity-70">{connectedAddress.slice(0, 6)}...{connectedAddress.slice(-4)}</p>
                  </div>
                  <Award className="text-emerald-500 w-5 h-5" />
                </div>
              ) : (
                <div className="space-y-4">
                  <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    Connect your wallet to earn digital badges and verifiable proof of your JavaScript expertise.
                  </p>
                  <button
                    onClick={connectWallet}
                    className="w-full py-4 bg-[#0052FF] hover:bg-[#0041CC] hover:shadow-xl hover:shadow-blue-600/30 rounded-xl text-white font-bold flex items-center justify-center gap-2 transition-all group"
                  >
                    Connect Wallet
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              )}
            </motion.div>

            {/* Level Grid */}
            <div className="space-y-4 pt-4">
              <h3 className={`text-sm font-bold uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Level Selection</h3>
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                {[...Array(TOTAL_LEVELS)].map((_, i) => {
                  const level = i + 1;
                  const unlocked = level <= globalStats.highestLevel;
                  const isCurrent = level === globalStats.highestLevel;
                  const attemptsUsed = levelAttempts[level] || 0;
                  const canRetry = attemptsUsed < MAX_FREE_ATTEMPTS || socialUnlocked[level];

                  return (
                    <motion.button
                      key={level}
                      whileHover={unlocked ? { scale: 1.1, y: -2 } : {}}
                      whileTap={unlocked ? { scale: 0.95 } : {}}
                      onClick={() => startQuiz(level)}
                      disabled={!unlocked}
                      className={`h-12 relative flex items-center justify-center rounded-xl font-bold transition-all ${unlocked
                        ? isCurrent
                          ? 'bg-primary text-white shadow-lg ring-2 ring-primary/50'
                          : 'bg-gradient-premium text-white'
                        : 'bg-slate-800/20 text-slate-500 cursor-not-allowed opacity-40'
                        }`}
                    >
                      {level}
                      {unlocked && attemptsUsed > 0 && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-[8px] flex items-center justify-center border border-white dark:border-slate-900">
                          {attemptsUsed}
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* Learning View */}
        {activeTab === 'learn' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            {/* Level Tabs */}
            <div className="flex flex-wrap gap-2 justify-center">
              {[...Array(TOTAL_LEVELS)].map((_, i) => {
                const lvl = i + 1;
                const attempted = (levelAttempts[lvl] || 0) > 0;
                return (
                  <button
                    key={i}
                    onClick={() => setLearningLevel(lvl)}
                    className={`relative px-4 py-2 rounded-xl text-xs font-bold transition-all ${learningLevel === lvl
                      ? 'bg-primary text-white shadow-lg shadow-primary/30'
                      : 'glass-card text-slate-500 hover:text-primary'
                      }`}
                  >
                    {LEVEL_ICONS[i]} Lvl {lvl}
                    {attempted && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-slate-900" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="space-y-6">
              {/* Header */}
              <div className={`p-5 glass-card flex items-center gap-4`}>
                <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-2xl shrink-0">
                  {LEVEL_ICONS[learningLevel - 1]}
                </div>
                <div className="flex-1">
                  <p className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Level {learningLevel} — Study Guide</p>
                  <h2 className="text-2xl font-black text-primary">{LEVEL_TOPICS[learningLevel - 1]}</h2>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-[10px] uppercase font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Topics</p>
                  <p className="text-2xl font-black">{LEARNING_CONTENT[learningLevel]?.length}</p>
                </div>
              </div>

              {/* Cards */}
              <div className="grid grid-cols-1 gap-5">
                {LEARNING_CONTENT[learningLevel]?.map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="glass-card overflow-hidden"
                  >
                    {/* Card Header */}
                    <div className="px-6 py-4 border-b border-white/5 flex items-center gap-3 bg-white/5">
                      <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-black text-xs shrink-0">
                        {idx + 1}
                      </div>
                      <h4 className="font-black text-base">{item.title}</h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2">
                      {/* Key Points */}
                      <div className="p-5 space-y-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">📌 Key Points</p>
                        {item.points.map((p, pIdx) => {
                          // Render inline code (backtick syntax)
                          const parts = p.split(/`([^`]+)`/);
                          return (
                            <div key={pIdx} className="flex gap-2.5 items-start">
                              <span className="text-primary mt-0.5 shrink-0 text-xs">▸</span>
                              <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-700 font-medium'}`}>
                                {parts.map((part, pi) =>
                                  pi % 2 === 1
                                    ? <code key={pi} className={`px-1.5 py-0.5 rounded-md font-mono text-[11px] border ${isDarkMode
                                      ? 'bg-primary/15 text-primary border-primary/20'
                                      : 'bg-primary/10 text-primary border-primary/30'
                                      }`}>{part}</code>
                                    : <span key={pi}>{part}</span>
                                )}
                              </p>
                            </div>
                          );
                        })}
                      </div>

                      {/* Code Example */}
                      <div className="border-t sm:border-t-0 sm:border-l border-white/5 p-5">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">💻 Code Example</p>
                        <pre className="text-[11px] font-mono leading-relaxed text-emerald-300 bg-slate-950/60 p-3 rounded-xl overflow-x-auto border border-white/5 whitespace-pre-wrap">{item.code}</pre>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <button
                onClick={() => {
                  setActiveTab('quiz');
                  startQuiz(learningLevel);
                }}
                className="w-full py-4 bg-gradient-premium rounded-2xl text-white font-black uppercase tracking-widest shadow-xl shadow-primary/20 flex items-center justify-center gap-2 group"
              >
                🎯 Start Level {learningLevel} Quiz
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Dashboard View */}
        {activeTab === 'dashboard' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-8"
          >
            {/* 🏆 Global Leaderboard Section */}
            <div className="glass-card overflow-hidden">
              <div className="p-4 border-b border-[#0052FF]/20 bg-gradient-to-r from-[#0052FF]/5 to-transparent flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <h3 className="font-black uppercase tracking-widest text-xs">Global Arena Top Picks</h3>
                </div>
                <Users className="w-4 h-4 text-[#0052FF]" />
              </div>
              <div className="divide-y divide-white/5">
                {leaderboard.length > 0 ? leaderboard.map((player, idx) => (
                  <div key={idx} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-4">
                      <span className={`w-6 text-center font-black ${idx === 0 ? 'text-amber-500' : 'text-slate-500'}`}>
                        {idx + 1}
                      </span>
                      <div>
                        <p className="text-xs font-bold text-white">{player.basename || `${player.address.slice(0, 6)}...${player.address.slice(-4)}`}</p>
                        <p className="text-[10px] text-slate-500 font-mono">Expertise: Level {player.highestLevel}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-emerald-500">{player.totalPoints} pts</p>
                    </div>
                  </div>
                )) : (
                  <div className="p-8 text-center text-slate-500 text-xs italic">
                    Loading champions...
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-6 glass-card text-center space-y-1">
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Mastery Level</p>
                <p className="text-4xl font-black text-primary">{globalStats.highestLevel}</p>
                <div className="h-1 w-12 bg-primary/20 mx-auto rounded-full" />
              </div>
              <div className="p-6 glass-card text-center space-y-1">
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Total Attempts</p>
                <p className="text-4xl font-black text-rose-500">
                  {Object.values(levelAttempts).reduce((a, b) => a + b, 0)}
                </p>
                <div className="h-1 w-12 bg-rose-500/20 mx-auto rounded-full" />
              </div>
              <div className="p-6 glass-card text-center space-y-1">
                <p className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Leaderboard Score</p>
                <p className="text-4xl font-black text-emerald-500">
                  {Object.keys(levelScores).length > 0
                    ? Math.round(Object.values(levelScores).reduce((a, b) => a + b, 0) / Object.keys(levelScores).length)
                    : 0}
                </p>
                <div className="h-1 w-12 bg-emerald-500/20 mx-auto rounded-full" />
              </div>
            </div>

            <div className="glass-card overflow-hidden">
              <div className="p-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
                <h3 className="font-black uppercase tracking-widest text-xs">Technical Skill Matrix</h3>
                <Zap className="w-4 h-4 text-amber-500" />
              </div>
              <div className="p-4 space-y-4">
                {[...Array(TOTAL_LEVELS)].map((_, i) => {
                  const level = i + 1;
                  const score = levelScores[level] || 0;
                  const attempts = levelAttempts[level] || 0;
                  const unlocked = level <= globalStats.highestLevel;

                  return (
                    <div key={level} className={`flex items-center gap-4 ${!unlocked && 'opacity-30'}`}>
                      <div className="w-12 h-12 rounded-xl glass-card flex items-center justify-center font-black text-sm shrink-0">
                        {level}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between items-end">
                          <p className="text-xs font-bold">{LEVEL_TOPICS[i]}</p>
                          <p className="text-[10px] font-mono opacity-60 font-bold">{score}/100 pts</p>
                        </div>
                        <div className={`h-2 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'}`}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${score}%` }}
                            className="h-full bg-primary"
                          />
                        </div>
                      </div>
                      <div className="w-20 text-right">
                        <p className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Attempts</p>
                        <p className={`font-mono text-sm ${isDarkMode ? 'text-white' : 'text-slate-900 font-bold'}`}>{attempts}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {quizState === 'in_progress' && currentQuestion && (
            <motion.div
              key={`${currentLevel}-${currentQuestionIndex}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className={`p-4 glass-card flex flex-col sm:flex-row justify-between items-center gap-4`}>
                <div className="flex items-center gap-4">
                  <div className="bg-primary/20 p-2 rounded-lg">
                    <Award className="text-primary w-5 h-5" />
                  </div>
                  <div>
                    <p className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Progress</p>
                    <p className="font-bold">Level {currentLevel} Profile</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="text-center px-4 py-2 bg-slate-500/10 rounded-xl">
                    <p className="text-[10px] font-bold uppercase opacity-50">Score</p>
                    <p className="text-xl font-bold text-emerald-500">{score}</p>
                  </div>
                  <div className="text-center px-4 py-2 bg-slate-500/10 rounded-xl">
                    <p className="text-[10px] font-bold uppercase opacity-50">Question</p>
                    <p className="text-xl font-bold text-primary">{currentQuestionIndex + 1}/{QUESTIONS_PER_LEVEL}</p>
                  </div>
                </div>
              </div>

              <div className={`p-8 glass-card border-l-8 border-primary relative overflow-hidden`}>
                <div className="absolute top-0 right-0 p-4 opacity-5">
                  <Zap className="w-24 h-24" />
                </div>
                <h3 className={`text-2xl sm:text-3xl font-bold leading-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  {currentQuestion.question}
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {currentQuestion.options.map((option, index) => {
                  const isCorrect = option === currentQuestion.answer;
                  const isSelected = option === selectedOption;
                  const isAnswered = selectedOption !== null;

                  let borderColor = isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
                  let bgColor = '';
                  let textColor = isDarkMode ? 'text-slate-300' : 'text-slate-700';

                  if (isAnswered) {
                    if (isCorrect) {
                      borderColor = 'rgba(16, 185, 129, 0.5)';
                      bgColor = 'bg-emerald-500/10';
                      textColor = 'text-emerald-500';
                    } else if (isSelected) {
                      borderColor = 'rgba(244, 63, 94, 0.5)';
                      bgColor = 'bg-rose-500/10';
                      textColor = 'text-rose-500';
                    } else {
                      textColor = 'text-slate-500 opacity-30';
                    }
                  }

                  return (
                    <motion.button
                      key={index}
                      whileHover={!isAnswered ? { scale: 1.01, x: 5 } : {}}
                      whileTap={!isAnswered ? { scale: 0.99 } : {}}
                      onClick={() => handleOptionSelect(option)}
                      disabled={isAnswered}
                      style={{ borderColor }}
                      className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all text-left font-bold text-lg ${bgColor} ${textColor} ${!isAnswered ? (isDarkMode ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50') : 'cursor-default'}`}
                    >
                      <span>{option}</span>
                      {isAnswered && (
                        isCorrect ? <CheckCircle className="w-6 h-6" /> :
                          isSelected ? <XCircle className="w-6 h-6" /> : null
                      )}
                    </motion.button>
                  );
                })}
              </div>

              <AnimatePresence>
                {showExplanation && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className={`p-6 glass-card border-amber-500 bg-amber-500/5`}
                  >
                    <div className="flex gap-4">
                      <div className="p-2 h-fit bg-amber-500/20 rounded-lg text-amber-500">
                        <Zap className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-amber-500 mb-1 leading-none">Insight</h4>
                        <p className={`text-sm sm:text-base leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                          {currentQuestion.explanation}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {selectedOption && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={handleNextQuestion}
                  className="w-full py-5 bg-primary hover:bg-primary/90 text-white font-black text-xl rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center gap-2 group transition-all"
                >
                  {isLastQuestion ? `Evaluate Final Result` : 'Advance to Next Level'}
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {quizState === 'result' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md mx-auto"
          >
            <div className={`text-center space-y-8 p-10 glass-card relative overflow-hidden`}>
              {levelPassed ? (
                <>
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
                  <motion.div
                    initial={{ rotate: -10, scale: 0 }}
                    animate={{ rotate: 0, scale: 1 }}
                    className="w-24 h-24 mx-auto bg-emerald-500/10 rounded-full flex items-center justify-center border-4 border-emerald-500/20"
                  >
                    <Trophy className="w-12 h-12 text-emerald-500" />
                  </motion.div>

                  <div className="space-y-4">
                    <h2 className="text-3xl font-black text-emerald-500">Domain Mastered!</h2>
                    <p className={`font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      You conquered Level {currentLevel} with <span className="text-emerald-500 font-black">{score}/{QUESTIONS_PER_LEVEL}</span> correct answers!
                    </p>
                    <div className="py-3 px-6 bg-[#0052FF]/10 rounded-xl inline-block border border-[#0052FF]/20">
                      <p className="text-[#0052FF] text-[10px] uppercase tracking-widest font-black mb-1">Points Earned</p>
                      <p className="text-2xl font-black text-[#0052FF]">
                        {levelAttempts[currentLevel] === 1 ? '100' : '80'} <span className="text-sm opacity-50">/ 100</span>
                      </p>
                    </div>
                  </div>

                  {txStatus && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-4 bg-slate-500/5 rounded-xl border border-slate-500/10"
                    >
                      <p className="text-xs font-mono break-all opacity-70 leading-relaxed">{txStatus}</p>
                    </motion.div>
                  )}

                  {/* 🏅 Final Master Reward - Only after Level 10 */}
                  {currentLevel === 10 && levelPassed && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="p-5 rounded-2xl border-2 border-[#0052FF]/30 bg-gradient-to-br from-[#0052FF]/10 to-blue-500/5 text-left space-y-3"
                    >
                      {rewardStatus === 'success' ? (
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="text-center space-y-2 py-2"
                        >
                          <div className="text-3xl">🏆</div>
                          <p className="font-black text-[#0052FF] uppercase tracking-tight text-lg">JS Master Rank Attained!</p>
                          <p className="text-xs text-slate-400 font-bold italic">"You have conquered the entire JavaScript journey."</p>
                          {rewardTxHash && (
                            <a
                              href={`https://basescan.org/tx/${rewardTxHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] font-mono text-[#0052FF] underline opacity-70 hover:opacity-100 transition-opacity block"
                            >
                              View Badge on BaseScan ↗
                            </a>
                          )}
                        </motion.div>
                      ) : (
                        <>
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-[#0052FF]/20 rounded-xl flex items-center justify-center text-2xl shrink-0">
                              🏅
                            </div>
                            <div>
                              <p className="font-black text-sm text-[#0052FF] uppercase tracking-tight">Claim Master Status</p>
                              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                                You just finished all 10 Levels! Mint your <span className="text-[#0052FF] font-bold">JS Master Badge</span> on-chain to celebrate your victory.
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between px-3 py-2 bg-[#0052FF]/10 rounded-xl border border-[#0052FF]/20">
                            <div>
                              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Claiming Fee</p>
                              <p className="text-lg font-black text-[#0052FF]">$0.03 USDC</p>
                              <p className="text-[10px] text-slate-500 font-mono">on Base Mainnet</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">You Earn</p>
                              <p className="text-sm font-black text-white italic">MASTER BADGE</p>
                              <p className="text-[10px] text-slate-500">100% Optional</p>
                            </div>
                          </div>

                          {rewardError && (
                            <motion.p
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="text-xs text-rose-400 bg-rose-500/10 rounded-lg px-3 py-2 border border-rose-500/20"
                            >
                              ⚠️ {rewardError}
                            </motion.p>
                          )}

                          <motion.button
                            whileHover={rewardStatus !== 'pending' ? { scale: 1.02 } : {}}
                            whileTap={rewardStatus !== 'pending' ? { scale: 0.98 } : {}}
                            onClick={handleLevel1Reward}
                            disabled={rewardStatus === 'pending'}
                            className={`w-full py-4 rounded-xl text-white font-black text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${rewardStatus === 'pending'
                              ? 'bg-blue-600/50 cursor-not-allowed shadow-none'
                              : 'bg-[#0052FF] hover:bg-[#0041CC] hover:shadow-blue-600/40 hover:shadow-xl'
                              }`}
                          >
                            {rewardStatus === 'pending' ? (
                              <>
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                  className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                                />
                                Minting Badge...
                              </>
                            ) : (
                              <>
                                <Wallet className="w-4 h-4" />
                                Claim Master Achievement
                              </>
                            )}
                          </motion.button>
                          <p className="text-[10px] text-center text-slate-600">Voluntary reward to support JS learning. 😊</p>
                        </>
                      )}
                    </motion.div>
                  )}

                  <div className="flex flex-col gap-3">
                    {!txStatus || txStatus.includes('❌') ? (
                      <button
                        onClick={() => userCompleteLevel(score)}
                        className="w-full py-4 bg-gradient-to-r from-[#0052FF] to-[#0038B2] hover:from-[#0038B2] hover:to-[#002A80] text-white font-bold rounded-xl shadow-lg shadow-[#0052FF]/30 flex items-center justify-center gap-2 transition-all"
                      >
                        <Zap className="w-5 h-5" />
                        Sync Score on Base
                      </button>
                    ) : null}

                    {currentLevel < TOTAL_LEVELS && (
                      <button
                        onClick={() => startQuiz(currentLevel + 1)}
                        className="w-full py-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transition-all group"
                      >
                        Ascend to Level {currentLevel + 1}
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-rose-500 to-pink-500" />
                  <motion.div
                    initial={{ rotate: 10, scale: 0 }}
                    animate={{ rotate: 0, scale: 1 }}
                    className="w-24 h-24 mx-auto bg-rose-500/10 rounded-full flex items-center justify-center border-4 border-rose-500/20"
                  >
                    <XCircle className="w-12 h-12 text-rose-500" />
                  </motion.div>

                  <div className="space-y-2">
                    <h2 className="text-3xl font-black text-rose-500">Trial Failed</h2>
                    <p className={`font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      Level {currentLevel} requires {PASS_THRESHOLD} correct answers. You achieved <span className="text-rose-500 font-bold">{score}</span>.
                    </p>
                  </div>

                  <button
                    onClick={() => startQuiz(currentLevel)}
                    className="w-full py-4 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl shadow-lg shadow-rose-500/20 transition-all font-black uppercase tracking-widest"
                  >
                    Restart Level {currentLevel}
                  </button>
                </>
              )}

              <button
                onClick={() => setQuizState('start')}
                className={`w-full py-4 border-2 font-bold rounded-xl transition-all ${isDarkMode
                  ? 'border-slate-800 hover:bg-white/5 text-slate-400'
                  : 'border-slate-100 hover:bg-slate-50 text-slate-500'
                  }`}
              >
                Return to Nexus
              </button>
            </div>
          </motion.div>
        )}

        {/* 💳 Payment Modal — $0.05 to unlock more attempts */}
        <AnimatePresence>
          {showPaymentModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => paymentStatus !== 'pending' && setShowPaymentModal(false)}
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-sm glass-card p-8 text-center space-y-6 overflow-hidden"
              >
                {/* Top gradient bar */}
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500" />

                {paymentStatus === 'success' ? (
                  <>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-20 h-20 mx-auto bg-emerald-500/15 rounded-full flex items-center justify-center border-4 border-emerald-500/30"
                    >
                      <CheckCircle className="w-10 h-10 text-emerald-400" />
                    </motion.div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-black text-emerald-400 uppercase tracking-tighter">Payment Confirmed!</h3>
                      <p className="text-slate-400 text-sm">Level {currentLevel} attempts reset. Starting quiz now...</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-20 h-20 mx-auto bg-amber-500/10 rounded-full flex items-center justify-center border-4 border-amber-500/20 relative">
                      <Lock className="w-10 h-10 text-amber-400" />
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                        className="absolute inset-0 rounded-full border-2 border-dashed border-amber-500/30"
                      />
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-2xl font-black uppercase tracking-tighter">Attempts Exhausted</h3>
                      <p className="text-slate-400 text-sm">
                        You've used your <span className="text-white font-bold">2 free attempts</span> for Level {currentLevel}.
                        Unlock unlimited retries with a small payment.
                      </p>
                    </div>

                    {/* Price Card */}
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 flex items-center justify-between">
                      <div className="text-left">
                        <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Unlock Price</p>
                        <p className="text-3xl font-black text-amber-400">$0.05</p>
                        <p className="text-[10px] text-slate-500 font-mono">≈ 0.00002 ETH on Base</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">You Get</p>
                        <p className="text-xl font-black text-white">∞ Retries</p>
                        <p className="text-[10px] text-slate-500">for Level {currentLevel}</p>
                      </div>
                    </div>

                    {/* Error Message */}
                    {paymentError && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium text-left"
                      >
                        ⚠️ {paymentError}
                      </motion.div>
                    )}

                    <div className="space-y-3">
                      <motion.button
                        whileHover={paymentStatus !== 'pending' ? { scale: 1.02 } : {}}
                        whileTap={paymentStatus !== 'pending' ? { scale: 0.98 } : {}}
                        onClick={() => handlePaymentUnlock(currentLevel)}
                        disabled={paymentStatus === 'pending'}
                        className={`w-full py-4 rounded-xl text-white font-black flex items-center justify-center gap-2 transition-all shadow-lg ${paymentStatus === 'pending'
                          ? 'bg-amber-500/50 cursor-not-allowed shadow-amber-500/10'
                          : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:shadow-amber-500/40 hover:shadow-xl'
                          }`}
                      >
                        {paymentStatus === 'pending' ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                              className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                            />
                            Confirm in Wallet...
                          </>
                        ) : (
                          <>
                            <Wallet className="w-5 h-5" />
                            Pay $0.05 &amp; Unlock
                          </>
                        )}
                      </motion.button>

                      <button
                        onClick={() => setShowPaymentModal(false)}
                        disabled={paymentStatus === 'pending'}
                        className="w-full py-3 text-slate-500 text-xs font-bold uppercase tracking-widest hover:text-white transition-all disabled:opacity-40"
                      >
                        Maybe Later
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Powered by Base Footer */}
        <div className="mt-16 text-center pb-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border border-dashed text-xs font-bold uppercase tracking-widest transition-colors ${isDarkMode
              ? 'border-[#0052FF]/30 text-[#0052FF] bg-[#0052FF]/5 hover:bg-[#0052FF]/10'
              : 'border-[#0052FF]/40 text-[#0052FF] bg-[#0052FF]/5 hover:bg-[#0052FF]/10'
              }`}
          >
            <Zap className="w-4 h-4" />
            <span>Powered by Base</span>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
