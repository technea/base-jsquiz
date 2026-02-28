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
  Firestore
} from 'firebase/firestore';
import { CheckCircle, XCircle, RefreshCw, Trophy, BookOpen, Lock, Unlock, Zap, AlertCircle, Wallet, Sun, Moon, ArrowRight, Award, Timer } from 'lucide-react';
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

// ✅ Security: Safely detect wallet providers with retry mechanism
const getWalletProvider = (): EthereumProvider | null => {
  if (typeof window === 'undefined') return null;

  // Try to get ethereum provider with a small delay to allow MetaMask to inject
  let ethereum = (window as any).ethereum;

  // If not found immediately, check common wallet injection points
  if (!ethereum) {
    // Check for MetaMask specifically
    if ((window as any).MetaMask) {
      ethereum = (window as any).MetaMask;
    }
    // Check if injected but under different name
    else if ((window as any).ethereum) {
      ethereum = (window as any).ethereum;
    }
  }

  if (!ethereum) return null;

  // Validate that it has the required request method
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

const LEARNING_CONTENT: Record<number, { title: string; points: string[] }[]> = {
  1: [
    { title: 'var vs let vs const', points: ['`var` is function-scoped and hoisted', '`let` is block-scoped, can be reassigned', '`const` is block-scoped, cannot be reassigned', 'Prefer `const` by default, use `let` when needed'] },
    { title: 'Type Coercion', points: ['`2 + "2"` equals `"22"` (string concat)', '`==` converts types before comparing', '`===` checks value AND type', 'Use `===` to avoid bugs'] },
    { title: 'Arrays', points: ['`push()` adds to end, `pop()` removes from end', '`shift()` removes from start, `unshift()` adds to start', '`typeof []` returns `"object"` — arrays are objects', 'Use `Array.isArray()` to check for arrays'] },
  ],
  2: [
    { title: 'Function Types', points: ['Function declarations are hoisted', 'Function expressions are NOT hoisted', 'Arrow functions inherit `this` from parent scope', 'IIFE: Immediately Invoked Function Expression'] },
    { title: 'Closures', points: ['A closure gives access to outer scope from inner function', 'Closures are created every time a function is made', 'Useful for data privacy and factory functions', 'Callbacks use closures to access outer variables'] },
    { title: 'Spread & Destructuring', points: ['Spread `...` expands arrays/objects', 'Destructuring extracts values: `const {a, b} = obj`', 'Array destructuring: `const [x, y] = arr`', 'Default values: `const {a = 10} = obj`'] },
  ],
  3: [
    { title: 'Objects', points: ['Objects are key-value pairs', '`Object.keys()` returns array of keys', '`Object.assign()` copies properties', '`Object.freeze()` prevents modification'] },
    { title: 'Prototypes', points: ['Every object has a `__proto__` (prototype)', 'Prototypes enable inheritance in JS', '`Object.create(proto)` sets prototype explicitly', 'Classes use prototypes under the hood'] },
    { title: 'null vs undefined', points: ['`undefined` = variable declared but not assigned', '`null` = intentional absence of value', '`typeof null` is `"object"` (a historical JS bug)', 'Use `== null` to check for both null and undefined'] },
  ],
  4: [
    { title: 'Array Methods', points: ['`map()` transforms each element — returns new array', '`filter()` keeps elements that pass a test', '`reduce()` folds array into single value', '`find()` returns first match, `some()` returns boolean'] },
    { title: 'Chaining', points: ['Array methods return new arrays — chainable', '`arr.filter(x => x > 2).map(x => x * 2)`', 'Avoid mutating original array', '`slice()` is safe, `splice()` mutates in place'] },
    { title: 'Immutability', points: ['Prefer non-mutating methods: map, filter, reduce', 'Use spread to copy: `[...arr]` or `{...obj}`', 'Never sort original: sort a copy first', '`Array.from()` creates a new array from iterable'] },
  ],
  5: [
    { title: 'Promises', points: ['A Promise is either pending, fulfilled, or rejected', '`.then()` handles success, `.catch()` handles errors', '`.finally()` runs regardless of outcome', '`Promise.all()` waits for all, fails fast on any rejection'] },
    { title: 'Async/Await', points: ['`async` functions always return a Promise', '`await` pauses execution until Promise settles', 'Wrap in `try/catch` to handle errors', 'Much cleaner than nested `.then()` chains'] },
    { title: 'Event Loop', points: ['Call Stack runs synchronous code', 'Web APIs handle async tasks (timers, fetch)', 'Microtask queue (Promises) runs before macrotask queue', 'Event loop checks stack, then microtasks, then macrotasks'] },
  ],
  6: [
    { title: 'DOM Selection', points: ['`getElementById()` — fastest for single element', '`querySelector()` — CSS selector, first match', '`querySelectorAll()` — returns NodeList', '`getElementsByClassName()` — live HTMLCollection'] },
    { title: 'Events', points: ['`addEventListener()` attaches event handlers', 'Event bubbles up from child → parent', 'Event capturing goes parent → child', '`stopPropagation()` stops bubbling'] },
    { title: 'Storage', points: ['`localStorage` persists across sessions', '`sessionStorage` cleared when tab closes', 'Both store strings — use `JSON.stringify/parse`', 'Max ~5MB storage, not for sensitive data'] },
  ],
  7: [
    { title: 'Error Handling', points: ['`try/catch` catches runtime errors', '`finally` always executes', 'Throw custom errors: `throw new Error("msg")`', 'Error types: TypeError, RangeError, SyntaxError'] },
    { title: 'Debugging', points: ['`console.log/warn/error/table` for inspection', '`debugger` statement pauses execution', 'Browser DevTools → Sources → Breakpoints', 'Stack trace shows the call chain to the error'] },
    { title: 'Type Checking', points: ['`typeof` checks primitive types', '`instanceof` checks object constructor', '`Number.isNaN()` is safer than global `isNaN()`', 'Use TypeScript for compile-time type safety'] },
  ],
  8: [
    { title: 'Classes', points: ['`class` is syntactic sugar over prototypes', '`constructor()` runs on instantiation', '`extends` for inheritance, `super()` to call parent', 'Static methods belong to the class, not instances'] },
    { title: 'OOP Principles', points: ['Encapsulation: bundle data + methods', 'Inheritance: child class extends parent', 'Polymorphism: same method, different behavior', 'Abstraction: hide complexity, expose interface'] },
    { title: 'Getters & Setters', points: ['`get` keyword defines a getter property', '`set` keyword defines a setter property', 'Allows computed properties with dot notation', 'Useful for validation on property assignment'] },
  ],
  9: [
    { title: 'Advanced Functions', points: ['Currying: `f(a)(b)` instead of `f(a,b)`', 'Memoization: cache results of expensive calls', 'Throttle: limit calls per time period', 'Debounce: delay until no more events'] },
    { title: 'Symbols & Iterators', points: ['`Symbol()` creates a unique, immutable identifier', 'Symbols as object keys avoid name collisions', 'Iterators implement `Symbol.iterator` protocol', '`for...of` uses the iterator protocol'] },
    { title: 'Proxies', points: ['`Proxy` wraps an object and intercepts operations', 'Useful for validation, logging, reactive state', '`Reflect` provides default behavior for trapped ops', 'The basis of Vue 3 reactivity system'] },
  ],
  10: [
    { title: 'call, apply, bind', points: ['All three explicitly set `this`', '`call(thisArg, arg1, arg2)` — invokes immediately', '`apply(thisArg, [args])` — invokes with array', '`bind(thisArg)` — returns a new bound function'] },
    { title: 'Generators', points: ['`function*` defines a generator', '`yield` pauses and returns a value', '`next()` resumes execution', 'Supports lazy evaluation of sequences'] },
    { title: 'Memory & Performance', points: ['Memory leak: references prevent garbage collection', 'GC automatically frees unreachable objects', 'JIT: JS engines compile hot code to machine code', 'Avoid excessive closures holding large data'] },
  ],
};

const MAX_FREE_ATTEMPTS = 2;

export default function JSQuizApp() {
  const [db, setDb] = useState<Firestore | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [globalStats, setGlobalStats] = useState<GlobalStats>({ maxScore: 0, highestLevel: 1 });
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
  const [availableWallets, setAvailableWallets] = useState<string[]>([]);
  const [walletError, setWalletError] = useState<string | null>(null);

  // Attempt tracking & social unlock
  const [levelAttempts, setLevelAttempts] = useState<Record<number, number>>({});
  const [levelScores, setLevelScores] = useState<Record<number, number>>({});
  const [showSocialModal, setShowSocialModal] = useState(false);
  const [socialUnlocked, setSocialUnlocked] = useState<Record<number, boolean>>({});

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

      // Load attempts, scores, social unlocks
      try {
        const savedAttempts = localStorage.getItem('quizAttempts');
        if (savedAttempts) setLevelAttempts(JSON.parse(savedAttempts));
        const savedScores = localStorage.getItem('quizScores');
        if (savedScores) setLevelScores(JSON.parse(savedScores));
        const savedSocial = localStorage.getItem('quizSocialUnlocked');
        if (savedSocial) setSocialUnlocked(JSON.parse(savedSocial));
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

  // ✅ NEW: Detect available wallets on component mount with retry
  useEffect(() => {
    // Function to check and set available wallets
    const checkWallets = () => {
      const wallets = getAvailableWallets();
      setAvailableWallets(wallets);

      // Check if wallet is already connected (e.g., from previous session)
      const checkConnected = async () => {
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

      if (typeof window !== 'undefined') {
        checkConnected();
      }
    };

    // Check immediately
    checkWallets();

    // Also check after a delay to catch MetaMask injection
    const timer = setTimeout(checkWallets, 1000);

    // Listen for ethereum availability changes
    const handleEthereumReady = () => {
      checkWallets();
    };

    if (typeof window !== 'undefined' && (window as any).ethereum) {
      (window as any).ethereum.on?.('connect', handleEthereumReady);
      (window as any).ethereum.on?.('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setConnectedAddress(accounts[0]);
        } else {
          setConnectedAddress(null);
        }
      });
    }

    return () => {
      clearTimeout(timer);
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        (window as any).ethereum.removeListener?.('connect', handleEthereumReady);
      }
    };
  }, []);

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
      const newAttempts = { ...levelAttempts, [currentLevel]: (levelAttempts[currentLevel] || 0) + 1 };
      setLevelAttempts(newAttempts);
      localStorage.setItem('quizAttempts', JSON.stringify(newAttempts));

      const newScores = { ...levelScores, [currentLevel]: Math.max(levelScores[currentLevel] || 0, score) };
      setLevelScores(newScores);
      localStorage.setItem('quizScores', JSON.stringify(newScores));

      if (passed) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#6366f1', '#a855f7', '#f43f5e']
        });
        setAutoProgressing(true);
        await userCompleteLevel(score); // Save current score on-chain
      }
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  }, [isLastQuestion, score, userCompleteLevel, levelAttempts, levelScores, currentLevel]);

  const startQuiz = useCallback((level: number) => {
    const attempts = levelAttempts[level] || 0;
    const unlocked = socialUnlocked[level];
    if (attempts >= MAX_FREE_ATTEMPTS && !unlocked) {
      setCurrentLevel(level);
      setShowSocialModal(true);
      return;
    }
    setCurrentLevel(level);
    setTxStatus("");
    setLevelPassed(false);
    setQuizState('in_progress');
    setShowMetaMaskHelp(false);
  }, [levelAttempts, socialUnlocked]);

  const handleSocialUnlock = useCallback((level: number) => {
    // Simulate social share — open Twitter share
    const tweetText = encodeURIComponent(`🚀 I'm mastering JavaScript Level ${level} on JAZZMINI Quiz! Test your JS skills at`);
    const tweetUrl = encodeURIComponent('https://base-jsquiz.vercel.app');
    window.open(`https://twitter.com/intent/tweet?text=${tweetText}&url=${tweetUrl}`, '_blank');
    // Unlock after social share
    setTimeout(() => {
      const newUnlocked = { ...socialUnlocked, [level]: true };
      setSocialUnlocked(newUnlocked);
      localStorage.setItem('quizSocialUnlocked', JSON.stringify(newUnlocked));
      setShowSocialModal(false);
      // Reset attempt count for this level
      const newAttempts = { ...levelAttempts, [level]: 0 };
      setLevelAttempts(newAttempts);
      localStorage.setItem('quizAttempts', JSON.stringify(newAttempts));
    }, 1500);
  }, [socialUnlocked, levelAttempts]);

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
                Master JS with 2 attempts per level. Score {PASS_THRESHOLD}/{QUESTIONS_PER_LEVEL} to progress.
              </p>
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
                    <p className="text-sm font-bold text-emerald-500">Connected</p>
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
                    className="w-full py-4 bg-gradient-premium hover:shadow-xl hover:shadow-primary/40 rounded-xl text-white font-bold flex items-center justify-center gap-2 transition-all group"
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
            <div className="flex flex-wrap gap-2 justify-center">
              {[...Array(TOTAL_LEVELS)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setLearningLevel(i + 1)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${learningLevel === i + 1
                    ? 'bg-primary text-white'
                    : 'glass-card text-slate-500 hover:text-primary'
                    }`}
                >
                  Lvl {i + 1}
                </button>
              ))}
            </div>

            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-black text-primary uppercase tracking-tighter">Level {learningLevel}: {LEVEL_TOPICS[learningLevel - 1]}</h2>
                <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Master the Core Concepts</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {LEARNING_CONTENT[learningLevel]?.map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="p-6 glass-card border-l-4 border-primary"
                  >
                    <h4 className="font-black text-lg mb-3 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      {item.title}
                    </h4>
                    <ul className="space-y-2">
                      {item.points.map((p, pIdx) => (
                        <li key={pIdx} className="text-sm text-slate-400 flex gap-2">
                          <span className="text-primary">•</span>
                          {p.replace(/`([^`]+)`/g, (m, c) => `(${c})`)}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                ))}
              </div>

              <button
                onClick={() => {
                  setActiveTab('quiz');
                  startQuiz(learningLevel);
                }}
                className="w-full py-4 bg-gradient-premium rounded-2xl text-white font-black uppercase tracking-widest shadow-xl shadow-primary/20"
              >
                Start Level {learningLevel} Challenge
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
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Best Accuracy</p>
                <p className="text-4xl font-black text-emerald-500">
                  {Math.round((Object.values(levelScores).reduce((a, b) => a + b, 0) / (Object.keys(levelScores).length * 10 || 1)) * 100)}%
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
                          <p className="text-[10px] font-mono opacity-50">{score}/10 pts</p>
                        </div>
                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${score * 10}%` }}
                            className="h-full bg-primary"
                          />
                        </div>
                      </div>
                      <div className="w-20 text-right">
                        <p className="text-[10px] font-black uppercase text-slate-500">Attempts</p>
                        <p className="font-mono text-sm">{attempts}</p>
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

                  <div className="space-y-2">
                    <h2 className="text-3xl font-black text-emerald-500">Domain Mastered!</h2>
                    <p className={`font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      You conquered Level {currentLevel} with a score of <span className="text-emerald-500 font-black">{score}/{QUESTIONS_PER_LEVEL}</span>
                    </p>
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

                  <div className="flex flex-col gap-3">
                    {!txStatus || txStatus.includes('❌') ? (
                      <button
                        onClick={() => userCompleteLevel(score)}
                        className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all"
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
                    className="w-full py-4 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl shadow-lg shadow-rose-500/20 transition-all"
                  >
                    Retry Challenge
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

        {/* Social Modal */}
        <AnimatePresence>
          {showSocialModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowSocialModal(false)}
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-sm glass-card p-8 text-center space-y-6 overflow-hidden"
              >
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-premium" />
                <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center">
                  <Lock className="w-8 h-8 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black uppercase tracking-tighter">Attempts Exhausted</h3>
                  <p className="text-slate-400 text-sm">
                    You've used your 2 free attempts for Level {currentLevel}. Share your progress on X (Twitter) to unlock 2 more!
                  </p>
                </div>
                <div className="space-y-3">
                  <button
                    onClick={() => handleSocialUnlock(currentLevel)}
                    className="w-full py-4 bg-[#1DA1F2] hover:bg-[#1a91da] text-white font-black rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#1DA1F2]/20"
                  >
                    Share on X to Unlock
                  </button>
                  <button
                    onClick={() => setShowSocialModal(false)}
                    className="w-full py-3 text-slate-500 text-xs font-bold uppercase tracking-widest hover:text-white transition-all"
                  >
                    Maybe Later
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
