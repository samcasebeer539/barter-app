import React, { useState } from 'react';
import { View, Image, StyleSheet, ImageSourcePropType, TouchableOpacity, Text, LayoutAnimation, Platform, UIManager } from 'react-native';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Sample cards data - these are the 4 barter cards
export const BARTER_CARDS = [
  {
    title: 'Accept',
    photo: require('@/assets/barter-cards/accept1.png'),
  },
  {
    title: 'Decline',
    photo: require('@/assets/barter-cards/decline1.png'),
  },
  {
    title: 'Counter',
    photo: require('@/assets/barter-cards/counter1.png'),
  },
  {
    title: 'Query',
    photo: require('@/assets/barter-cards/query1.png'),
  },
];

interface BarterCardProps {
  title: string;
  photo: ImageSourcePropType;
  onPlay?: (cardTitle: string) => void;
}

const BarterCard: React.FC<BarterCardProps> = ({ title, photo, onPlay }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCardPress = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };

  const handlePlayCard = () => {
    console.log(`Playing card: ${title}`);
    if (onPlay) {
      onPlay(title);
    }
    // Add your play card logic here
  };

  return (
    <View style={styles.outerContainer}>
      {/* White container that wraps everything */}
      <View style={styles.whiteContainer}>
        {/* Expandable Header - positioned absolutely so it doesn't push card down */}
        {isExpanded && (
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <TouchableOpacity 
                style={styles.playButton}
                onPress={handlePlayCard}
              >
                <Text style={styles.playButtonText}>Play Card</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Card Container - this stays in the same position */}
        <TouchableOpacity 
          activeOpacity={0.9}
          onPress={handleCardPress}
        >
          <View style={styles.card}>
            <Image source={photo} style={styles.photo} resizeMode="cover" />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 12,
  },
  whiteContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 6,
    overflow: 'visible',
    position: 'relative',
  },
  header: {
    position: 'absolute',
    top: -44, // Position above the white container
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  playButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  playButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    width: 200,
    height: 280,
    backgroundColor: '#fff',
    borderRadius: 6,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
});

export default BarterCard;
