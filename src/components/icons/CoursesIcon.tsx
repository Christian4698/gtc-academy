import React from 'react';
import TabIcon from './TabIcon';

export default function CoursesIcon(props: { color: string; size?: number; focused?: boolean }) {
  return <TabIcon name="courses" {...props} />;
}
