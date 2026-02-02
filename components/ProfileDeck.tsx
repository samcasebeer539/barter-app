import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import Deck from './Deck';
import { defaultTextStyle, globalFonts, colors } from '../styles/globalStyles';
import Icon from 'react-native-vector-icons/FontAwesome';

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
          style={styles.playButton}
          onPress={handlePlus}
        >
          <FontAwesome6 name="arrow-right-long" size={22} color="#ffffff" />
        </TouchableOpacity>

        {/* Trade button */}
        {/* <TouchableOpacity 
          style={styles.tradeButton}
          onPress={handleTrade}
        >
          <Text style={styles.tradeButtonText}>TRADE</Text>
        </TouchableOpacity> */}

        <TouchableOpacity onPress={handleTrade} >
            <Text style={styles.tradeText}>TRADE</Text>
        </TouchableOpacity>

        {/* minus button */}
        <TouchableOpacity 
          style={styles.plusMinusButton}
          onPress={handleMinus}
        >
          <Icon name={'circle-o'} size={22} color='#FFFFFF' />
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
    paddingHorizontal: 0,
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
    top: 236,
  },
  goodServiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    top: -222,
    zIndex: 6,
  },
  playButton: {
    width: 60,
    height: 40,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
    borderTopLeftRadius: 25,
    borderBottomLeftRadius: 4,
    backgroundColor: colors.ui.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusMinusButton: {
    width: 60,
    height: 40,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 25,
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
    backgroundColor: colors.ui.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tradeText: {
      color: colors.actions.trade,
      fontSize: 54,
      fontFamily: globalFonts.extrabold,
    },
  tradeButton: {
    backgroundColor: colors.actions.trade,
    height: 50,
    paddingHorizontal: 26,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tradeButtonText: {
    color: '#ffffff',
    fontSize: 24,
    
    fontFamily: globalFonts.bold
  },
  countText: {
    color: '#ffffff',
    fontSize: 24,
    fontFamily: globalFonts.bold
  },
  goodButton: {
    width: 100,
    height: 40,
    flexDirection: 'row',
    gap: 8,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
    borderTopLeftRadius: 25,
    borderBottomLeftRadius: 4,
    backgroundColor: colors.ui.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleButton: {
    width: 50,
    height: 40,
    borderRadius: 4,
    backgroundColor: colors.actions.trade,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap:0
  },
  serviceButton: {
    width: 100,
    height: 40,
    flexDirection: 'row',
    gap: 8,
    borderTopRightRadius: 24,
    borderBottomRightRadius: 4,
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
    backgroundColor: colors.ui.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
