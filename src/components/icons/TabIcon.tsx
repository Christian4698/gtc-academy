import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

type IconName = 'home' | 'courses' | 'ai' | 'podcast' | 'profile';

interface Props {
  name: IconName;
  color: string;
  size?: number;
  focused?: boolean;
}

export default function TabIcon({ name, color, size = 22, focused = false }: Props) {
  const strokeWidth = focused ? 2.6 : 2.1;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {name === 'home' && (
        <>
          <Path d="M4 10.5 12 4l8 6.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M6.5 10.5V20h11v-9.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M10 20v-5h4v5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
      {name === 'courses' && (
        <>
          <Path d="M5 5.5h9a3 3 0 0 1 3 3V20H8a3 3 0 0 0-3 3V5.5Z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M8 8.5h6M8 12h6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        </>
      )}
      {name === 'ai' && (
        <>
          <Rect x="5" y="7" width="14" height="11" rx="4" stroke={color} strokeWidth={strokeWidth} />
          <Path d="M9 12h.01M15 12h.01M10 16h4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Path d="M12 7V4M8 4h8" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        </>
      )}
      {name === 'podcast' && (
        <>
          <Circle cx="12" cy="10" r="3" stroke={color} strokeWidth={strokeWidth} />
          <Path d="M7.5 14.5a6 6 0 1 1 9 0M9 18a9 9 0 1 1 6 0" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Path d="M12 13v7" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        </>
      )}
      {name === 'profile' && (
        <>
          <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth={strokeWidth} />
          <Path d="M4.5 20a7.5 7.5 0 0 1 15 0" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        </>
      )}
    </Svg>
  );
}
