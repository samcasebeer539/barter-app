import React from 'react';
import { View, Text, StyleSheet, Image, ImageSourcePropType } from 'react-native';

interface ProfilePictureProps {
  size?: number;
  avatarText?: string;
  imageSource?: ImageSourcePropType | string;
}

const ProfilePicture: React.FC<ProfilePictureProps> = ({ 
  size = 80,
  avatarText = '👤',
  imageSource
}) => {
  const ringGap = 2;
  const ringThickness = 3;
  
  // Calculate sizes for each ring
  const avatarSize = size;
  const innerRingSize = avatarSize + (ringGap * 2) + (ringThickness * 2);
  const middleRingSize = innerRingSize + (ringGap * 2) + (ringThickness * 2);
  const outerRingSize = middleRingSize + (ringGap * 2) + (ringThickness * 2);
  
  return (
    <View style={[styles.container, { width: outerRingSize, height: outerRingSize }]}>
      {/* Outer Ring (Pink, Solid) */}
      <View style={[styles.ringContainer, { width: outerRingSize, height: outerRingSize }]}>
        <View style={{ 
          width: outerRingSize, 
          height: outerRingSize, 
          borderRadius: outerRingSize / 2,
          borderWidth: ringThickness,
          borderColor: '#ff3b55',
          backgroundColor: 'transparent',
        }} />
      </View>

      {/* Middle Ring (Yellow, Solid) */}
      <View style={[styles.ringContainer, { width: middleRingSize, height: middleRingSize }]}>
        <View style={{ 
          width: middleRingSize, 
          height: middleRingSize, 
          borderRadius: middleRingSize / 2,
          borderWidth: ringThickness,
          borderColor: '#FFA600',
          backgroundColor: 'transparent',
        }} />
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
        {imageSource ? (
          <Image 
            source={typeof imageSource === 'string' ? { uri: imageSource } : imageSource}
            style={[styles.avatarImage, { 
              width: avatarSize, 
              height: avatarSize, 
              borderRadius: avatarSize / 2 
            }]}
            resizeMode="cover"
          />
        ) : (
          <Text style={[styles.avatarText, { fontSize: avatarSize / 2 }]}>{avatarText}</Text>
        )}
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
    overflow: 'hidden',
  },
  avatarText: {
    // fontSize is set dynamically based on size
  },
  avatarImage: {
    // size and borderRadius are set dynamically
  },
});

export default ProfilePicture;
