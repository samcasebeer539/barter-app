import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

interface ProfilePictureProps {
  size?: number;
  avatarText?: string;
}

const ProfilePicture: React.FC<ProfilePictureProps> = ({ 
  size = 80,
  avatarText = '👤'
}) => {
  const ringGap = 4; // Gap between rings
  const ringThickness = 3;
  
  // Calculate sizes
  const avatarSize = size;
  const innerRingRadius = (avatarSize / 2) + ringGap;
  const middleRingRadius = innerRingRadius + ringThickness + ringGap;
  const outerRingRadius = middleRingRadius + ringThickness + ringGap;
  
  const svgSize = (outerRingRadius + ringThickness) * 2;
  const center = svgSize / 2;

  // Create segmented ring path (4 segments with gaps)
  const createSegmentedRing = (radius: number, color: string) => {
    const segmentAngle = 80; // Degrees per segment (leaving 10 degree gaps)
    const gapAngle = 10;
    const segments = [];

    for (let i = 0; i < 4; i++) {
      const startAngle = i * 90 - 90; // Start from top, rotate by 90 degrees for each segment
      const endAngle = startAngle + segmentAngle;

      // Convert to radians
      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;

      // Calculate arc points
      const startX = center + radius * Math.cos(startRad);
      const startY = center + radius * Math.sin(startRad);
      const endX = center + radius * Math.cos(endRad);
      const endY = center + radius * Math.sin(endRad);

      segments.push(
        <Path
          key={i}
          d={`M ${startX} ${startY} A ${radius} ${radius} 0 0 1 ${endX} ${endY}`}
          stroke={color}
          strokeWidth={ringThickness}
          fill="none"
          strokeLinecap="round"
        />
      );
    }

    return segments;
  };

  return (
    <View style={[styles.container, { width: svgSize, height: svgSize }]}>
      {/* SVG Rings */}
      <Svg width={svgSize} height={svgSize} style={styles.svg}>
        {/* Inner solid blue ring */}
        <Circle
          cx={center}
          cy={center}
          r={innerRingRadius}
          stroke="#3B82F6"
          strokeWidth={ringThickness}
          fill="none"
        />
        
        {/* Middle segmented yellow ring */}
        {createSegmentedRing(middleRingRadius, '#FFA600')}
        
        {/* Outer segmented pink ring */}
        {createSegmentedRing(outerRingRadius, '#FF3B81')}
      </Svg>

      {/* Avatar in center */}
      <View style={[styles.avatar, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]}>
        <Text style={[styles.avatarText, { fontSize: avatarSize / 2 }]}>{avatarText}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    position: 'absolute',
  },
  avatar: {
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    // fontSize is set dynamically based on size
  },
});

export default ProfilePicture;
