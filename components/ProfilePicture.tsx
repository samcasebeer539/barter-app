import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ProfilePictureProps {
  size?: number;
  avatarText?: string;
}

const ProfilePicture: React.FC<ProfilePictureProps> = ({ 
  size = 80,
  avatarText = '👤'
}) => {
  const ringGap = 4;
  const ringThickness = 3;
  const segmentGapDegrees = 8; // Gap between segments in degrees
  
  // Calculate sizes for each ring
  const avatarSize = size;
  const innerRingSize = avatarSize + (ringGap * 2) + (ringThickness * 2);
  const middleRingSize = innerRingSize + (ringGap * 2) + (ringThickness * 2);
  const outerRingSize = middleRingSize + (ringGap * 2) + (ringThickness * 2);
  
  // Create a single segment with rotation
  const createSegment = (ringSize: number, color: string, rotation: number) => {
    const segmentAngle = 90 - segmentGapDegrees; // Each segment takes up 90 degrees minus the gap
    const halfSize = ringSize / 2;
    
    return (
      <View
        style={{
          position: 'absolute',
          width: ringSize,
          height: ringSize,
          transform: [{ rotate: `${rotation}deg` }],
        }}
      >
        <View
          style={{
            position: 'absolute',
            width: halfSize,
            height: halfSize,
            top: 0,
            left: halfSize,
            borderTopWidth: ringThickness,
            borderRightWidth: ringThickness,
            borderColor: color,
            borderTopRightRadius: ringSize / 2,
            overflow: 'hidden',
          }}
        />
      </View>
    );
  };

  return (
    <View style={[styles.container, { width: outerRingSize, height: outerRingSize }]}>
      {/* Outer Ring (Pink, Segmented) */}
      <View style={[styles.ringContainer, { width: outerRingSize, height: outerRingSize }]}>
        {createSegment(outerRingSize, '#FF3B81', 0)}
        {createSegment(outerRingSize, '#FF3B81', 90)}
        {createSegment(outerRingSize, '#FF3B81', 180)}
        {createSegment(outerRingSize, '#FF3B81', 270)}
      </View>

      {/* Middle Ring (Yellow, Segmented) */}
      <View style={[styles.ringContainer, { width: middleRingSize, height: middleRingSize }]}>
        {createSegment(middleRingSize, '#FFA600', 0)}
        {createSegment(middleRingSize, '#FFA600', 90)}
        {createSegment(middleRingSize, '#FFA600', 180)}
        {createSegment(middleRingSize, '#FFA600', 270)}
      </View>

      {/* Inner Ring (Blue, Solid) */}
      <View style={[styles.ringContainer, { width: innerRingSize, height: innerRingSize }]}>
        <View style={{ 
          width: innerRingSize, 
          height: innerRingSize, 
          borderRadius: innerRingSize / 2,
          borderWidth: ringThickness,
          borderColor: '#3B82F6',
          backgroundColor: 'transparent',
        }} />
      </View>

      {/* Avatar in center */}
      <View style={[styles.avatar, { 
        width: avatarSize, 
        height: avatarSize, 
        borderRadius: avatarSize / 2 
      }]}>
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
  ringContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  avatarText: {
    // fontSize is set dynamically based on size
  },
});

export default ProfilePicture;
