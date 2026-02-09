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
  toggleEnabled?: boolean;
  isDeckRevealed?: boolean;
}

export default function ProfileDeck({ posts, onToggleReveal, toggleEnabled = false, isDeckRevealed = false  }: ProfileDeckProps) {
  const { goodCount, serviceCount } = useMemo(() => {
    const goodCount = posts.filter(post => post.type === 'good').length;
    const serviceCount = posts.filter(post => post.type === 'service').length;
    return { goodCount, serviceCount };
  }, [posts]);

  const handleTrade = () => {
    console.log('Trade button pressed');
  };

  const handlePlus = () => {
    console.log('Plus button pressed');
  };

  const handleMinus = () => {
    console.log('Minus button pressed');
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
        

        
        <View style={styles.goodServiceButton}>
          <Text style={styles.buttonText}>{goodCount}</Text>
          <FontAwesome6 name="cube" size={22} color={colors.cardTypes.good} />
          <Text style={styles.buttonText}> </Text>
          <Text style={styles.buttonText}>{serviceCount}</Text>
          <FontAwesome6 name="stopwatch" size={22} color={colors.cardTypes.service} />
        </View>
        {/* Toggle reveal button */}
        <TouchableOpacity 
          style={[styles.toggleButton, !toggleEnabled && styles.toggleButtonDisabled, isDeckRevealed && styles.toggleButtonDisabled]}
          onPress={handleToggleReveal}
          disabled={!toggleEnabled}
        >
          <FontAwesome6 name={isDeckRevealed ? "caret-down" : "caret-up"}  size={32} color='#fff' />
          
        </TouchableOpacity>
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
        <TouchableOpacity 
          style={styles.playButton}
          onPress={handlePlus}
        >
          <FontAwesome6 name="arrow-right-long" size={22} color="#000" />
        </TouchableOpacity>

        <TouchableOpacity onPress={handleTrade} >
            <Text style={styles.tradeText}>TRADE</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.selectButton}
          onPress={handleMinus}
        >
          <Icon name="circle-o" size={22} color={colors.actions.trade} />
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
    width: 310,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
    top: 247,
    left: -10,
  },
  goodServiceRow: {
    width: 200,
    flexDirection: 'row',
    gap: 4,
    top: -240,
    left: 44,
    zIndex: 0,
  },
  playButton: {
    width: 54,
    height: 42,
    borderTopRightRadius: 25,
    borderBottomRightRadius: 2,
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 25,
    backgroundColor: colors.actions.trade,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusMinusButton: {
    width: 60,
    height: 40,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 25,
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
    backgroundColor: colors.ui.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tradeText: {
      color: colors.actions.trade,
      fontSize: 52,
      fontFamily: globalFonts.extrabold,
      top: -3
  },
  tradeButton: {
    backgroundColor: colors.actions.trade,
    height: 50,
    paddingHorizontal: 26,
    borderRadius: 2,
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
  toggleButton: {
    width: 54,
    height: 42,
    borderTopRightRadius: 25,
    borderBottomRightRadius: 2,
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
    backgroundColor: colors.actions.trade,
    justifyContent: 'center',
    alignItems: 'center',
    
  },
  toggleButtonDisabled: {
    backgroundColor: colors.ui.secondary,
  },
  goodServiceButton: {
    flex: 1,
    height: 42,
    flexDirection: 'row',
    gap: 8,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
    borderTopLeftRadius: 25,
    borderBottomLeftRadius: 2,
    backgroundColor: colors.ui.secondary,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 24,
    fontFamily: globalFonts.bold
  },
  selectButton: {
    width: 54,
    height: 42,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 25,
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 25,
    borderWidth: 3,
    borderColor: colors.actions.trade,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 'auto',
  },
});