import React from 'react';
import TabIcon from './TabIcon';

export default function PodcastIcon(props: { color: string; size?: number; focused?: boolean }) {
  return <TabIcon name="podcast" {...props} />;
}
