import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { ActionCard, EmptyText, ScreenScaffold } from './ScreenScaffold';
import { NotificationService } from '../services/supabase';
import { useNotifStore, useUserStore } from '../hooks/useStore';
import { Colors, Spacing, Typography } from '../theme';

export default function NotificationsScreen() {
  const { profile } = useUserStore();
  const { setNotifications, markAllRead } = useNotifStore();
  const { data } = useQuery({
    queryKey: ['notifications', profile?.id],
    queryFn: () => profile ? NotificationService.getAll(profile.id) : Promise.resolve({ data: [], error: null }),
    select: res => res.data ?? [],
    enabled: Boolean(profile),
  });

  useEffect(() => {
    if (data) setNotifications(data);
  }, [data, setNotifications]);

  const clear = async () => {
    if (profile) await NotificationService.markAllRead(profile.id);
    markAllRead();
  };

  return (
    <ScreenScaffold
      title="Notifications"
      subtitle="Course reminders, certificates, and platform announcements."
      right={<TouchableOpacity onPress={clear}><Text style={styles.clear}>Mark all read</Text></TouchableOpacity>}
    >
      {(data ?? []).map(item => (
        <ActionCard
          key={item.id}
          title={item.title}
          body={item.body}
          meta={`${item.type}${item.read ? '' : ' · unread'}`}
          accent={item.read ? Colors.muted : Colors.cyan}
          onPress={async () => {
            await NotificationService.markRead(item.id);
          }}
        />
      ))}
      {(data ?? []).length === 0 ? <EmptyText>No notifications yet.</EmptyText> : null}
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  clear: {
    color: Colors.cyan,
    fontSize: Typography.size.xs,
    fontFamily: Typography.family.black,
    padding: Spacing[2],
  },
});
