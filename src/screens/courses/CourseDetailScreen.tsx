import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';

import { ActionCard, EmptyText, PrimaryButton, ScreenScaffold } from '../ScreenScaffold';
import { Colors, Radius, Spacing, Typography } from '../../theme';
import { Course, DeliveryMode, Lesson, Quiz } from '../../types';
import { CourseService, LessonService, QuizService } from '../../services/supabase';
import { PurchaseService } from '../../services/production';
import { useUserStore } from '../../hooks/useStore';

export default function CourseDetailScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const course = route.params?.course as Course | undefined;
  const { profile } = useUserStore();
  const [trainingOption, setTrainingOption] = useState<DeliveryMode>('online');
  const [purchaseLoading, setPurchaseLoading] = useState(false);

  const { data: lessons, isLoading: lessonsLoading } = useQuery({
    queryKey: ['lessons', course?.id],
    queryFn: () => course ? LessonService.getByCourse(course.id) : Promise.resolve({ data: [], error: null }),
    select: res => res.data ?? [],
    enabled: Boolean(course),
  });

  const { data: quizzes } = useQuery({
    queryKey: ['quizzes', course?.id],
    queryFn: () => course ? QuizService.getByCourse(course.id) : Promise.resolve({ data: [], error: null }),
    select: res => res.data ?? [],
    enabled: Boolean(course),
  });

  if (!course) {
    return (
      <ScreenScaffold title="Course not found">
        <EmptyText>Open a course from the catalog to view details.</EmptyText>
      </ScreenScaffold>
    );
  }

  const enroll = async () => {
    if (!profile || !course) return;
    const coursePrice = course?.price ?? (course?.is_premium ? 1 : 0);
    if (course && coursePrice > 0 && !course.is_enrolled) {
      setPurchaseLoading(true);
      const { error } = await PurchaseService.createPendingPurchase({
        userId: profile.id,
        courseId: course.id,
        amount: course.price ?? 0,
        currency: course.currency ?? 'USD',
        trainingOption,
      });
      setPurchaseLoading(false);
      Toast.show({
        type: error ? 'error' : 'success',
        text1: error ? 'Purchase failed' : 'Payment pending',
        text2: error ?? 'Access unlocks automatically after successful payment.',
      });
      return;
    }
    const { error } = await CourseService.enroll(profile.id, course.id);
    Toast.show({
      type: error ? 'error' : 'success',
      text1: error ? 'Enrollment failed' : 'You are enrolled',
      text2: error ?? course.title,
    });
  };

  const openLesson = (lesson: Lesson) => nav.navigate('Lesson', { lesson, course });
  const openQuiz = (quiz: Quiz) => nav.navigate('Quiz', { quiz, course });
  const coursePrice = course.price ?? (course.is_premium ? 1 : 0);
  const isPaid = coursePrice > 0 || course.is_premium;

  return (
    <ScreenScaffold title={course.title} subtitle={course.description ?? undefined}>
      <LinearGradient colors={Colors.gradCard} style={styles.hero}>
        <Text style={styles.level}>{course.level.toUpperCase()}</Text>
        <Text style={styles.heroTitle}>{course.category?.name ?? 'Course'}</Text>
        <View style={styles.stats}>
          <Text style={styles.stat}>{course.lessons_count ?? lessons?.length ?? 0} lessons</Text>
          <Text style={styles.stat}>{course.enrolled_count.toLocaleString()} learners</Text>
          <Text style={styles.stat}>{course.rating.toFixed(1)} rating</Text>
          <Text style={styles.stat}>{isPaid ? `${course.currency ?? 'USD'} ${course.price ?? 'Paid'}` : 'Free'}</Text>
        </View>
        {course.progress ? (
          <View style={styles.progressOuter}>
            <View style={[styles.progressInner, { width: `${course.progress}%` }]} />
          </View>
        ) : null}
      </LinearGradient>

      {!course.is_enrolled && isPaid ? (
        <View style={styles.purchasePanel}>
          <Text style={styles.purchaseTitle}>Choose training option</Text>
          <View style={styles.optionRow}>
            {(['online', 'in_person'] as DeliveryMode[]).map(option => (
              <TouchableOpacity
                key={option}
                style={[styles.optionChip, trainingOption === option && styles.optionChipActive]}
                onPress={() => setTrainingOption(option)}
              >
                <Text style={[styles.optionText, trainingOption === option && styles.optionTextActive]}>
                  {option === 'online' ? 'Online' : 'In-person'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.purchaseBody}>Payment providers prepared: Stripe, Mobile Money, M-Pesa, Orange Money, Airtel Money and PayPal.</Text>
        </View>
      ) : null}

      <PrimaryButton
        label={course.is_enrolled ? 'Continue course' : isPaid ? (purchaseLoading ? 'Preparing payment...' : 'Buy course') : 'Enroll now'}
        onPress={course.is_enrolled ? () => lessons?.[0] && openLesson(lessons[0]) : enroll}
      />

      <Text style={styles.sectionTitle}>Lessons</Text>
      {lessonsLoading ? <ActivityIndicator color={Colors.cyan} /> : null}
      {(lessons ?? []).map(lesson => (
        <ActionCard
          key={lesson.id}
          title={lesson.title}
          body={lesson.description ?? undefined}
          meta={`${lesson.type} · ${Math.round((lesson.duration_secs ?? 0) / 60) || 1} min`}
          accent={lesson.completed ? Colors.green : Colors.cyan}
          onPress={() => openLesson(lesson)}
          right={lesson.completed ? <Text style={styles.done}>Done</Text> : undefined}
        />
      ))}
      {!lessonsLoading && (lessons ?? []).length === 0 ? <EmptyText>No lessons published yet.</EmptyText> : null}

      {(quizzes ?? []).length > 0 ? <Text style={styles.sectionTitle}>Quizzes</Text> : null}
      {(quizzes ?? []).map(quiz => (
        <ActionCard
          key={quiz.id}
          title={quiz.title}
          body={quiz.description ?? undefined}
          meta={`Pass score ${quiz.pass_score}%`}
          accent={Colors.amber}
          onPress={() => openQuiz(quiz)}
        />
      ))}

      <TouchableOpacity style={styles.back} onPress={() => nav.goBack()}>
        <Text style={styles.backText}>Back to courses</Text>
      </TouchableOpacity>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.borderCyan,
    padding: Spacing[5],
    marginBottom: Spacing[4],
  },
  level: {
    fontSize: Typography.size.xs,
    fontFamily: Typography.family.black,
    color: Colors.cyan,
    letterSpacing: Typography.letterSpacing.widest,
  },
  heroTitle: {
    marginTop: Spacing[2],
    fontSize: Typography.size.xl,
    fontFamily: Typography.family.black,
    color: Colors.white,
  },
  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[2],
    marginTop: Spacing[4],
  },
  stat: {
    borderRadius: Radius.full,
    backgroundColor: Colors.surface2,
    color: Colors.dim,
    fontSize: Typography.size.xs,
    fontFamily: Typography.family.bold,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1],
  },
  progressOuter: {
    marginTop: Spacing[4],
    height: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface2,
    overflow: 'hidden',
  },
  progressInner: {
    height: '100%',
    borderRadius: Radius.full,
    backgroundColor: Colors.cyan,
  },
  sectionTitle: {
    marginTop: Spacing[6],
    marginBottom: Spacing[3],
    fontSize: Typography.size.md,
    fontFamily: Typography.family.black,
    color: Colors.white,
  },
  purchasePanel: {
    borderWidth: 1,
    borderColor: Colors.borderAmber,
    borderRadius: Radius.lg,
    backgroundColor: Colors.amberBg,
    padding: Spacing[4],
    marginBottom: Spacing[4],
  },
  purchaseTitle: {
    color: Colors.white,
    fontSize: Typography.size.base,
    fontFamily: Typography.family.black,
    marginBottom: Spacing[3],
  },
  optionRow: {
    flexDirection: 'row',
    gap: Spacing[2],
    marginBottom: Spacing[3],
  },
  optionChip: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    backgroundColor: Colors.surface,
  },
  optionChipActive: {
    borderColor: Colors.borderAmber,
    backgroundColor: Colors.surface2,
  },
  optionText: {
    color: Colors.muted,
    fontSize: Typography.size.sm,
    fontFamily: Typography.family.bold,
  },
  optionTextActive: {
    color: Colors.amber,
  },
  purchaseBody: {
    color: Colors.dim,
    fontSize: Typography.size.sm,
    fontFamily: Typography.family.regular,
    lineHeight: Typography.size.sm * 1.45,
  },
  done: {
    alignSelf: 'center',
    marginRight: Spacing[4],
    color: Colors.green,
    fontSize: Typography.size.xs,
    fontFamily: Typography.family.black,
  },
  back: {
    alignItems: 'center',
    paddingVertical: Spacing[4],
  },
  backText: {
    color: Colors.cyan,
    fontFamily: Typography.family.bold,
  },
});
