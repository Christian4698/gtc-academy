import React from 'react';
import TabIcon from './TabIcon';

export default function ProfileIcon(props: { color: string; size?: number; focused?: boolean }) {
  return <TabIcon name="profile" {...props} />;
}
