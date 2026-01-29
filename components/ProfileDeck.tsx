import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import Deck from './Deck';

const { width } = Dimensions.get('window');

interface Post {
  type: 'good' | 'service';
  name: string;
  description: string;
  photos: string[];
}

interface ProfileDeckProps {
  posts: Post[];
  onToggleReveal?: () => void;
}

export default function ProfileDeck({ posts, onToggleReveal }: ProfileDeckProps) {
  // Count good and service posts
  const { goodCount, serviceCount } = useMemo(() => {
    const goodCount = posts.filter(post => post.type === 'good').length;
    const serviceCount = posts.filter(post => post.type === 'service').length;
    return { goodCount, serviceCount };
  }, [posts]);

  const handleTrade = () => {
    console.log('Trade button pressed');
    // Add your trade logic here
  };

  const handlePlus = () => {
    console.log('Plus button pressed');
    // Add your plus logic here
  };

  const handleMinus = () => {
    console.log('Minus button pressed');
    // Add your minus logic here
  };

  const handleToggleReveal = () => {
    console.log('Toggle reveal button pressed');
    if (onToggleReveal) {
      onToggleReveal();
    }
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
      <View style={styles.goodServiceRow}>
        <View style={styles.goodButton}>
          <Text style={styles.countText}>{goodCount}</Text>
          <FontAwesome6 name="cube" size={22} color="#ffffff" />
        </View>
        
        {/* Toggle reveal button */}
        <TouchableOpacity 
          style={styles.toggleButton}
          onPress={handleToggleReveal}
        >
          <FontAwesome6 name="arrow-up-long" size={22} color="#ffffff" />
          <FontAwesome6 name="arrow-down-long" size={22} color="#ffffff" />
        </TouchableOpacity>

        <View style={styles.serviceButton}>
          <Text style={styles.countText}>{serviceCount}</Text>
          <FontAwesome6 name="stopwatch" size={22} color="#ffffff" />
        </View>
      </View>
        
      <View style={styles.deckWrapper}>
        <Deck 
          posts={posts}
          cardWidth={Math.min(width - 40, 400)}
          enabled={true}
        />
      </View>

      {/* Button row with plus, trade, and minus buttons */}
      <View style={styles.buttonRow}>
        {/* plus button */}
        <TouchableOpacity 
          style={styles.plusButton}
          onPress={handlePlus}
        >
          <FontAwesome6 name="plus" size={22} color="#ffffff" />
        </TouchableOpacity>

        {/* Trade button */}
        <TouchableOpacity 
          style={styles.tradeButton}
          onPress={handleTrade}
        >
          <Text style={styles.tradeButtonText}>TRADE</Text>
        </TouchableOpacity>

        {/* minus button */}
        <TouchableOpacity 
          style={styles.minusButton}
          onPress={handleMinus}
        >
          <FontAwesome6 name="minus" size={22} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 400,
    position: 'relative',
    paddingHorizontal: 20,
    alignItems: 'center',
    bottom: 400,
  },
  deckWrapper: {
    marginBottom: 20,
    left: -12,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    top: 246,
  },
  goodServiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    top: -222,
    zIndex: 6,
  },
  plusButton: {
    width: 50,
    height: 50,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 25,
    backgroundColor: '#5c5579',
    justifyContent: 'center',
    alignItems: 'center',
  },
  minusButton: {
    width: 50,
    height: 50,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 25,
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
    backgroundColor: '#5c5579',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tradeButton: {
    backgroundColor: '#FFA600',
    paddingVertical: 13,
    paddingHorizontal: 26,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tradeButtonText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  countText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  goodButton: {
    width: 90,
    height: 40,
    flexDirection: 'row',
    gap: 8,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
    borderTopLeftRadius: 25,
    borderBottomLeftRadius: 4,
    backgroundColor: '#5c5579',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleButton: {
    width: 60,
    height: 40,
    borderRadius: 4,
    backgroundColor: '#FFA600',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  serviceButton: {
    width: 90,
    height: 40,
    flexDirection: 'row',
    gap: 8,
    borderTopRightRadius: 24,
    borderBottomRightRadius: 4,
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
    backgroundColor: '#5c5579',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
