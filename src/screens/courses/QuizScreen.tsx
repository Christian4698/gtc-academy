// ============================================================
//  GTC ACADEMY — QuizScreen.tsx
// ============================================================
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Animated, Alert, Share, AppState,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRoute, useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

import { Colors, Typography, Spacing, Radius } from '../../theme';
import { useUserStore }  from '../../hooks/useStore';
import { QuizService }   from '../../services/supabase';
import { ExamAuditService } from '../../services/production';
import { OfflineCacheService } from '../../services/offline';
import { getQuizHint }   from '../../services/ai';
import { QuizQuestion }  from '../../types';
import { ProgressRing }  from '../../components/SharedComponents';

const ANSWER_COLORS = {
  default:   { bg: Colors.surface,  border: Colors.border,       text: Colors.white  },
  selected:  { bg: Colors.cyanBg,   border: Colors.borderCyan,   text: Colors.cyan   },
  correct:   { bg: Colors.greenBg,  border: Colors.borderGreen,  text: Colors.green  },
  wrong:     { bg: Colors.redBg,    border: Colors.borderRed,    text: Colors.red    },
  missed:    { bg: Colors.surface,  border: Colors.border,       text: Colors.muted  },
};

type AnswerState = 'default' | 'selected' | 'correct' | 'wrong' | 'missed';

// ── OPTION BUTTON ─────────────────────────────────────────────────────────────
interface OptionProps {
  letter:   string;
  text:     string;
  state:    AnswerState;
  onPress:  () => void;
  disabled: boolean;
}

const OptionButton = ({ letter, text, state, onPress, disabled }: OptionProps) => {
  const scale = useRef(new Animated.Value(1)).current;
  const cfg   = ANSWER_COLORS[state];

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.96, duration: 80, useNativeDriver: true }),
      Animated.spring(scale,  { toValue: 1,    useNativeDriver: true, speed: 50 }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View style={{ transform: [{ scale }], marginBottom: Spacing[3] }}>
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled}
        activeOpacity={0.9}
        style={[styles.option, { backgroundColor: cfg.bg, borderColor: cfg.border }]}
      >
        <View style={[styles.optionLetter, { borderColor: cfg.border }]}>
          <Text style={[styles.optionLetterText, { color: cfg.text }]}>
            {state === 'correct' ? '✓' : state === 'wrong' ? '✗' : letter}
          </Text>
        </View>
        <Text style={[styles.optionText, { color: cfg.text }]} numberOfLines={3}>{text}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ── RESULTS SCREEN ────────────────────────────────────────────────────────────
interface ResultsProps {
  score:    number;
  total:    number;
  passed:   boolean;
  course:   { title: string };
  onRetry:  () => void;
  onBack:   () => void;
}

const ResultsScreen = ({ score, total, passed, course, onRetry, onBack }: ResultsProps) => {
  const pct = Math.round((score / total) * 100);
  const slideAnim = useRef(new Animated.Value(40)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
    Haptics.notificationAsync(passed ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning);
  }, []);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `I scored ${pct}% on the "${course.title}" quiz on GTC Academy! 📊 #GTCAcademy #DataSkills`,
      });
    } catch (_) {}
  };

  return (
    <Animated.View style={[styles.results, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      {/* Score ring */}
      <ProgressRing value={pct} size={140} strokeWidth={10} color={passed ? Colors.green : Colors.amber} label="score" />

      <Text style={styles.resultTitle}>{passed ? '🎉 Excellent!' : '📚 Keep Going!'}</Text>
      <Text style={styles.resultSub}>{score} out of {total} correct</Text>
      <Text style={[styles.resultMsg, { color: passed ? Colors.green : Colors.amber }]}>
        {passed ? 'You passed this quiz!' : `Score ${Math.round(0.8 * total)}/5 or more to pass`}
      </Text>

      {/* Badge earned */}
      {passed && (
        <View style={styles.badge}>
          <Text style={styles.badgeEmoji}>🏅</Text>
          <View>
            <Text style={styles.badgeTitle}>Quiz Badge Earned!</Text>
            <Text style={styles.badgeSub}>Added to your profile achievements</Text>
          </View>
        </View>
      )}

      {/* Actions */}
      <TouchableOpacity style={styles.primaryBtn} onPress={onBack} activeOpacity={0.85}>
        <LinearGradient colors={Colors.gradBlue} style={styles.primaryBtnGrad}>
          <Text style={styles.primaryBtnText}>← Back to Course</Text>
        </LinearGradient>
      </TouchableOpacity>

      <View style={styles.secondaryBtns}>
        {!passed && (
          <TouchableOpacity style={styles.secondaryBtn} onPress={onRetry}>
            <Text style={styles.secondaryBtnText}>🔄 Retry Quiz</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.secondaryBtn} onPress={handleShare}>
          <Text style={styles.secondaryBtnText}>📤 Share</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

// ── MAIN QUIZ SCREEN ──────────────────────────────────────────────────────────
const TIMER_SECS = 30;

function shuffleQuestions(source: QuizQuestion[], shuffleOptions: boolean) {
  const shuffled = [...source].sort(() => Math.random() - 0.5);
  if (!shuffleOptions) return shuffled;

  return shuffled.map(question => {
    const options = question.options.map((text, index) => ({ text, index })).sort(() => Math.random() - 0.5);
    return {
      ...question,
      options: options.map(option => option.text),
      correct_index: options.findIndex(option => option.index === question.correct_index),
    };
  });
}

export default function QuizScreen() {
  const insets = useSafeAreaInsets();
  const nav    = useNavigation<any>();
  const route  = useRoute<any>();
  const { quiz, course } = route.params ?? {};
  const { profile }      = useUserStore();

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [idx,       setIdx]       = useState(0);
  const [answers,   setAnswers]   = useState<(number | null)[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [done,      setDone]      = useState(false);
  const [score,     setScore]     = useState(0);
  const [hint,      setHint]      = useState<string | null>(null);
  const [hintLoading, setHintLoad] = useState(false);
  const [timer,     setTimer]     = useState(TIMER_SECS);
  const [loading,   setLoading]   = useState(true);
  const [cancelled, setCancelled] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load questions
  useEffect(() => {
    if (!quiz) return;
    QuizService.getQuestions(quiz.id).then(({ data }) => {
      if (data) {
        const prepared = quiz.randomize_questions === false
          ? (quiz.randomize_answers === false ? data : shuffleQuestions(data, true))
          : shuffleQuestions(data, quiz.randomize_answers !== false);
        setQuestions(prepared);
        setAnswers(new Array(data.length).fill(null));
        setTimer(quiz.time_limit_seconds ?? Math.max(data.length * 60, TIMER_SECS));
      }
      setLoading(false);
    });
  }, [quiz]);

  const q = questions[idx];

  // Timer
  useEffect(() => {
    if (done || loading || confirmed) return;
    timerRef.current = setInterval(() => {
      setTimer(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          handleConfirm(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [idx, loading, done, confirmed]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (!profile || !quiz || done) return;
      if (state === 'inactive' || state === 'background') {
        setCancelled(true);
        setDone(true);
        ExamAuditService.logEvent(profile.id, quiz.id, 'cancelled', { reason: 'app_minimized_or_closed' });
      }
    });
    return () => sub.remove();
  }, [profile, quiz, done]);

  const handleSelect = (optIdx: number) => {
    if (confirmed) return;
    Haptics.selectionAsync();
    setAnswers(prev => { const a = [...prev]; a[idx] = optIdx; return a; });
  };

  const handleConfirm = useCallback((timeout = false) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setConfirmed(true);
    const selected = timeout ? -1 : answers[idx];
    if (selected === q.correct_index) {
      setScore(s => s + 1);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [answers, idx, q]);

  const handleNext = () => {
    setHint(null);
    setConfirmed(false);
    if (idx < questions.length - 1) {
      setIdx(i => i + 1);
    } else {
      submitAttempt();
    }
  };

  const submitAttempt = async () => {
    setDone(true);
    if (!profile || !quiz || !course) return;
    const answersPayload = questions.map((q, i) => ({
      question_id: q.id,
      selected:    answers[i] ?? -1,
      correct:     answers[i] === q.correct_index,
    }));
    const result = await QuizService.submitAttempt(profile.id, quiz.id, course.id, Math.round((score / questions.length) * 100), answersPayload);
    if (result.data) {
      await OfflineCacheService.cacheExamResult({
        ...result.data,
        status: result.data.passed ? 'passed' : 'failed',
        submitted_at: new Date().toISOString(),
      });
    }
    await ExamAuditService.logEvent(profile.id, quiz.id, 'submitted', {
      courseId: course.id,
      score,
      total: questions.length,
    });
  };

  const loadHint = async () => {
    if (hint || hintLoading || !q) return;
    setHintLoad(true);
    const h = await getQuizHint(q.question);
    setHint(h);
    setHintLoad(false);
  };

  const getOptionState = (optIdx: number): AnswerState => {
    if (!confirmed) return answers[idx] === optIdx ? 'selected' : 'default';
    if (optIdx === q.correct_index) return 'correct';
    if (optIdx === answers[idx] && optIdx !== q.correct_index) return 'wrong';
    return 'missed';
  };

  // Derived
  const pct       = Math.round(((idx + (confirmed ? 1 : 0)) / Math.max(questions.length, 1)) * 100);
  const finalScore = score;
  const passed     = !cancelled && finalScore >= Math.ceil(questions.length * 0.8);

  if (loading) return (
    <View style={[styles.root, { paddingTop: insets.top, alignItems: 'center', justifyContent: 'center' }]}>
      <Text style={{ color: Colors.cyan, fontSize: 32 }}>📝</Text>
      <Text style={{ color: Colors.muted, marginTop: Spacing[3], fontFamily: Typography.family.medium }}>Loading quiz…</Text>
    </View>
  );

  if (done) return (
    <ScrollView style={[styles.root, { paddingTop: insets.top }]} contentContainerStyle={{ flexGrow: 1 }}>
      <ResultsScreen
        score={finalScore}
        total={questions.length}
        passed={passed}
        course={course}
        onRetry={() => { setIdx(0); setAnswers(new Array(questions.length).fill(null)); setConfirmed(false); setCancelled(false); setScore(0); setTimer(quiz?.time_limit_seconds ?? Math.max(questions.length * 60, TIMER_SECS)); setDone(false); }}
        onBack={() => nav.goBack()}
      />
    </ScrollView>
  );

  if (!q) return null;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => Alert.alert('Quit Quiz', 'Your progress will be lost.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Quit',   style: 'destructive', onPress: () => nav.goBack() },
          ])}
        >
          <Text style={styles.backBtnText}>✕</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.questionCount}>{idx + 1} / {questions.length}</Text>
        </View>

        {/* Timer */}
        <View style={[styles.timer, timer <= 10 && styles.timerWarn]}>
          <Text style={[styles.timerText, timer <= 10 && styles.timerTextWarn]}>{Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressWrap}>
        <View style={[styles.progressFill, { width: `${pct}%` }]} />
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Question */}
        <Text style={styles.questionLabel}>QUESTION {idx + 1}</Text>
        <Text style={styles.questionText}>{q.question}</Text>

        {/* Options */}
        <View style={styles.options}>
          {q.options.map((opt, i) => (
            <OptionButton
              key={i}
              letter={String.fromCharCode(65 + i)}
              text={opt}
              state={getOptionState(i)}
              onPress={() => handleSelect(i)}
              disabled={confirmed}
            />
          ))}
        </View>

        {/* Explanation (after answering) */}
        {confirmed && q.explanation && (
          <View style={styles.explanation}>
            <Text style={styles.explanationTitle}>💡 Explanation</Text>
            <Text style={styles.explanationText}>{q.explanation}</Text>
          </View>
        )}

        {/* AI Hint */}
        {!confirmed && (
          <TouchableOpacity style={styles.hintBtn} onPress={loadHint} disabled={hintLoading || !!hint}>
            <Text style={styles.hintBtnText}>
              {hintLoading ? '🤔 Getting hint…' : hint ? `💡 ${hint}` : '🤖 Get AI hint'}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing[3] }]}>
        {!confirmed ? (
          <TouchableOpacity
            style={[styles.confirmBtn, answers[idx] === null && styles.confirmBtnDisabled]}
            onPress={() => handleConfirm()}
            disabled={answers[idx] === null}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={answers[idx] !== null ? Colors.gradBlue : [Colors.surface2, Colors.surface2]}
              style={styles.confirmBtnGrad}
            >
              <Text style={[styles.confirmBtnText, answers[idx] === null && { color: Colors.muted }]}>
                Confirm Answer
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.confirmBtn} onPress={handleNext} activeOpacity={0.85}>
            <LinearGradient colors={Colors.gradBlue} style={styles.confirmBtnGrad}>
              <Text style={styles.confirmBtnText}>
                {idx < questions.length - 1 ? 'Next Question →' : 'See Results'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ── STYLES ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing[4], paddingVertical: Spacing[3], gap: Spacing[3] },
  backBtn: { width: 36, height: 36, borderRadius: Radius.full, backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  backBtnText: { fontSize: 14, color: Colors.dim, fontWeight: '600' },
  headerCenter: { flex: 1, alignItems: 'center' },
  questionCount: { fontSize: Typography.size.sm, fontFamily: Typography.family.bold, color: Colors.muted },
  timer: { backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.full, paddingHorizontal: Spacing[3], paddingVertical: Spacing[1] },
  timerWarn: { backgroundColor: Colors.redBg, borderColor: Colors.borderRed },
  timerText: { fontSize: Typography.size.sm, fontFamily: Typography.family.black, color: Colors.dim },
  timerTextWarn: { color: Colors.red },

  // Progress
  progressWrap: { height: 4, backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: Spacing[4] },
  progressFill: { height: '100%', backgroundColor: Colors.cyan, borderRadius: Radius.full, transition: 'width 0.3s' } as any,

  // Body
  body: { flex: 1 },
  bodyContent: { padding: Spacing[5], paddingBottom: Spacing[4] },
  questionLabel: { fontSize: Typography.size.xs, fontFamily: Typography.family.black, color: Colors.cyan, letterSpacing: Typography.letterSpacing.widest, marginBottom: Spacing[3] },
  questionText: { fontSize: Typography.size.lg, fontFamily: Typography.family.semiBold, color: Colors.white, lineHeight: Typography.size.lg * 1.5, marginBottom: Spacing[6] },
  options: { gap: 0 },

  // Option
  option: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], padding: Spacing[4], borderRadius: Radius.lg, borderWidth: 1.5 },
  optionLetter: { width: 30, height: 30, borderRadius: 15, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  optionLetterText: { fontSize: Typography.size.sm, fontFamily: Typography.family.black },
  optionText: { flex: 1, fontSize: Typography.size.base, fontFamily: Typography.family.medium, lineHeight: Typography.size.base * 1.4 },

  // Explanation
  explanation: { backgroundColor: Colors.cyanBg, borderWidth: 1, borderColor: Colors.borderCyan, borderRadius: Radius.lg, padding: Spacing[4], marginTop: Spacing[2] },
  explanationTitle: { fontSize: Typography.size.sm, fontFamily: Typography.family.bold, color: Colors.cyan, marginBottom: Spacing[2] },
  explanationText: { fontSize: Typography.size.sm, fontFamily: Typography.family.regular, color: Colors.dim, lineHeight: Typography.size.sm * 1.6 },

  // Hint
  hintBtn: { backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg, padding: Spacing[4], marginTop: Spacing[3] },
  hintBtnText: { fontSize: Typography.size.sm, fontFamily: Typography.family.medium, color: Colors.muted, lineHeight: Typography.size.sm * 1.5 },

  // Footer
  footer: { padding: Spacing[4], borderTopWidth: 1, borderTopColor: Colors.border },
  confirmBtn: { borderRadius: Radius.md, overflow: 'hidden' },
  confirmBtnDisabled: { opacity: 0.5 },
  confirmBtnGrad: { paddingVertical: Spacing[4], alignItems: 'center' },
  confirmBtnText: { fontSize: Typography.size.base, fontFamily: Typography.family.black, color: Colors.white, letterSpacing: Typography.letterSpacing.wide },

  // Results
  results: { flex: 1, alignItems: 'center', paddingHorizontal: Spacing[6], paddingTop: Spacing[12], paddingBottom: Spacing[8] },
  resultTitle: { fontSize: Typography.size['3xl'], fontFamily: Typography.family.black, color: Colors.white, marginTop: Spacing[5], letterSpacing: Typography.letterSpacing.tight },
  resultSub: { fontSize: Typography.size.base, fontFamily: Typography.family.regular, color: Colors.muted, marginTop: Spacing[2] },
  resultMsg: { fontSize: Typography.size.sm, fontFamily: Typography.family.semiBold, marginTop: Spacing[1], marginBottom: Spacing[6] },
  badge: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], backgroundColor: Colors.cyanBg, borderWidth: 1, borderColor: Colors.borderCyan, borderRadius: Radius.lg, padding: Spacing[4], width: '100%', marginBottom: Spacing[6] },
  badgeEmoji: { fontSize: 28 },
  badgeTitle: { fontSize: Typography.size.base, fontFamily: Typography.family.bold, color: Colors.cyan },
  badgeSub: { fontSize: Typography.size.xs, fontFamily: Typography.family.regular, color: Colors.muted, marginTop: 2 },
  primaryBtn: { width: '100%', borderRadius: Radius.md, overflow: 'hidden', marginBottom: Spacing[3] },
  primaryBtnGrad: { paddingVertical: Spacing[4], alignItems: 'center' },
  primaryBtnText: { fontSize: Typography.size.base, fontFamily: Typography.family.black, color: Colors.white },
  secondaryBtns: { flexDirection: 'row', gap: Spacing[3] },
  secondaryBtn: { flex: 1, backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingVertical: Spacing[3], alignItems: 'center' },
  secondaryBtnText: { fontSize: Typography.size.sm, fontFamily: Typography.family.bold, color: Colors.dim },
});
