"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged
} from 'firebase/auth';
import {
  getDatabase,
  ref,
  set,
  onValue,
  remove,
  onDisconnect,
  Database,
  serverTimestamp,
  limitToFirst,
  query as dbQuery
} from 'firebase/database';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Code2, Sparkles, Zap, Brain, ChevronRight } from 'lucide-react';
import { useAccount, useSendTransaction, useConnect, useDisconnect } from 'wagmi';
import { parseEther, parseUnits } from 'viem';

// Project imports
import { QUIZ_DATA } from './quizData';
import { getTodaysDailyQuestion, getTodayDateKey, DailyQuestion } from './dailyQuizData';
import {
  QuizQuestion,
  GlobalStats,
  EthereumProvider,
  QUESTIONS_PER_LEVEL,
  TOTAL_LEVELS,
  PASS_THRESHOLD,
  MAX_FREE_ATTEMPTS
} from './types';

// Components
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { QuizView } from './components/QuizView';
import { QuizResult } from './components/QuizResult';
import { DailyArena } from './components/DailyArena';
import { DailyQuiz } from './components/DailyQuiz';
import { LearningHub } from './components/LearningHub';
import { LeaderboardTable } from './components/LeaderboardTable';
import { PaymentModal } from './components/PaymentModal';
import { Footer } from './components/Footer';
import { DailyGMIntro } from './components/DailyGMIntro';
import { AIAssistant } from './components/AIAssistant';
import { WeeklyBaseQuiz } from './components/WeeklyBaseQuiz';
import { BaseLearning } from './components/BaseLearning';
import { BaseAIAssistant } from './components/BaseAIAssistant';
import { useGsapButtons } from './hooks/useGsapButtons';

// --- Farcaster SDK ---
let sdk: any = null;
const loadSdk = async () => {
  if (typeof window !== 'undefined') {
    try {
      const module = await import('@farcaster/miniapp-sdk');
      sdk = module.sdk;
      return true;
    } catch (e) {
      console.warn('Farcaster SDK loading failed');
    }
  }
  return false;
};

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "https://myproj-7d380-default-rtdb.firebaseio.com/"
};

const appId = 'js-level-quiz-default';
const PUBLIC_COLLECTION_PATH = `artifacts/${appId}/stats`;
const GLOBAL_STATS_DOC_ID = 'global_progress';

const QUIZ_CONTRACT_ADDRESS = '0x0881e4c7b81dC36Fc4Fc1c82cE0e97bBB0134F93';
const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

// Helpers
const isValidAddress = (address: string): boolean => /^0x[0-9a-fA-F]{40}$/.test(address);

const getWalletProvider = (): EthereumProvider | null => {
  if (typeof window === 'undefined') return null;
  try {
    if (sdk?.wallet?.ethProvider?.request) return sdk.wallet.ethProvider;
  } catch (e) { }
  return (window as any).ethereum || (window as any).MetaMask || null;
};

const getAvailableWallets = (): string[] => {
  if (typeof window === 'undefined') return [];
  const eth = (window as any).ethereum;
  if (!eth) return [];
  const wallets = [];
  if (eth.isMetaMask) wallets.push('MetaMask');
  if (eth.isCoinbaseBrowser) wallets.push('Coinbase Wallet');
  if (eth.isBase) wallets.push('Base App');
  return wallets.length > 0 ? wallets : ['Browser Wallet'];
};

const encodeFunctionCall = (functionSignature: string, params: any[]): string => {
  if (functionSignature !== 'completeLevel') throw new Error('Unsupported function');
  const [level, score] = params;
  return '0x7166164f' + level.toString(16).padStart(64, '0') + score.toString(16).padStart(64, '0');
};

export default function JSQuizApp() {
  // State
  const [db, setDb] = useState<Database | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [globalStats, setGlobalStats] = useState<GlobalStats>({ maxScore: 0, highestLevel: 1 });
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [authReady, setAuthReady] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [themeLoaded, setThemeLoaded] = useState(false);
  const [sdkLoaded, setSdkLoaded] = useState(false);

  const [currentLevel, setCurrentLevel] = useState(1);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [quizState, setQuizState] = useState<'start' | 'in_progress' | 'result'>('start');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [levelPassed, setLevelPassed] = useState(false);

  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const [basename, setBasename] = useState<string | null>(null);
  const [farcasterUser, setFarcasterUser] = useState<any>(null);
  const [walletError, setWalletError] = useState<string | null>(null);

  const [levelAttempts, setLevelAttempts] = useState<Record<number, number>>({});
  const [levelScores, setLevelScores] = useState<Record<number, number>>({});
  const [baseQuizScores, setBaseQuizScores] = useState<Record<number, number>>({});
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paidLevels, setPaidLevels] = useState<Record<number, boolean>>({});

  const [isBaseAiOpen, setIsBaseAiOpen] = useState(false);

  const [rewardStatus, setRewardStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [rewardTxHash, setRewardTxHash] = useState<string | null>(null);
  const [supportStatus, setSupportStatus] = useState<'idle' | 'pending' | 'success' | 'skipped' | 'error'>('idle');

  const [dailyStreak, setDailyStreak] = useState(0);
  const [dailyPoints, setDailyPoints] = useState(0);
  const [lastGmDate, setLastGmDate] = useState<string | null>(null);
  const [gmDoneToday, setGmDoneToday] = useState(false);
  const [showDailyQuiz, setShowDailyQuiz] = useState(false);
  const [showGmIntro, setShowGmIntro] = useState(false);
  const [dailyQuizAnswer, setDailyQuizAnswer] = useState<string | null>(null);
  const [dailyQuizResult, setDailyQuizResult] = useState<'correct' | 'wrong' | null>(null);
  const [streakMissed, setStreakMissed] = useState(false);
  const [streakRecoveryStatus, setStreakRecoveryStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [claimStatus, setClaimStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [todayQuestion, setTodayQuestion] = useState<DailyQuestion | null>(null);

  const [activeTab, setActiveTab] = useState<'quiz' | 'daily' | 'learn' | 'dashboard' | 'leaderboard' | 'base'>('quiz');
  const [baseSubTab, setBaseSubTab] = useState<'quiz' | 'learn' | 'ai'>('quiz');
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [learningLevel, setLearningLevel] = useState(1);
  
  const [dailyPaymentStatus, setDailyPaymentStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [dailyPaymentTx, setDailyPaymentTx] = useState<string | null>(null);
  
  // Wagmi hooks
  const { address: wagmiAddress, isConnected } = useAccount();
  const { sendTransactionAsync } = useSendTransaction();

  // Sync connected address with wagmi
  useEffect(() => {
    if (wagmiAddress) setConnectedAddress(wagmiAddress);
    else if (!isConnected) setConnectedAddress(null);
  }, [wagmiAddress, isConnected]);

  const quizStateRef = useRef(quizState);

  // ═══ GSAP global button enhancements ═══
  useGsapButtons();

  // Keep ref in sync
  useEffect(() => {
    quizStateRef.current = quizState;
  }, [quizState]);

  // Persistence Effects
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedTheme = localStorage.getItem('quizTheme');
    if (savedTheme === 'light') setIsDarkMode(false);
    setThemeLoaded(true);

    try {
      const savedAttempts = localStorage.getItem('quizAttempts');
      if (savedAttempts) setLevelAttempts(JSON.parse(savedAttempts));
      const savedScores = localStorage.getItem('quizScores');
      if (savedScores) setLevelScores(JSON.parse(savedScores));
      const savedBaseScores = localStorage.getItem('baseQuizCompleted');
      if (savedBaseScores) setBaseQuizScores(JSON.parse(savedBaseScores));
      const savedPaid = localStorage.getItem('quizPaidLevels');
      if (savedPaid) setPaidLevels(JSON.parse(savedPaid));
      const savedStats = localStorage.getItem('globalStats');
      if (savedStats) {
        const stats = JSON.parse(savedStats);
        setGlobalStats(stats);
        if (stats.highestLevel) setCurrentLevel(stats.highestLevel);
      }
    } catch { }

    loadSdk().then(loaded => setSdkLoaded(loaded));

    const today = getTodayDateKey();
    const savedStreak = parseInt(localStorage.getItem('dailyStreak') || '0', 10);
    const savedDailyPoints = parseInt(localStorage.getItem('dailyPoints') || '0', 10);
    const savedLastGm = localStorage.getItem('lastGmDate');
    const savedDailyDone = localStorage.getItem('dailyQuizDone');

    setDailyStreak(savedStreak);
    setDailyPoints(savedDailyPoints);
    if (savedLastGm) setLastGmDate(savedLastGm);
    if (savedLastGm === today) setGmDoneToday(true);
    else if (savedLastGm && savedStreak > 0) {
      if (Math.floor((new Date(today).getTime() - new Date(savedLastGm).getTime()) / 86400000) > 1) setStreakMissed(true);
    }

    if (savedDailyDone === today) {
      setDailyQuizAnswer('done');
      setDailyQuizResult(localStorage.getItem('dailyQuizResult') as any);
    }
    setTodayQuestion(getTodaysDailyQuestion());
  }, []);

  useEffect(() => {
    if (themeLoaded) localStorage.setItem('quizTheme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode, themeLoaded]);

  // Firebase Init
  useEffect(() => {
    try {
      const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
      setDb(getDatabase(app));
      const unsubscribe = onAuthStateChanged(getAuth(app), (user) => {
        if (user) {
          setUserId(user.uid);
          localStorage.setItem('quizUserId', user.uid);
        } else {
          const cachedId = localStorage.getItem('quizUserId');
          if (cachedId) {
            setUserId(cachedId);
          } else {
            signInAnonymously(getAuth(app)).catch(() => {
              const newId = `local-${crypto.randomUUID()}`;
              setUserId(newId);
              localStorage.setItem('quizUserId', newId);
            });
          }
        }
        setAuthReady(true);
      });
      return () => unsubscribe();
    } catch (e) {
      const cachedId = localStorage.getItem('quizUserId') || `local-${crypto.randomUUID()}`;
      setUserId(cachedId);
      localStorage.setItem('quizUserId', cachedId);
      setAuthReady(true);
    }
  }, []);

  // Sync Per-User Stats from RTDB
  useEffect(() => {
    if (!authReady || !db) return;
    const id = (connectedAddress || userId || '').toLowerCase();
    if (!id) return;
    const userRef = ref(db, `users/${id}/progress`);
    return onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const stats = { maxScore: data.maxScore || 0, highestLevel: data.highestLevel || 1 };

        setGlobalStats(stats);
        localStorage.setItem('globalStats', JSON.stringify(stats));

        // Auto-set currentLevel to highestLevel if the user is on the start screen
        // Use the ref to avoid stale closure in the onValue callback
        if (quizStateRef.current === 'start') {
          setCurrentLevel(stats.highestLevel);
        }

        if (data.levelScores) setLevelScores(data.levelScores);
        if (data.levelAttempts) setLevelAttempts(data.levelAttempts);
      }
    });
  }, [authReady, db, userId, connectedAddress]);

  // Wallet Connection Logic
  useEffect(() => {
    const tryAutoConnect = async () => {
      try {
        if (sdk?.wallet?.ethProvider?.request) {
          try {
            const accounts = await sdk.wallet.ethProvider.request({ method: 'eth_requestAccounts' });
            if (accounts?.[0]) {
              setConnectedAddress(accounts[0]);
              return;
            }
          } catch (e) {
            console.log("Farcaster SDK auto-connect skipped, falling back...");
          }
        }
        const fallbackProvider = (window as any).ethereum || (window as any).MetaMask;
        if (fallbackProvider) {
          const accounts = await fallbackProvider.request({ method: 'eth_accounts' });
          if (accounts?.[0]) setConnectedAddress(accounts[0]);
        }
      } catch (e) { }
    };
    if (sdkLoaded || typeof window !== 'undefined') {
      tryAutoConnect();
    }
  }, [sdkLoaded]);

  // Identity fetch: Basename & Farcaster
  useEffect(() => {
    if (!connectedAddress) { setBasename(null); return; }

    // Fetch Basename
    fetch(`https://base.blockscout.com/api/v2/addresses/${connectedAddress}/names`)
      .then(res => res.json())
      .then(data => {
        const baseName = data?.items?.find((i: any) => i.name.endsWith('.base'))?.name;
        if (baseName) setBasename(baseName);
      }).catch(() => { });

    // Fetch Farcaster Identity via Neynar
    const fetchFarcaster = async () => {
      try {
        const neynarKey = process.env.NEXT_PUBLIC_NEYNAR_API_KEY || '13513AE1-F1E5-415E-A3BC-227D59596E4E';
        const res = await fetch(`https://api.neynar.com/v2/farcaster/user/bulk-by-address?addresses=${connectedAddress.toLowerCase()}`, {
          headers: {
            'x-api-key': neynarKey,
            'accept': 'application/json'
          }
        });
        const data = await res.json();

        if (data && data[connectedAddress.toLowerCase()] && data[connectedAddress.toLowerCase()].length > 0) {
          const userObj = data[connectedAddress.toLowerCase()][0];
          setFarcasterUser({
            fid: userObj.fid,
            username: userObj.username,
            display_name: userObj.display_name,
            pfp_url: userObj.pfp_url
          });
        }
      } catch (err) {
        console.warn("Farcaster identity fetch failed", err);
      }
    };
    fetchFarcaster();
  }, [connectedAddress]);
  // Live Leaderboard sync - Realtime DB style
  useEffect(() => {
    if (!db) return;
    const lbRef = ref(db, 'leaderboard');

    console.log("Leaderboard: Setting up Realtime DB listener...");
    const unsubscribe = onValue(lbRef, (snapshot) => {
      if (!snapshot.exists()) {
        console.warn("RTDB: 'leaderboard' path is empty");
        setLeaderboard([]);
        return;
      }

      const rawData = snapshot.val();
      const allData = Object.keys(rawData).map(key => ({ id: key, ...rawData[key] }));
      console.log(`Leaderboard Success: Found ${allData.length} records in Realtime DB`);
      const topPlayers = allData
        .sort((a: any, b: any) => (Number(b.totalPoints) || 0) - (Number(a.totalPoints) || 0))
        .slice(0, 15);

      console.log(`Leaderboard Processed: Total Top Players = ${topPlayers.length}`);
      setLeaderboard(topPlayers);
    });

    return () => unsubscribe();
  }, [db]);

  // Online Presence Tracking
  useEffect(() => {
    if (!db || !userId) return;
    const presenceId = (connectedAddress || userId).toLowerCase().replace(/[^a-z0-9]/g, '_');
    const presenceRef = ref(db, `presence/${presenceId}`);
    const connectedRef = ref(db, '.info/connected');

    const unsubscribeConn = onValue(connectedRef, (snap) => {
      if (snap.val() === true) {
        // Write presence when connected
        set(presenceRef, { online: true, lastSeen: Date.now() });
        // Auto-remove when disconnected
        onDisconnect(presenceRef).remove();
      }
    });

    // Count online users
    const allPresenceRef = ref(db, 'presence');
    const unsubscribePresence = onValue(allPresenceRef, (snap) => {
      if (snap.exists()) {
        setOnlineCount(Object.keys(snap.val()).length);
      } else {
        setOnlineCount(0);
      }
    });

    return () => {
      unsubscribeConn();
      unsubscribePresence();
      // Clean up presence on component unmount
      remove(presenceRef).catch(() => {});
    };
  }, [db, userId, connectedAddress]);

  // Logic Handlers
  const sendEthPayment = useCallback(async (amountInWei: string) => {
    try {
      const hash = await sendTransactionAsync({
        to: QUIZ_CONTRACT_ADDRESS as `0x${string}`,
        value: BigInt(amountInWei),
      });
      return hash;
    } catch (e: any) {
      console.error("ETH Payment failed:", e);
      throw e;
    }
  }, [sendTransactionAsync]);

  const sendPayment = useCallback(async (amountInWei: number) => {
    try {
      // Manual data encoding for ERC20 transfer if using sendTransaction
      // a9059cbb is transfer(address,uint256)
      const dataStr = ('0xa9059cbb' + QUIZ_CONTRACT_ADDRESS.slice(2).padStart(64, '0') + amountInWei.toString(16).padStart(64, '0')) as `0x${string}`;
      
      const hash = await sendTransactionAsync({
        to: USDC_BASE as `0x${string}`,
        data: dataStr,
      });
      return hash;
    } catch (e: any) {
      console.error("USDC Payment failed:", e);
      throw e;
    }
  }, [sendTransactionAsync]);

  const updateLeaderboard = useCallback(async (isPaid: boolean = false, customTotal?: number, customStreak?: number) => {
    try {
      if (!db || !connectedAddress) return; // Only wallet-connected users on leaderboard
      const id = connectedAddress.toLowerCase();
      
      const classicPoints = Object.values(levelScores).reduce((a, b: any) => a + b, 0);
      const basePoints = Object.values(baseQuizScores).reduce((a, b: any) => a + b, 0);
      const totalPoints = customTotal !== undefined ? customTotal : (classicPoints + basePoints + dailyPoints);
      
      const currentStreak = customStreak !== undefined ? customStreak : dailyStreak;

      const payload = {
        address: connectedAddress.toLowerCase(),
        basename: basename || connectedAddress.slice(0, 8),
        totalPoints,
        highestLevel: globalStats.highestLevel,
        streak: currentStreak,
        isPaid: isPaid || !!paidLevels[currentLevel],
        lastUpdated: new Date().toISOString(),
        ...(farcasterUser ? { fid: farcasterUser.fid, username: farcasterUser.username, displayName: farcasterUser.display_name, pfp: farcasterUser.pfp_url } : {})
      };

      console.log("Saving to RTDB:", id, payload);
      const playerRef = ref(db, `leaderboard/${id}`);
      await set(playerRef, payload);
      console.log("RTDB Update Success!");
    } catch (err) {
      console.error("RTDB Update Failed:", err);
    }
  }, [db, connectedAddress, userId, basename, levelScores, baseQuizScores, globalStats, dailyStreak, dailyPoints, farcasterUser, paidLevels, currentLevel]);

  // Auto-update leaderboard for current user
  useEffect(() => {
    if (db && (connectedAddress || userId)) {
      updateLeaderboard();
    }
  }, [db, connectedAddress, userId, updateLeaderboard]);

  const connectWallet = useCallback(async () => {
    try {
      if (sdk?.actions?.signIn) {
        try {
          const res = await sdk.actions.signIn({ nonce: "jazzmini-" + Math.floor(Math.random() * 1000000) });
          if (res?.user) {
            setFarcasterUser(res.user);
            const addr = (res.user.verifications?.[0] || res.user.custody_address).toLowerCase();
            setConnectedAddress(addr);
            if (res.user.username) setBasename(res.user.username + ".fc");
            updateLeaderboard();
            return;
          }
        } catch (sdkError) {
          console.log("Farcaster SDK sign-in unavailable or aborted, falling back to standard web3...");
        }
      }

      const fallbackProvider = (window as any).ethereum || (window as any).MetaMask;
      if (!fallbackProvider) {
        throw new Error("No wallet provider found. Please install MetaMask or use a web3 browser.");
      }
      const accounts = await fallbackProvider.request({ method: 'eth_requestAccounts' });
      if (accounts?.[0]) {
        setConnectedAddress(accounts[0].toLowerCase());
        updateLeaderboard();
      }
    } catch (e: any) {
      console.error(e);
      setWalletError(e.message || 'Failed to connect wallet.');
    }
  }, [updateLeaderboard]);

  const startQuiz = useCallback((level: number) => {
    const attempts = levelAttempts[level] || 0;
    if (attempts >= MAX_FREE_ATTEMPTS && !paidLevels[level] && level > 1) {
      setShowPaymentModal(true);
      return;
    }
    setCurrentLevel(level);
    setCurrentQuestionIndex(0);
    setScore(0);
    setQuizState('in_progress');
  }, [levelAttempts, paidLevels]);

  const handleOptionSelect = useCallback((opt: string) => {
    if (selectedOption) return;
    setSelectedOption(opt);
    const correct = opt === QUIZ_DATA.filter(q => q.level === currentLevel)[currentQuestionIndex].answer;
    if (correct) {
      setScore(s => s + 10);
    }
    setShowExplanation(true);
  }, [currentLevel, currentQuestionIndex, selectedOption]);

  const handleNextQuestion = useCallback(async () => {
    setSelectedOption(null);
    setShowExplanation(false);
    const questions = QUIZ_DATA.filter(q => q.level === currentLevel);
    if (currentQuestionIndex === questions.length - 1) {
      const passed = score >= (PASS_THRESHOLD * 10);
      setLevelPassed(passed);
      setQuizState('result');

      const newAttempts = { ...levelAttempts, [currentLevel]: (levelAttempts[currentLevel] || 0) + 1 };
      setLevelAttempts(newAttempts);
      localStorage.setItem('quizAttempts', JSON.stringify(newAttempts));

      if (passed) {
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#0052FF', '#00C2FF', '#FFFFFF'] });
        const newScores = { ...levelScores, [currentLevel]: Math.max(levelScores[currentLevel] || 0, score) };
        setLevelScores(newScores);
        localStorage.setItem('quizScores', JSON.stringify(newScores));

        if (currentLevel === globalStats.highestLevel && currentLevel < TOTAL_LEVELS) {
          const nextLevel = currentLevel + 1;
          const id = (connectedAddress || userId || '').toLowerCase();
          const userRef = ref(db!, `users/${id}/progress`);
          const newStats = { maxScore: Math.max(globalStats.maxScore, score), highestLevel: nextLevel, levelScores: newScores, levelAttempts: { ...levelAttempts, [currentLevel]: (levelAttempts[currentLevel] || 0) + 1 } };
          const localStats = { maxScore: newStats.maxScore, highestLevel: newStats.highestLevel };
          setGlobalStats(localStats);
          localStorage.setItem('globalStats', JSON.stringify(localStats));
          await set(userRef, newStats);
        }

        const newTotalPoints = Object.values(newScores).reduce((a, b: any) => a + b, 0) + Object.values(baseQuizScores).reduce((a, b: any) => a + b, 0) + dailyPoints;
        updateLeaderboard(paidLevels[1] || false, newTotalPoints);
      }
    } else {
      setCurrentQuestionIndex(p => p + 1);
    }
  }, [currentLevel, currentQuestionIndex, score, levelAttempts, levelScores, globalStats, db, updateLeaderboard, paidLevels]);

  const handleUnlockLevel = useCallback(async () => {
    setPaymentStatus('pending');
    try {
      const tx = await sendPayment(50000); // 0.05 USDC
      if (tx) {
        const newPaid = { ...paidLevels, [currentLevel]: true };
        setPaidLevels(newPaid);
        localStorage.setItem('quizPaidLevels', JSON.stringify(newPaid));
        setPaymentStatus('success');
        setTimeout(() => { setShowPaymentModal(false); startQuiz(currentLevel); }, 1500);
      }
    } catch (e: any) {
      setPaymentStatus('error');
      setPaymentError(e.message || 'Payment failed');
    }
  }, [currentLevel, paidLevels, startQuiz, sendPayment]);

  const handleLevel1Reward = useCallback(async () => {
    setRewardStatus('pending');
    try {
      const tx = await sendPayment(30000); // 0.03 USDC
      if (tx) {
        setRewardTxHash(tx);
        setRewardStatus('success');
        const newPaid = { ...paidLevels, 1: true };
        setPaidLevels(newPaid);
        localStorage.setItem('quizPaidLevels', JSON.stringify(newPaid));
        updateLeaderboard(true);
      }
    } catch (e) {
      setRewardStatus('error');
    }
  }, [paidLevels, updateLeaderboard, sendPayment]);

  const handleSupportPayment = useCallback(async () => {
    setSupportStatus('pending');
    try {
      const tx = await sendPayment(30000); // 0.03 USDC
      if (tx) {
        setSupportStatus('success');
        updateLeaderboard(true);
      }
    } catch (e) {
      setSupportStatus('error');
    }
  }, [updateLeaderboard, sendPayment]);

  const handleQuizClaim = useCallback(async () => {
    setClaimStatus('pending');
    try {
      const tx = await sendPayment(30000); // 0.03 USDC
      if (tx) {
        setClaimStatus('success');
        setLevelPassed(true);
        // Sync progress
        const newScores = { ...levelScores, [currentLevel]: Math.max(levelScores[currentLevel] || 0, score || 70) };
        setLevelScores(newScores);
        localStorage.setItem('quizScores', JSON.stringify(newScores));

        if (currentLevel === globalStats.highestLevel && currentLevel < TOTAL_LEVELS) {
          const nextLevel = currentLevel + 1;
          const id = (connectedAddress || userId || '').toLowerCase();
          const userRef = ref(db!, `users/${id}/progress`);
          const newStats = {
            maxScore: Math.max(globalStats.maxScore, score || 70),
            highestLevel: nextLevel,
            levelScores: newScores,
            levelAttempts: levelAttempts
          };
          setGlobalStats({ maxScore: newStats.maxScore, highestLevel: newStats.highestLevel });
          await set(userRef, newStats);
        }
        updateLeaderboard(true);
      }
    } catch (e) {
      setClaimStatus('error');
    }
  }, [sendPayment, currentLevel, levelScores, score, globalStats, db, connectedAddress, userId, levelAttempts, updateLeaderboard]);

  const handleGm = useCallback(() => {
    const today = getTodayDateKey();
    setGmDoneToday(true);
    setLastGmDate(today);
    localStorage.setItem('lastGmDate', today);
    setShowGmIntro(true); // Show intro instead of immediate quiz
    // Notify leaderboard of activity
    updateLeaderboard(paidLevels[1] || false);
  }, [updateLeaderboard, paidLevels]);

  const handleDailyPayment = useCallback(async () => {
    setDailyPaymentStatus('pending');
    try {
      const tx = await sendPayment(10000); // 0.01 USDC
      if (tx) {
        setDailyPaymentTx(tx);
        setDailyPaymentStatus('success');
        updateLeaderboard(paidLevels[1] || false);
      }
    } catch (e) {
      setDailyPaymentStatus('error');
    }
  }, [sendPayment, updateLeaderboard, paidLevels]);

  const handleDailyAnswer = useCallback((opt: string) => {
    if (dailyQuizAnswer === 'done' || dailyQuizAnswer === opt) return; // Prevent double trigger
    setDailyQuizAnswer(opt);
    const correct = opt === todayQuestion?.answer;
    setDailyQuizResult(correct ? 'correct' : 'wrong');
    const today = getTodayDateKey();
    localStorage.setItem('dailyQuizDone', today);
    localStorage.setItem('dailyQuizResult', correct ? 'correct' : 'wrong');

    if (correct) {
      const newStreak = dailyStreak + 1;
      setDailyStreak(newStreak);
      localStorage.setItem('dailyStreak', newStreak.toString());

      const newDailyPoints = dailyPoints + 10; // 10 points for daily quiz success
      setDailyPoints(newDailyPoints);
      localStorage.setItem('dailyPoints', newDailyPoints.toString());

      const basePoints = Object.values(levelScores).reduce((a, b: any) => a + b, 0);
      const newTotal = basePoints + newDailyPoints;

      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      updateLeaderboard(paidLevels[1] || false, newTotal, newStreak);
    } else {
      localStorage.setItem('savedBrokenStreak', dailyStreak.toString());
      setDailyStreak(0);
      localStorage.setItem('dailyStreak', '0');
      const currentTotal = Object.values(levelScores).reduce((a, b: any) => a + b, 0) + dailyPoints;
      updateLeaderboard(paidLevels[1] || false, currentTotal, 0);
    }
  }, [dailyStreak, dailyPoints, todayQuestion, updateLeaderboard, paidLevels, levelScores, dailyQuizAnswer]);

  const handleStreakRestore = useCallback(async () => {
    setStreakRecoveryStatus('pending');
    try {
      const tx = await sendPayment(30000); // 0.03 USDC
      if (tx) {
        setStreakRecoveryStatus('success');
        setStreakMissed(false);
        const today = getTodayDateKey();
        localStorage.setItem('lastGmDate', today);
        
        const savedBroken = localStorage.getItem('savedBrokenStreak');
        if (savedBroken) {
          const restoredStreak = parseInt(savedBroken, 10);
          setDailyStreak(restoredStreak);
          localStorage.setItem('dailyStreak', restoredStreak.toString());
          localStorage.removeItem('savedBrokenStreak');
          
          const currentTotal = Object.values(levelScores).reduce((a, b: any) => a + b, 0) + dailyPoints + Object.values(baseQuizScores).reduce((a, b: any) => a + b, 0);
          updateLeaderboard(paidLevels[1] || false, currentTotal, restoredStreak);
        }
      }
    } catch (e) {
      setStreakRecoveryStatus('error');
    }
  }, [sendPayment, dailyPoints, levelScores, baseQuizScores, updateLeaderboard, paidLevels]);

  const handleResetStreak = useCallback(() => {
    setDailyStreak(0);
    localStorage.setItem('dailyStreak', '0');
    setStreakMissed(false);
  }, []);

  // JSX Components Mapping
  const renderTabContent = () => {
    switch (activeTab) {
      case 'quiz':
        const questions = QUIZ_DATA.filter(q => q.level === currentLevel);
        if (quizState === 'in_progress') {
          return (
            <QuizView
              currentQuestion={questions[currentQuestionIndex]}
              currentQuestionIndex={currentQuestionIndex}
              totalQuestions={questions.length}
              selectedOption={selectedOption}
              onSelectOption={handleOptionSelect}
              showExplanation={showExplanation}
              onNext={handleNextQuestion}
              onClose={() => setQuizState('start')}
              isLastQuestion={currentQuestionIndex === questions.length - 1}
              isDarkMode={isDarkMode}
            />
          );
        }
        if (quizState === 'result') {
          return (
            <QuizResult
              isDarkMode={isDarkMode}
              levelPassed={levelPassed}
              score={score}
              totalQuestions={questions.length}
              currentLevel={currentLevel}
              rewardStatus={rewardStatus}
              rewardTxHash={rewardTxHash}
              onReward={handleLevel1Reward}
              supportStatus={supportStatus}
              onSupport={handleSupportPayment}
              claimStatus={claimStatus}
              onClaim={handleQuizClaim}
              onRetry={() => { setQuizState('in_progress'); setClaimStatus('idle'); }}
              onNextLevel={() => { startQuiz(currentLevel + 1); setClaimStatus('idle'); }}
              connectedAddress={connectedAddress}
            />
          );
        }
        return (
          <Dashboard
            isDarkMode={isDarkMode}
            globalStats={globalStats}
            connectedAddress={connectedAddress}
            basename={basename}
            connectWallet={connectWallet}
            levelAttempts={levelAttempts}
            onLevelSelect={startQuiz}
            MAX_FREE_ATTEMPTS={MAX_FREE_ATTEMPTS}
            farcasterUser={farcasterUser}
            onOpenAiChat={() => setIsAiOpen(true)}
          />
        );
      case 'daily':
        if (showDailyQuiz && dailyQuizAnswer !== 'done') {
          return (
            <DailyQuiz
              isDarkMode={isDarkMode}
              todayQuestion={todayQuestion}
              dailyQuizAnswer={dailyQuizAnswer}
              dailyQuizResult={dailyQuizResult}
              onAnswer={handleDailyAnswer}
              onClose={() => setShowDailyQuiz(false)}
              paymentStatus={dailyQuizResult === 'correct' ? dailyPaymentStatus : streakRecoveryStatus}
              onPayment={dailyQuizResult === 'correct' ? handleDailyPayment : handleStreakRestore}
              paymentTx={dailyQuizResult === 'correct' ? dailyPaymentTx : null}
            />
          );
        }
        return (
          <DailyArena
            isDarkMode={isDarkMode}
            dailyStreak={dailyStreak}
            lastGmDate={lastGmDate}
            streakMissed={streakMissed}
            streakRecoveryStatus={streakRecoveryStatus}
            onStreakRestore={handleStreakRestore}
            onResetStreak={handleResetStreak}
            gmDoneToday={gmDoneToday}
            onGm={handleGm}
          />
        );
      case 'learn':
        return (
          <LearningHub
            isDarkMode={isDarkMode}
            learningLevel={learningLevel}
            setLearningLevel={setLearningLevel}
            levelAttempts={levelAttempts}
            highestLevel={globalStats.highestLevel}
          />
        );
      case 'base':
        return (
          <div className="space-y-8">
            {/* Base Section Sub-Navigation */}
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xl shadow-lg shadow-blue-500/20">
                  🔵
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">Base Chain</h2>
              </div>
              <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/40 border border-border">
                {[
                  { id: 'quiz' as const, label: '🏆 Weekly Quiz', icon: '🏆' },
                  { id: 'learn' as const, label: '📚 Learn Base', icon: '📚' },
                  { id: 'ai' as const, label: '🤖 Ask AI', icon: '🤖' },
                ].map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => setBaseSubTab(sub.id)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all relative ${
                      baseSubTab === sub.id
                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                        : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                    }`}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Base Sub-Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={baseSubTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                {baseSubTab === 'quiz' && <WeeklyBaseQuiz isDarkMode={isDarkMode} onPayment={sendPayment} onScoreUpdate={(week, score) => {
                    const updated = { ...baseQuizScores, [week]: score };
                    setBaseQuizScores(updated);
                    const classicPoints = Object.values(levelScores).reduce((a, b: any) => a + b, 0);
                    const basePoints = Object.values(updated).reduce((a, b: any) => a + b, 0);
                    updateLeaderboard(false, classicPoints + basePoints + dailyPoints);
                }} />}
                {baseSubTab === 'learn' && <BaseLearning isDarkMode={isDarkMode} />}
                {baseSubTab === 'ai' && (
                  <div className="max-w-3xl mx-auto">
                      <div className="space-y-6">
                        <div className="glass-card p-8 text-center space-y-6 relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-3xl rounded-full -mr-32 -mt-32" />
                          <div className="relative z-10">
                            <div className="w-20 h-20 mx-auto rounded-[2rem] bg-gradient-to-br from-blue-500 via-indigo-600 to-violet-700 flex items-center justify-center text-4xl shadow-2xl shadow-blue-500/30 border border-white/10 mb-4">
                              <Zap className="w-10 h-10 text-white" />
                            </div>
                            <h3 className="text-xl font-extrabold tracking-tight text-foreground mb-2">Base AI Assistant</h3>
                            <p className="text-sm text-muted-foreground font-medium max-w-md mx-auto mb-6">
                              Ask any question about Base chain and get instant, detailed answers about the ecosystem, smart contracts, DeFi, NFTs, and more.
                            </p>
                            <button
                              onClick={() => setIsBaseAiOpen(true)}
                              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-500 via-indigo-600 to-violet-600 text-white font-bold text-sm shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-0.5 transition-all flex items-center gap-3 mx-auto group"
                            >
                              <Zap className="w-5 h-5 group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] transition-all" />
                              Ask About Base Chain
                              <Brain className="w-5 h-5 opacity-60" />
                            </button>
                          </div>
                        </div>

                        {/* Quick Questions */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {[
                            { q: "What is Base chain?", emoji: "🔵" },
                            { q: "How do gas fees work on Base?", emoji: "⛽" },
                            { q: "How to deploy a smart contract on Base?", emoji: "📝" },
                            { q: "What is the OP Stack?", emoji: "🏗️" },
                            { q: "How to bridge ETH to Base?", emoji: "🌉" },
                            { q: "What is USDC on Base?", emoji: "💵" },
                          ].map((item, i) => (
                            <motion.button
                              key={i}
                              whileHover={{ y: -2, scale: 1.01 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setIsBaseAiOpen(true)}
                              className="glass-card p-4 text-left flex items-center gap-3 hover:border-blue-500/20 transition-all group"
                            >
                              <span className="text-xl">{item.emoji}</span>
                              <span className="text-sm font-semibold text-foreground/80 group-hover:text-blue-500 transition-colors">{item.q}</span>
                              <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                            </motion.button>
                          ))}
                        </div>
                      </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        );
      case 'leaderboard':
        if (!connectedAddress) {
          return (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-md mx-auto text-center space-y-6 py-12"
            >
              <div className="w-20 h-20 mx-auto bg-gradient-premium rounded-3xl flex items-center justify-center shadow-xl shadow-primary/20 text-3xl">
                🏆
              </div>
              <div className="space-y-2">
                <h2 className={`text-3xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  Global Rankings
                </h2>
                <p className={`text-base font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  Connect your wallet to view and join the leaderboard.
                </p>
              </div>
              <button
                onClick={connectWallet}
                className="w-full py-4 rounded-2xl bg-gradient-premium text-white font-black uppercase tracking-widest text-sm shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all"
              >
                Connect Wallet
              </button>
            </motion.div>
          );
        }
        return (
          <LeaderboardTable
            isDarkMode={isDarkMode}
            leaderboardData={leaderboard}
            connectedAddress={connectedAddress}
            onlineCount={onlineCount}
            onConnect={connectWallet}
          />
        );
      case 'dashboard':
        return (
          <div className="flex flex-col items-center justify-center min-h-[400px] space-y-8 glass-card p-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none uppercase text-foreground font-black text-5xl sm:text-7xl tracking-tighter">Stats</div>
            <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center text-4xl shadow-2xl shadow-primary/20 transform rotate-12">
              📊
            </div>
            <div className="text-center space-y-3 relative z-10">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">Performance Analytics</h2>
              <p className="text-muted-foreground font-medium max-w-sm mx-auto text-sm sm:text-base">
                Detailed insights into your learning progress and coding performance are coming soon to your dashboard.
              </p>
            </div>
            <button className="px-8 py-3 rounded-2xl bg-muted/50 border border-border text-xs font-bold uppercase tracking-widest text-muted-foreground cursor-not-allowed">
              Under Development
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  if (!themeLoaded) return <div className="min-h-screen bg-slate-950" />;

  return (
    <div className={`min-h-screen transition-colors duration-500 font-sans selection:bg-primary/30 ${
      isDarkMode ? 'dark bg-background text-foreground' : 'bg-[#f8fafc] text-slate-900'
    }`}>
      {/* Immersive Background Canvas */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/20 blur-[150px] rounded-full animate-pulse duration-7000" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-violet-600/10 blur-[150px] rounded-full delay-2000 animate-pulse duration-10000" />
      </div>

      <Header
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        setQuizState={setQuizState}
        connectedAddress={connectedAddress}
        connectWallet={connectWallet}
        farcasterUser={farcasterUser}
        basename={basename}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16">
        <main className="min-h-[60vh]">
          {showGmIntro && (
            <DailyGMIntro
              isDarkMode={isDarkMode}
              onComplete={() => {
                setShowGmIntro(false);
                setShowDailyQuiz(true);
              }}
            />
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab + quizState}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            >
              {renderTabContent()}
            </motion.div>
          </AnimatePresence>
        </main>

        <Footer
          isDarkMode={isDarkMode}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      </div>

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        level={currentLevel}
        paymentStatus={paymentStatus}
        paymentError={paymentError}
        onUnlock={handleUnlockLevel}
      />

      {/* ═══ PREMIUM FLOATING AI MENTOR ═══ */}
      {!isAiOpen && (
        <motion.button
          initial={{ scale: 0, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          whileHover={{ scale: 1.1, y: -5 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsAiOpen(true)}
          className="fixed z-[100] right-4 bottom-4 sm:right-10 sm:bottom-10 w-14 h-14 sm:w-20 sm:h-20 rounded-2xl sm:rounded-[40px] bg-gradient-to-br from-primary via-indigo-600 to-violet-700 text-white shadow-[0_15px_40px_rgba(37,99,235,0.4)] flex items-center justify-center border border-white/20 backdrop-blur-xl group overflow-hidden"
        >
          {/* Inner Glow Effect */}
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          
          <div className="relative z-10">
            <Zap className="w-7 h-7 sm:w-11 sm:h-11 text-white group-hover:drop-shadow-[0_0_15px_rgba(255,255,255,0.8)] transition-all" />
          </div>

          <div className="absolute top-2 right-2 w-2.5 h-2.5 sm:w-4 sm:h-4 bg-emerald-500 rounded-full border-2 border-[#0f172a] animate-pulse shadow-[0_0_10px_#10b981]" />

          {/* Expanded Label on Hover (Hidden on Mobile) */}
          <div className="hidden sm:block absolute right-full mr-6 px-4 py-2 rounded-2xl bg-foreground text-background text-[11px] font-extrabold uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0 pointer-events-none whitespace-nowrap shadow-2xl">
            AI Mentor
          </div>
        </motion.button>
      )}

      {/* ═══ AI ASSISTANT FULLSCREEN MODAL ═══ */}
      <AnimatePresence>
        {isAiOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[110] bg-black/40 backdrop-blur-[2px] pointer-events-auto"
              onClick={() => setIsAiOpen(false)}
            />
            <motion.div 
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 32, stiffness: 300 }}
              className="fixed bottom-0 right-0 z-[120] w-full h-[92dvh] sm:w-[500px] sm:h-[80vh] sm:max-h-[800px] sm:m-6 sm:rounded-3xl overflow-hidden shadow-[0_30px_90px_-15px_rgba(0,0,0,0.6)] border-t sm:border border-border bg-card pointer-events-auto"
            >
              <AIAssistant isDarkMode={isDarkMode} onClose={() => setIsAiOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ═══ BASE AI EXPERT FULLSCREEN MODAL ═══ */}
      <AnimatePresence>
        {isBaseAiOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[110] bg-black/40 backdrop-blur-[2px] pointer-events-auto"
              onClick={() => setIsBaseAiOpen(false)}
            />
            <motion.div 
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 32, stiffness: 300 }}
              className="fixed bottom-0 right-0 z-[120] w-full h-[92dvh] sm:w-[500px] sm:h-[80vh] sm:max-h-[800px] sm:m-6 sm:rounded-3xl overflow-hidden shadow-[0_30px_90px_-15px_rgba(0,0,0,0.6)] border-t sm:border border-border bg-card pointer-events-auto"
            >
              <BaseAIAssistant isDarkMode={isDarkMode} onClose={() => setIsBaseAiOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}


