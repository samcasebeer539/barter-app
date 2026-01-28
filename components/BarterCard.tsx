import React, { useState, useRef, useEffect } from 'react';
import { View, Image, StyleSheet, ImageSourcePropType, TouchableOpacity, Text, Animated, Platform, UIManager } from 'react-native';

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
  isTopCard?: boolean;
  cardIndex?: number;
}

const BarterCard: React.FC<BarterCardProps> = ({ title, photo, onPlay, isTopCard = false, cardIndex = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const translateY = useRef(new Animated.Value(0)).current;

  const HEADER_HEIGHT = 44; // Approximate header height

  // Reset expansion when this card is no longer the top card
  useEffect(() => {
    if (!isTopCard && isExpanded) {
      setIsExpanded(false);
    }
  }, [isTopCard]);

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: isExpanded ? -HEADER_HEIGHT : 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [isExpanded]);

  const handleCardPress = () => {
    // Only allow pressing if this is the top card
    if (!isTopCard) {
      return;
    }
    
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
    <Animated.View style={[styles.outerContainer, { transform: [{ translateY }] }]}>
      {/* White container that wraps everything */}
      <View style={styles.whiteContainer}>
        {/* Expandable Header */}
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

        {/* Card Container */}
        <TouchableOpacity 
          activeOpacity={isTopCard ? 0.9 : 1}
          onPress={handleCardPress}
          disabled={!isTopCard}
        >
          <View style={styles.card}>
            <Image source={photo} style={styles.photo} resizeMode="cover" />
          </View>
        </TouchableOpacity>
      </View>
    </Animated.View>
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
  },
  header: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 6,
    borderRadius: 8,
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
