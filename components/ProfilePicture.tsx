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
  
  // Calculate sizes for each ring
  const avatarSize = size;
  const innerRingSize = avatarSize + (ringGap * 2) + (ringThickness * 2);
  const middleRingSize = innerRingSize + (ringGap * 2) + (ringThickness * 2);
  const outerRingSize = middleRingSize + (ringGap * 2) + (ringThickness * 2);
  
  // Create arc segments with actual gaps using mask technique
  const createSegmentedRing = (ringSize: number, color: string) => {
    const segmentWidth = (ringSize * Math.PI) / 4 - 5; // Quarter circle minus gap
    const radius = ringSize / 2;
    
    return (
      <>
        {/* Top segment */}
        <View style={{
          position: 'absolute',
          width: segmentWidth,
          height: ringThickness,
          backgroundColor: color,
          top: 0,
          left: (ringSize - segmentWidth) / 2,
          borderRadius: ringThickness / 2,
        }} />
        
        {/* Right segment */}
        <View style={{
          position: 'absolute',
          width: ringThickness,
          height: segmentWidth,
          backgroundColor: color,
          right: 0,
          top: (ringSize - segmentWidth) / 2,
          borderRadius: ringThickness / 2,
        }} />
        
        {/* Bottom segment */}
        <View style={{
          position: 'absolute',
          width: segmentWidth,
          height: ringThickness,
          backgroundColor: color,
          bottom: 0,
          left: (ringSize - segmentWidth) / 2,
          borderRadius: ringThickness / 2,
        }} />
        
        {/* Left segment */}
        <View style={{
          position: 'absolute',
          width: ringThickness,
          height: segmentWidth,
          backgroundColor: color,
          left: 0,
          top: (ringSize - segmentWidth) / 2,
          borderRadius: ringThickness / 2,
        }} />
      </>
    );
  };

  return (
    <View style={[styles.container, { width: outerRingSize, height: outerRingSize }]}>
      {/* Outer Ring (Pink, Segmented) */}
      <View style={[styles.ringContainer, { width: outerRingSize, height: outerRingSize, borderRadius: outerRingSize / 2 }]}>
        {createSegmentedRing(outerRingSize, '#FF3B81')}
      </View>

      {/* Middle Ring (Yellow, Segmented) */}
      <View style={[styles.ringContainer, { width: middleRingSize, height: middleRingSize, borderRadius: middleRingSize / 2 }]}>
        {createSegmentedRing(middleRingSize, '#FFA600')}
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
    overflow: 'hidden',
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
