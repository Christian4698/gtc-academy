import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';

import { ActionCard, EmptyText, ScreenScaffold } from './ScreenScaffold';
import SkeletonLoader from '../components/SkeletonLoader';
import { TemplateService } from '../services/supabase';
import { useUserStore } from '../hooks/useStore';
import { Colors, Spacing, Typography } from '../theme';

export default function TemplatesScreen() {
  const { profile, isPremium } = useUserStore();
  const { data, isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: () => TemplateService.getAll(),
    select: res => res.data ?? [],
  });

  return (
    <ScreenScaffold title="Templates" subtitle="Ready-to-use Excel and Google Sheets resources for reports and dashboards.">
      {isLoading ? <SkeletonLoader count={3} height={76} /> : null}
      {(data ?? []).map(template => {
        const locked = template.is_premium && !isPremium();
        return (
          <ActionCard
            key={template.id}
            title={template.title}
            body={template.description ?? undefined}
            meta={`${template.type.toUpperCase()} · ${template.file_size ?? 'File'} · ${template.downloads} downloads`}
            accent={template.is_premium ? Colors.amber : Colors.green}
            right={locked ? <Text style={styles.locked}>PRO</Text> : undefined}
            onPress={async () => {
              if (locked) {
                Toast.show({ type: 'info', text1: 'Premium template', text2: 'Upgrade to download this file.' });
                return;
              }
              if (profile) await TemplateService.recordDownload(profile.id, template.id);
              Toast.show({ type: 'success', text1: 'Template ready', text2: template.title });
            }}
          />
        );
      })}
      {!isLoading && (data ?? []).length === 0 ? <EmptyText>No templates available yet.</EmptyText> : null}
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  locked: {
    alignSelf: 'center',
    marginRight: Spacing[4],
    color: Colors.amber,
    fontSize: Typography.size.xs,
    fontFamily: Typography.family.black,
  },
});
