import React from 'react';
import TabIcon from './TabIcon';

export default function HomeIcon(props: { color: string; size?: number; focused?: boolean }) {
  return <TabIcon name="home" {...props} />;
}
