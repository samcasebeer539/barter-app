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
  const segmentGapDegrees = 5; // Gap between segments in degrees
  
  // Calculate sizes for each ring
  const avatarSize = size;
  const innerRingSize = avatarSize + (ringGap * 2) + (ringThickness * 2);
  const middleRingSize = innerRingSize + (ringGap * 2) + (ringThickness * 2);
  const outerRingSize = middleRingSize + (ringGap * 2) + (ringThickness * 2);
  
  // Create a single segment - quarter circle arc
  const createSegment = (ringSize: number, color: string, rotation: number) => {
    const halfSize = ringSize / 2;
    // Reduce the size slightly to create gaps
    const segmentSize = ringSize * 0.98; // 98% of full size to create small gaps
    
    return (
      <View
        key={rotation}
        style={{
          position: 'absolute',
          width: ringSize,
          height: ringSize,
          transform: [{ rotate: `${rotation + segmentGapDegrees / 2}deg` }],
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            width: segmentSize,
            height: segmentSize,
            borderTopWidth: ringThickness,
            borderRightWidth: ringThickness,
            borderColor: color,
            borderTopRightRadius: segmentSize / 2,
            backgroundColor: 'transparent',
            transform: [{ rotate: '-45deg' }],
          }}
        />
      </View>
    );
  };

  return (
    <View style={[styles.container, { width: outerRingSize, height: outerRingSize }]}>
      {/* Outer Ring (Pink, Segmented) */}
      <View style={[styles.ringContainer, { width: outerRingSize, height: outerRingSize }]}>
        {[0, 90, 180, 270].map(rotation => createSegment(outerRingSize, '#FF3B81', rotation))}
      </View>

      {/* Middle Ring (Yellow, Segmented) */}
      <View style={[styles.ringContainer, { width: middleRingSize, height: middleRingSize }]}>
        {[0, 90, 180, 270].map(rotation => createSegment(middleRingSize, '#FFA600', rotation))}
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
