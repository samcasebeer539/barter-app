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
  
  return (
    <View style={[styles.container, { width: outerRingSize, height: outerRingSize }]}>
      {/* Outer Ring (Pink, Segmented) */}
      <View style={[styles.ringContainer, { width: outerRingSize, height: outerRingSize }]}>
        <View style={[styles.segmentedRing, { width: outerRingSize, height: outerRingSize, borderRadius: outerRingSize / 2 }]}>
          {/* Top segment */}
          <View style={[styles.segment, styles.segmentTop, { 
            width: outerRingSize, 
            height: outerRingSize / 2,
            borderTopLeftRadius: outerRingSize / 2,
            borderTopRightRadius: outerRingSize / 2,
            borderTopWidth: ringThickness,
            borderLeftWidth: ringThickness,
            borderRightWidth: ringThickness,
            borderColor: '#FF3B81',
          }]} />
          
          {/* Right segment */}
          <View style={[styles.segment, styles.segmentRight, { 
            width: outerRingSize / 2, 
            height: outerRingSize,
            borderTopRightRadius: outerRingSize / 2,
            borderBottomRightRadius: outerRingSize / 2,
            borderTopWidth: ringThickness,
            borderRightWidth: ringThickness,
            borderBottomWidth: ringThickness,
            borderColor: '#FF3B81',
          }]} />
          
          {/* Bottom segment */}
          <View style={[styles.segment, styles.segmentBottom, { 
            width: outerRingSize, 
            height: outerRingSize / 2,
            borderBottomLeftRadius: outerRingSize / 2,
            borderBottomRightRadius: outerRingSize / 2,
            borderBottomWidth: ringThickness,
            borderLeftWidth: ringThickness,
            borderRightWidth: ringThickness,
            borderColor: '#FF3B81',
          }]} />
          
          {/* Left segment */}
          <View style={[styles.segment, styles.segmentLeft, { 
            width: outerRingSize / 2, 
            height: outerRingSize,
            borderTopLeftRadius: outerRingSize / 2,
            borderBottomLeftRadius: outerRingSize / 2,
            borderTopWidth: ringThickness,
            borderLeftWidth: ringThickness,
            borderBottomWidth: ringThickness,
            borderColor: '#FF3B81',
          }]} />
        </View>
      </View>

      {/* Middle Ring (Yellow, Segmented) */}
      <View style={[styles.ringContainer, { width: middleRingSize, height: middleRingSize }]}>
        <View style={[styles.segmentedRing, { width: middleRingSize, height: middleRingSize, borderRadius: middleRingSize / 2 }]}>
          {/* Top segment */}
          <View style={[styles.segment, styles.segmentTop, { 
            width: middleRingSize, 
            height: middleRingSize / 2,
            borderTopLeftRadius: middleRingSize / 2,
            borderTopRightRadius: middleRingSize / 2,
            borderTopWidth: ringThickness,
            borderLeftWidth: ringThickness,
            borderRightWidth: ringThickness,
            borderColor: '#FFA600',
          }]} />
          
          {/* Right segment */}
          <View style={[styles.segment, styles.segmentRight, { 
            width: middleRingSize / 2, 
            height: middleRingSize,
            borderTopRightRadius: middleRingSize / 2,
            borderBottomRightRadius: middleRingSize / 2,
            borderTopWidth: ringThickness,
            borderRightWidth: ringThickness,
            borderBottomWidth: ringThickness,
            borderColor: '#FFA600',
          }]} />
          
          {/* Bottom segment */}
          <View style={[styles.segment, styles.segmentBottom, { 
            width: middleRingSize, 
            height: middleRingSize / 2,
            borderBottomLeftRadius: middleRingSize / 2,
            borderBottomRightRadius: middleRingSize / 2,
            borderBottomWidth: ringThickness,
            borderLeftWidth: ringThickness,
            borderRightWidth: ringThickness,
            borderColor: '#FFA600',
          }]} />
          
          {/* Left segment */}
          <View style={[styles.segment, styles.segmentLeft, { 
            width: middleRingSize / 2, 
            height: middleRingSize,
            borderTopLeftRadius: middleRingSize / 2,
            borderBottomLeftRadius: middleRingSize / 2,
            borderTopWidth: ringThickness,
            borderLeftWidth: ringThickness,
            borderBottomWidth: ringThickness,
            borderColor: '#FFA600',
          }]} />
        </View>
      </View>

      {/* Inner Ring (Blue, Solid) */}
      <View style={[styles.ringContainer, { width: innerRingSize, height: innerRingSize }]}>
        <View style={[styles.solidRing, { 
          width: innerRingSize, 
          height: innerRingSize, 
          borderRadius: innerRingSize / 2,
          borderWidth: ringThickness,
          borderColor: '#3B82F6',
        }]} />
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
  solidRing: {
    backgroundColor: 'transparent',
  },
  segmentedRing: {
    position: 'relative',
  },
  segment: {
    position: 'absolute',
    backgroundColor: 'transparent',
  },
  segmentTop: {
    top: 0,
    left: 0,
    transform: [{ rotate: '0deg' }],
  },
  segmentRight: {
    top: 0,
    right: 0,
    transform: [{ rotate: '0deg' }],
  },
  segmentBottom: {
    bottom: 0,
    left: 0,
    transform: [{ rotate: '0deg' }],
  },
  segmentLeft: {
    top: 0,
    left: 0,
    transform: [{ rotate: '0deg' }],
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
