import React, { useState, useEffect } from 'react';
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
    color: '#3cb940', // Green
  },
  {
    title: 'Decline',
    photo: require('@/assets/barter-cards/decline1.png'),
    color: '#d32114', // Red
  },
  {
    title: 'Counter',
    photo: require('@/assets/barter-cards/counter1.png'),
    color: '#ff00bf', // Orange
  },
  {
    title: 'Query',
    photo: require('@/assets/barter-cards/query1.png'),
    color: '#9C27B0', // Purple
  },
];

interface BarterCardProps {
  title: string;
  photo: ImageSourcePropType;
  onPlay?: (cardTitle: string) => void;
  isTopCard?: boolean;
  cardIndex?: number;
  color?: string;
}

const BarterCard: React.FC<BarterCardProps> = ({ title, photo, onPlay, isTopCard = false, cardIndex = 0, color = '#007AFF' }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Reset expansion when this card is no longer the top card
  useEffect(() => {
    if (!isTopCard && isExpanded) {
      // Trigger animation before collapsing
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setIsExpanded(false);
    }
  }, [isTopCard, isExpanded]);

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

  //for counter card. plus button pulls up other user's deck, allowing you to add a card to the trade
  //minus button calls a deck with all the cards in the trade, with user cards seperating them, allowing you to remove something from the trade
  const handleIncrement = () => {
    console.log(`${title}: Plus button pressed`);
  };
  const handleDecrement = () => {
    console.log(`${title}: Minus button pressed`);
  };

  const isCounterCard = title === 'Counter';

  return (
    <View style={styles.outerContainer}>
      {/* White container that wraps everything */}
      <View style={styles.whiteContainer}>
        {/* Expandable Header */}
        {isExpanded && (
          <View style={styles.header}>
            <View style={styles.headerContent}>
              {/* Counter controls - only show for Counter card */}
              {isCounterCard && (
                <View style={styles.counterControls}>
                  <TouchableOpacity 
                    style={[styles.counterButton, { backgroundColor: color }]}
                    onPress={handleDecrement}
                  >
                    <Text style={styles.counterButtonText}>-</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.counterButton, { backgroundColor: color }]}
                    onPress={handleIncrement}
                  >
                    <Text style={styles.counterButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              )}
              
              {/* Spacer to push Play Card button to the right */}
              <View style={styles.spacer} />
              
              {/* Play Card button */}
              <TouchableOpacity 
                style={[styles.playButton, { backgroundColor: color }]}
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
    borderRadius: 10,
    padding: 6,
    overflow: 'visible',
  },
  header: {
    backgroundColor: '#fff',
    paddingVertical: 4,
    paddingHorizontal: 4,
    marginBottom: 4,
    borderRadius: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  counterControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  counterButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  spacer: {
    flex: 1,
  },
  playButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
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
