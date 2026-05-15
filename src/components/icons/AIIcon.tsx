import React from 'react';
import TabIcon from './TabIcon';

export default function AIIcon(props: { color: string; size?: number; focused?: boolean }) {
  return <TabIcon name="ai" {...props} />;
}
