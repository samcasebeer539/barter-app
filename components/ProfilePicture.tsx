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
  
  // Create a segmented ring with 4 arcs and small gaps
  const createSegmentedRing = (ringSize: number, color: string) => {
    // Each segment covers 88 degrees (leaving 2 degree gaps between them)
    const gapSize = 3; // Small gap in pixels
    
    return (
      <View style={{ position: 'relative', width: ringSize, height: ringSize }}>
        {/* Create 4 arc segments */}
        {[0, 90, 180, 270].map((rotation, index) => (
          <View
            key={index}
            style={{
              position: 'absolute',
              width: ringSize,
              height: ringSize,
              overflow: 'hidden',
            }}
          >
            {/* Mask container - rotated to position the arc */}
            <View style={{
              position: 'absolute',
              width: ringSize,
              height: ringSize,
              transform: [{ rotate: `${rotation}deg` }],
            }}>
              {/* Mask that shows only a quarter (minus gap) */}
              <View style={{
                position: 'absolute',
                width: ringSize / 2,
                height: ringSize / 2,
                right: -gapSize / 2,
                top: -gapSize / 2,
                overflow: 'hidden',
              }}>
                {/* The actual ring (rotated back to be level) */}
                <View style={{
                  position: 'absolute',
                  width: ringSize,
                  height: ringSize,
                  borderRadius: ringSize / 2,
                  borderWidth: ringThickness,
                  borderColor: color,
                  backgroundColor: 'transparent',
                  left: -ringSize / 2 + gapSize / 2,
                  top: -ringSize / 2 + gapSize / 2,
                  transform: [{ rotate: `${-rotation}deg` }],
                }} />
              </View>
            </View>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={[styles.container, { width: outerRingSize, height: outerRingSize }]}>
      {/* Outer Ring (Pink, Segmented) */}
      <View style={[styles.ringContainer, { width: outerRingSize, height: outerRingSize }]}>
        {createSegmentedRing(outerRingSize, '#FF3B81')}
      </View>

      {/* Middle Ring (Yellow, Segmented) */}
      <View style={[styles.ringContainer, { width: middleRingSize, height: middleRingSize }]}>
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
