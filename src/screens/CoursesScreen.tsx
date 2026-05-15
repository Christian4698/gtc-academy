import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';

import CourseCard from '../components/CourseCard';
import SkeletonLoader from '../components/SkeletonLoader';
import { Colors, Radius, Spacing, Typography } from '../theme';
import { CourseService } from '../services/supabase';
import { Course, CourseSort, DeliveryMode } from '../types';
import { ScreenScaffold } from './ScreenScaffold';
import { usePreferencesStore } from '../hooks/useStore';
import { t } from '../i18n';

const levels = ['all', 'beginner', 'intermediate', 'advanced'] as const;
const prices = ['all', 'free', 'paid'] as const;
const modes = ['all', 'online', 'in_person'] as const;
const sorts: CourseSort[] = ['popularity', 'rating', 'newest'];

export default function CoursesScreen() {
  const nav = useNavigation<any>();
  const { language } = usePreferencesStore();
  const [query, setQuery] = useState('');
  const [level, setLevel] = useState<(typeof levels)[number]>('all');
  const [category, setCategory] = useState('all');
  const [price, setPrice] = useState<(typeof prices)[number]>('all');
  const [mode, setMode] = useState<(typeof modes)[number]>('all');
  const [sort, setSort] = useState<CourseSort>('popularity');

  const { data, isLoading } = useQuery({
    queryKey: ['courses', 'catalog'],
    queryFn: () => CourseService.getAll(),
    select: res => res.data ?? [],
  });

  const courses = useMemo(() => {
    const filtered = (data ?? []).filter(course => {
      const text = `${course.title} ${course.description ?? ''} ${course.category?.name ?? ''}`.toLowerCase();
      const matchesQuery = !query.trim() || text.includes(query.trim().toLowerCase());
      const matchesLevel = level === 'all' || course.level === level;
      const matchesCategory = category === 'all' || course.category?.slug === category || course.category?.name === category;
      const coursePrice = course.price ?? (course.is_premium ? 1 : 0);
      const matchesPrice = price === 'all' || (price === 'free' ? coursePrice <= 0 : coursePrice > 0 || course.is_premium);
      const deliveryModes = course.delivery_modes ?? ['online'];
      const matchesMode = mode === 'all' || deliveryModes.includes(mode as DeliveryMode);
      return matchesQuery && matchesLevel && matchesCategory && matchesPrice && matchesMode;
    });
    return filtered.sort((a, b) => {
      if (sort === 'rating') return (b.rating ?? 0) - (a.rating ?? 0);
      if (sort === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return (b.popularity_score ?? b.enrolled_count ?? 0) - (a.popularity_score ?? a.enrolled_count ?? 0);
    });
  }, [data, query, level, category, price, mode, sort]);

  const categories = useMemo(() => {
    const map = new Map<string, string>();
    (data ?? []).forEach(course => {
      if (course.category?.slug && course.category?.name) map.set(course.category.slug, course.category.name);
    });
    return Array.from(map.entries()).map(([slug, name]) => ({ slug, name }));
  }, [data]);

  const openCourse = (course: Course) => {
    nav.navigate('CourseDetail', { course });
  };

  return (
    <ScreenScaffold
      title={t('courses.title', language)}
      subtitle={t('courses.subtitle', language)}
    >
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder={t('courses.search', language)}
        placeholderTextColor={Colors.muted}
        style={styles.search}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {levels.map(item => (
          <TouchableOpacity
            key={item}
            style={[styles.filter, level === item && styles.filterActive]}
            onPress={() => setLevel(item)}
          >
            <Text style={[styles.filterText, level === item && styles.filterTextActive]}>
              {item === 'all' ? 'All' : item[0].toUpperCase() + item.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FilterRow
        items={[{ key: 'all', label: t('courses.all', language) }, ...categories.map(item => ({ key: item.slug, label: item.name }))]}
        active={category}
        onSelect={setCategory}
      />

      <FilterRow
        items={prices.map(item => ({
          key: item,
          label: item === 'all' ? t('courses.all', language) : item === 'free' ? t('courses.free', language) : t('courses.paid', language),
        }))}
        active={price}
        onSelect={(value) => setPrice(value as (typeof prices)[number])}
      />

      <FilterRow
        items={modes.map(item => ({
          key: item,
          label: item === 'all' ? t('courses.all', language) : item === 'online' ? t('courses.online', language) : t('courses.inPerson', language),
        }))}
        active={mode}
        onSelect={(value) => setMode(value as (typeof modes)[number])}
      />

      <FilterRow
        items={sorts.map(item => ({ key: item, label: t(`courses.${item}`, language) }))}
        active={sort}
        onSelect={(value) => setSort(value as CourseSort)}
      />

      {isLoading ? (
        <SkeletonLoader count={4} height={86} />
      ) : (
        courses.map(course => (
          <CourseCard
            key={course.id}
            course={course}
            showProgress={Boolean(course.progress)}
            onPress={() => openCourse(course)}
          />
        ))
      )}

      {!isLoading && courses.length === 0 ? (
        <Text style={styles.empty}>No course matches your search.</Text>
      ) : null}
    </ScreenScaffold>
  );
}

function FilterRow({ items, active, onSelect }: { items: { key: string; label: string }[]; active: string; onSelect: (value: string) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
      {items.map(item => (
        <TouchableOpacity
          key={item.key}
          style={[styles.filter, active === item.key && styles.filterActive]}
          onPress={() => onSelect(item.key)}
        >
          <Text style={[styles.filterText, active === item.key && styles.filterTextActive]}>{item.label}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  search: {
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface2,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    color: Colors.white,
    fontFamily: Typography.family.regular,
    fontSize: Typography.size.base,
    marginBottom: Spacing[3],
  },
  filters: {
    gap: Spacing[2],
    paddingBottom: Spacing[4],
  },
  filter: {
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
  },
  filterActive: {
    borderColor: Colors.borderCyan,
    backgroundColor: Colors.cyanBg,
  },
  filterText: {
    color: Colors.muted,
    fontSize: Typography.size.sm,
    fontFamily: Typography.family.bold,
  },
  filterTextActive: {
    color: Colors.cyan,
  },
  empty: {
    color: Colors.muted,
    fontFamily: Typography.family.medium,
    textAlign: 'center',
    paddingVertical: Spacing[8],
  },
});
