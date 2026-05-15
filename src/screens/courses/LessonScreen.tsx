import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import Toast from 'react-native-toast-message';

import { PrimaryButton, ScreenScaffold } from '../ScreenScaffold';
import { Colors, Radius, Spacing, Typography } from '../../theme';
import { Course, Lesson } from '../../types';
import { LessonService } from '../../services/supabase';
import { useUserStore } from '../../hooks/useStore';

export default function LessonScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const lesson = route.params?.lesson as Lesson | undefined;
  const course = route.params?.course as Course | undefined;
  const { profile } = useUserStore();
  const [completed, setCompleted] = useState(Boolean(lesson?.completed));

  if (!lesson || !course) {
    return (
      <ScreenScaffold title="Lesson not found">
        <Text style={styles.empty}>Open a lesson from a course to continue.</Text>
      </ScreenScaffold>
    );
  }

  const markComplete = async () => {
    if (!profile) return;
    const { error } = await LessonService.markCompleted(profile.id, lesson.id, course.id);
    if (!error) setCompleted(true);
    Toast.show({ type: error ? 'error' : 'success', text1: error ? 'Could not update progress' : 'Lesson completed' });
  };

  return (
    <ScreenScaffold title={lesson.title} subtitle={course.title}>
      <LinearGradient colors={Colors.gradDark} style={styles.viewer}>
        <Text style={styles.viewerType}>{lesson.type.toUpperCase()}</Text>
        <Text style={styles.viewerTitle}>{lesson.title}</Text>
        <Text style={styles.viewerSub}>{Math.round((lesson.duration_secs ?? 0) / 60) || 1} min lesson</Text>
      </LinearGradient>

      <View style={styles.content}>
        <Text style={styles.bodyText}>
          {lesson.content ?? lesson.description ?? 'This lesson is ready for video, PDF, or article content from Supabase.'}
        </Text>
      </View>

      <PrimaryButton label={completed ? 'Completed' : 'Mark as completed'} onPress={markComplete} />

      <TouchableOpacity style={styles.back} onPress={() => nav.goBack()}>
        <Text style={styles.backText}>Back to course</Text>
      </TouchableOpacity>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  viewer: {
    minHeight: 210,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.borderCyan,
    padding: Spacing[5],
    justifyContent: 'flex-end',
  },
  viewerType: {
    fontSize: Typography.size.xs,
    fontFamily: Typography.family.black,
    color: Colors.cyan,
    letterSpacing: Typography.letterSpacing.widest,
  },
  viewerTitle: {
    marginTop: Spacing[2],
    fontSize: Typography.size['2xl'],
    fontFamily: Typography.family.black,
    color: Colors.white,
  },
  viewerSub: {
    marginTop: Spacing[2],
    color: Colors.muted,
    fontFamily: Typography.family.medium,
  },
  content: {
    marginVertical: Spacing[5],
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    padding: Spacing[4],
  },
  bodyText: {
    color: Colors.dim,
    fontSize: Typography.size.base,
    fontFamily: Typography.family.regular,
    lineHeight: Typography.size.base * 1.6,
  },
  back: {
    alignItems: 'center',
    paddingVertical: Spacing[4],
  },
  backText: {
    color: Colors.cyan,
    fontFamily: Typography.family.bold,
  },
  empty: {
    color: Colors.muted,
    textAlign: 'center',
  },
});
