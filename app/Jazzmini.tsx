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
  where,
  orderBy,
  limit,
  getDocs
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

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

// --- Farcaster SDK ---
let sdk: any = null;
try {
  const farcasterSdk = require('@farcaster/miniapp-sdk');
  sdk = farcasterSdk.sdk;
} catch (e) {
  console.warn('Farcaster SDK not available, using web3 provider fallback');
}

const firebaseConfig = {
  apiKey: "AIzaSyDgGMn0Lnz8sFdrZwRNPpfXmDxvmc004oc",
  authDomain: "myproj-7d380.firebaseapp.com",
  projectId: "myproj-7d380",
  storageBucket: "myproj-7d380.firebasestorage.app",
  messagingSenderId: "210105263036",
  appId: "1:210105263036:web:214b668a9510029f8001b9",
  measurementId: "G-GXVFY5C3F0"
};

const appId = 'js-level-quiz-default';
const PUBLIC_COLLECTION_PATH = `artifacts/${appId}/stats`;
const GLOBAL_STATS_DOC_ID = 'global_progress';

const QUIZ_CONTRACT_ADDRESS = '0x2315d55F06E19D21Ebda68Aa1E54F9aF6924dcE5';
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
  const [db, setDb] = useState<Firestore | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [globalStats, setGlobalStats] = useState<GlobalStats>({ maxScore: 0, highestLevel: 1 });
  const [leaderboardElite, setLeaderboardElite] = useState<any[]>([]);
  const [leaderboardFree, setLeaderboardFree] = useState<any[]>([]);
  const [leaderboardTab, setLeaderboardTab] = useState<'free' | 'elite'>('elite');
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

  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const [basename, setBasename] = useState<string | null>(null);
  const [farcasterUser, setFarcasterUser] = useState<any>(null);
  const [walletError, setWalletError] = useState<string | null>(null);

  const [levelAttempts, setLevelAttempts] = useState<Record<number, number>>({});
  const [levelScores, setLevelScores] = useState<Record<number, number>>({});
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paidLevels, setPaidLevels] = useState<Record<number, boolean>>({});

  const [rewardStatus, setRewardStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [rewardTxHash, setRewardTxHash] = useState<string | null>(null);
  const [supportStatus, setSupportStatus] = useState<'idle' | 'pending' | 'success' | 'skipped' | 'error'>('idle');

  const [dailyStreak, setDailyStreak] = useState(0);
  const [lastGmDate, setLastGmDate] = useState<string | null>(null);
  const [gmDoneToday, setGmDoneToday] = useState(false);
  const [showDailyQuiz, setShowDailyQuiz] = useState(false);
  const [dailyQuizAnswer, setDailyQuizAnswer] = useState<string | null>(null);
  const [dailyQuizResult, setDailyQuizResult] = useState<'correct' | 'wrong' | null>(null);
  const [streakMissed, setStreakMissed] = useState(false);
  const [streakRecoveryStatus, setStreakRecoveryStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [todayQuestion, setTodayQuestion] = useState<DailyQuestion | null>(null);

  const [activeTab, setActiveTab] = useState<'quiz' | 'daily' | 'learn' | 'dashboard' | 'leaderboard'>('quiz');
  const [learningLevel, setLearningLevel] = useState(1);
  const contractAddedRef = useRef(false);

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
      const savedPaid = localStorage.getItem('quizPaidLevels');
      if (savedPaid) setPaidLevels(JSON.parse(savedPaid));
    } catch { }

    const today = getTodayDateKey();
    const savedStreak = parseInt(localStorage.getItem('dailyStreak') || '0', 10);
    const savedLastGm = localStorage.getItem('lastGmDate');
    const savedDailyDone = localStorage.getItem('dailyQuizDone');

    setDailyStreak(savedStreak);
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
      setDb(getFirestore(app));
      const unsubscribe = onAuthStateChanged(getAuth(app), (user) => {
        if (user) setUserId(user.uid);
        else signInAnonymously(getAuth(app)).catch(() => setUserId(`local-${crypto.randomUUID()}`));
        setAuthReady(true);
      });
      return () => unsubscribe();
    } catch (e) {
      setUserId(`local-${crypto.randomUUID()}`);
      setAuthReady(true);
    }
  }, []);

  // Sync Global Stats
  useEffect(() => {
    if (!authReady || !db) return;
    const statsRef = doc(db, PUBLIC_COLLECTION_PATH, GLOBAL_STATS_DOC_ID);
    return onSnapshot(statsRef, (docSnap) => {
      if (docSnap.exists()) setGlobalStats(docSnap.data() as GlobalStats);
      else setDoc(statsRef, { maxScore: 0, highestLevel: 1, updated: new Date().toISOString() }, { merge: true });
    });
  }, [authReady, db]);

  // Wallet Connection Logic
  useEffect(() => {
    const tryAutoConnect = async () => {
      try {
        if (sdk?.wallet?.ethProvider?.request) {
          const accounts = await sdk.wallet.ethProvider.request({ method: 'eth_requestAccounts' });
          if (accounts?.[0]) setConnectedAddress(accounts[0]);
        } else {
          const provider = getWalletProvider();
          const accounts = await provider?.request({ method: 'eth_accounts' });
          if (accounts?.[0]) setConnectedAddress(accounts[0]);
        }
      } catch (e) { }
    };
    tryAutoConnect();
  }, []);

  // Basename fetch
  useEffect(() => {
    if (!connectedAddress) { setBasename(null); return; }
    fetch(`https://base.blockscout.com/api/v2/addresses/${connectedAddress}/names`)
      .then(res => res.json())
      .then(data => {
        const baseName = data?.items?.find((i: any) => i.name.endsWith('.base'))?.name;
        if (baseName) setBasename(baseName);
      }).catch(() => { });
  }, [connectedAddress]);

  // Leaderboard fetch
  useEffect(() => {
    if (!db) return;
    const fetchLB = async () => {
      const eliteQ = query(collection(db, 'leaderboard'), where('isPaid', '==', true), orderBy('totalPoints', 'desc'), limit(10));
      const freeQ = query(collection(db, 'leaderboard'), where('isPaid', '==', false), orderBy('totalPoints', 'desc'), limit(10));
      const [eliteS, freeS] = await Promise.all([getDocs(eliteQ), getDocs(freeQ)]);
      setLeaderboardElite(eliteS.docs.map(d => d.data()));
      setLeaderboardFree(freeS.docs.map(d => d.data()));
    };
    fetchLB();
  }, [db, activeTab]);

  // Logic Handlers
  const updateLeaderboard = useCallback(async (isPaid: boolean = false) => {
    if (!db || !connectedAddress) return;
    const totalPoints = Object.values(levelScores).reduce((a, b) => a + b, 0);
    const payload = {
      address: connectedAddress.toLowerCase(),
      basename: basename || connectedAddress.slice(0, 8),
      totalPoints,
      highestLevel: globalStats.highestLevel,
      streak: dailyStreak,
      isPaid,
      lastUpdated: new Date().toISOString(),
      ...(farcasterUser ? { fid: farcasterUser.fid, username: farcasterUser.username, pfp: farcasterUser.pfp_url } : {})
    };
    await setDoc(doc(db, 'leaderboard', connectedAddress.toLowerCase()), payload, { merge: true });
  }, [db, connectedAddress, basename, levelScores, globalStats, dailyStreak, farcasterUser]);

  const connectWallet = useCallback(async () => {
    try {
      if (sdk?.actions?.signIn) {
        const res = await sdk.actions.signIn({ nonce: "jazzmini-" + Math.floor(Math.random() * 1000000) });
        if (res?.user) {
          setFarcasterUser(res.user);
          const addr = (res.user.verifications?.[0] || res.user.custody_address).toLowerCase();
          setConnectedAddress(addr);
          if (res.user.username) setBasename(res.user.username + ".fc");
          updateLeaderboard();
          return;
        }
      }
      const provider = getWalletProvider();
      const accounts = await provider?.request({ method: 'eth_requestAccounts' });
      if (accounts?.[0]) {
        setConnectedAddress(accounts[0].toLowerCase());
        updateLeaderboard();
      }
    } catch (e) {
      setWalletError('Failed to connect wallet.');
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
    if (correct) setScore(s => s + 1);
    setShowExplanation(true);
  }, [currentLevel, currentQuestionIndex, selectedOption]);

  const handleNextQuestion = useCallback(async () => {
    setSelectedOption(null);
    setShowExplanation(false);
    const questions = QUIZ_DATA.filter(q => q.level === currentLevel);
    if (currentQuestionIndex === questions.length - 1) {
      const passed = score >= PASS_THRESHOLD;
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
          const statsRef = doc(db!, PUBLIC_COLLECTION_PATH, GLOBAL_STATS_DOC_ID);
          await setDoc(statsRef, { highestLevel: nextLevel, updated: new Date().toISOString() }, { merge: true });
        }
        updateLeaderboard(paidLevels[1] || false);
      }
    } else {
      setCurrentQuestionIndex(p => p + 1);
    }
  }, [currentLevel, currentQuestionIndex, score, levelAttempts, levelScores, globalStats, db, updateLeaderboard, paidLevels]);

  const handleUnlockLevel = useCallback(async () => {
    setPaymentStatus('pending');
    try {
      const provider = getWalletProvider();
      const accounts = await provider?.request({ method: 'eth_requestAccounts' });
      const tx = await provider?.request({
        method: 'eth_sendTransaction',
        params: [{
          from: accounts[0],
          to: USDC_BASE,
          data: '0xa9059cbb' + QUIZ_CONTRACT_ADDRESS.slice(2).padStart(64, '0') + (50000).toString(16).padStart(64, '0'), // 0.05 USDC
          chainId: '0x2105'
        }]
      });
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
  }, [currentLevel, paidLevels, startQuiz]);

  const handleLevel1Reward = useCallback(async () => {
    setRewardStatus('pending');
    try {
      const provider = getWalletProvider();
      const accounts = await provider?.request({ method: 'eth_requestAccounts' });
      const tx = await provider?.request({
        method: 'eth_sendTransaction',
        params: [{
          from: accounts[0],
          to: USDC_BASE,
          data: '0xa9059cbb' + QUIZ_CONTRACT_ADDRESS.slice(2).padStart(64, '0') + (30000).toString(16).padStart(64, '0'), // 0.03 USDC
          chainId: '0x2105'
        }]
      });
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
  }, [paidLevels, updateLeaderboard]);

  const handleSupportPayment = useCallback(async () => {
    setSupportStatus('pending');
    try {
      const provider = getWalletProvider();
      const accounts = await provider?.request({ method: 'eth_requestAccounts' });
      const tx = await provider?.request({
        method: 'eth_sendTransaction',
        params: [{
          from: accounts[0],
          to: USDC_BASE,
          data: '0xa9059cbb' + QUIZ_CONTRACT_ADDRESS.slice(2).padStart(64, '0') + (30000).toString(16).padStart(64, '0'),
          chainId: '0x2105'
        }]
      });
      if (tx) {
        setSupportStatus('success');
        updateLeaderboard(true);
      }
    } catch (e) {
      setSupportStatus('error');
    }
  }, [updateLeaderboard]);

  const handleGm = useCallback(() => {
    const today = getTodayDateKey();
    setGmDoneToday(true);
    setLastGmDate(today);
    localStorage.setItem('lastGmDate', today);
    setShowDailyQuiz(true);
  }, []);

  const handleDailyAnswer = useCallback((opt: string) => {
    if (dailyQuizAnswer === 'done') return;
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
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } else {
      setDailyStreak(0);
      localStorage.setItem('dailyStreak', '0');
    }
  }, [dailyStreak, todayQuestion]);

  const handleStreakRestore = useCallback(async () => {
    setStreakRecoveryStatus('pending');
    try {
      const provider = getWalletProvider();
      const accounts = await provider?.request({ method: 'eth_requestAccounts' });
      const tx = await provider?.request({
        method: 'eth_sendTransaction',
        params: [{
          from: accounts[0],
          to: USDC_BASE,
          data: '0xa9059cbb' + QUIZ_CONTRACT_ADDRESS.slice(2).padStart(64, '0') + (50000).toString(16).padStart(64, '0'),
          chainId: '0x2105'
        }]
      });
      if (tx) {
        setStreakRecoveryStatus('success');
        setStreakMissed(false);
        const today = getTodayDateKey();
        localStorage.setItem('lastGmDate', today);
      }
    } catch (e) {
      setStreakRecoveryStatus('error');
    }
  }, []);

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
              isLastQuestion={currentQuestionIndex === questions.length - 1}
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
              onRetry={() => setQuizState('in_progress')}
              onNextLevel={() => startQuiz(currentLevel + 1)}
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
          />
        );
      case 'leaderboard':
        return (
          <LeaderboardTable
            isDarkMode={isDarkMode}
            leaderboardTab={leaderboardTab}
            setLeaderboardTab={setLeaderboardTab}
            leaderboardElite={leaderboardElite}
            leaderboardFree={leaderboardFree}
          />
        );
      case 'dashboard':
        return (
          <div className="text-center opacity-50 py-20 font-black uppercase tracking-widest">
            Stats Dashboard Coming Soon
          </div>
        );
      default:
        return null;
    }
  };

  if (!themeLoaded) return <div className="min-h-screen bg-slate-900" />;

  return (
    <div className={`min-h-screen transition-colors duration-500 font-sans selection:bg-primary/30 ${isDarkMode ? 'dark bg-background text-foreground' : 'bg-[#f8fafc] text-slate-900'
      }`}>
      {/* Background Aesthetic */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-60">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/30 blur-[130px] rounded-full animate-soft-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/20 blur-[130px] rounded-full delay-1000 animate-soft-pulse" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
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

        <main className="min-h-[60vh]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab + quizState}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              {renderTabContent()}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Footer */}
        <footer className="mt-20 pt-8 border-t border-white/5 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30">
            Powered by Base • Verifiable Code Skills
          </p>
        </footer>
      </div>

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        level={currentLevel}
        paymentStatus={paymentStatus}
        paymentError={paymentError}
        onUnlock={handleUnlockLevel}
      />
    </div>
  );
}


