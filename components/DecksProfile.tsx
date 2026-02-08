import React, { useMemo, useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated } from 'react-native';
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
  secondaryPosts?: Post[];
  onToggleReveal?: () => void;
  toggleEnabled?: boolean;
  isDeckRevealed?: boolean;
}

export default function ProfileDeck({ 
  posts, 
  secondaryPosts = [],
  onToggleReveal, 
  toggleEnabled = false, 
  isDeckRevealed = false 
}: ProfileDeckProps) {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [showSecondary, setShowSecondary] = useState(false);
  
  const { goodCount, serviceCount } = useMemo(() => {
    const goodCount = posts.filter(post => post.type === 'good').length;
    const serviceCount = posts.filter(post => post.type === 'service').length;
    return { goodCount, serviceCount };
  }, [posts]);

  // Animate when isDeckRevealed changes
  useEffect(() => {
    if (isDeckRevealed) {
      // Show secondary deck immediately when opening
      setShowSecondary(true);
    }
    
    Animated.spring(slideAnim, {
      toValue: isDeckRevealed ? 1 : 0,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start(() => {
      // Hide secondary deck after animation completes when closing
      if (!isDeckRevealed) {
        setShowSecondary(false);
      }
    });
  }, [isDeckRevealed, slideAnim]);

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
    onToggleReveal?.();
  };

  const handleSecondaryTrade = () => {
    console.log('Secondary trade button pressed');
  };

  const handleSecondaryPlus = () => {
    console.log('Secondary plus button pressed');
  };

  const handleSecondaryMinus = () => {
    console.log('Secondary minus button pressed');
  };

  // Calculate slide distance
  const slideDistance = 566;
  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, slideDistance],
  });

  const cardWidth = Math.min(width - 40, 400);

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Top controls row */}
      <View style={styles.goodServiceRow}>
        <TouchableOpacity 
            style={styles.settingsButton}
            onPress={handlePlus}
        >
            <FontAwesome6 name="gear" size={22} color="#fff" />
        </TouchableOpacity>

        <View style={styles.goodServiceButton}>
          <Text style={styles.buttonText}>{goodCount}</Text>
          <FontAwesome6 name="cube" size={22} color={colors.cardTypes.good} />
          <Text style={styles.buttonText}> </Text>
          <Text style={styles.buttonText}>{serviceCount}</Text>
          <FontAwesome6 name="stopwatch" size={22} color={colors.cardTypes.service} />
        </View>
        
        {/* Toggle reveal button */}
        <TouchableOpacity 
          style={[
            styles.toggleButton, 
            (!toggleEnabled || isDeckRevealed) && styles.toggleButtonDisabled
          ]}
          onPress={handleToggleReveal}
          disabled={!toggleEnabled}
        >
          <FontAwesome6 
            name={isDeckRevealed ? "caret-down" : "caret-up"} 
            size={32} 
            color="#fff" 
          />
        </TouchableOpacity>
      </View>
      
      {/* Container for both decks */}
      <View style={styles.decksContainer}>

        {/* Secondary deck (revealed when drawer opens) */}
        {showSecondary && secondaryPosts.length > 0 && (
          <View style={styles.secondaryDeckContainer}>
            <View style={styles.secondaryDeckWrapper}>
              <Deck 
                posts={secondaryPosts}
                user={{
                    name: "Jay Wilson",
                    location: "Santa Cruz, CA",
                    bio: "Pro Smasher",
                    profileImageUrl: 'https://picsum.photos/seed/bird/400/400'
                }}
                cardWidth={cardWidth}
                enabled={true}
              />
            </View>

            {/* Secondary button row */}
            <View style={styles.secondaryButtonRow}>
              
              <TouchableOpacity onPress={handleSecondaryTrade}>
                <Text style={styles.tradeText}>TRADE</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.selectButton}
                onPress={handleSecondaryMinus}
              >
                <Icon name="circle-o" size={22} color={colors.actions.trade} />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.playButton}
                onPress={handleSecondaryPlus}
              >
                <FontAwesome6 name="arrow-right-long" size={22} color="#000" />
              </TouchableOpacity>

            </View>
          </View>
        )}

        {/* Animated container wrapping primary deck and buttons (the drawer) */}
        <Animated.View 
          style={[
            styles.deckAndButtonsContainer,
            { transform: [{ translateY }] }
          ]}
        >
          {/* Primary Deck */}
          <View style={styles.deckWrapper}>
            <Deck 
                posts={posts}
                user={{
                    name: "Sam Casebeer",
                    location: "Santa Cruz, CA",
                    bio: "Passionate about sustainable living and building community through sharing. Always looking for unique trades and meaningful connections.",
                    profileImageUrl: 'https://picsum.photos/seed/cat/400/400'
                }}
                cardWidth={cardWidth}
                enabled={true}
            />
          </View>

          {/* Primary button row */}
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={handlePlus}
            >
              <FontAwesome6 name="sliders" size={22} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.sendForwardButton}
              onPress={handlePlus}
            >
              <FontAwesome6 name="square-caret-left" size={22} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.sendBackButton}
              onPress={handlePlus}
            >
              <FontAwesome6 name="square-caret-right" size={22} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={handlePlus}
            >
              <FontAwesome6 name="plus" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </Animated.View>

    
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
    overflow: 'visible',
  },
  decksContainer: {
    width: '100%',
    position: 'relative',
    alignItems: 'center',
    overflow: 'visible',
    minHeight: 800,
  },
  deckAndButtonsContainer: {
    width: '100%',
    alignItems: 'center',
    zIndex: 2,
    elevation: 2,

  },
  deckWrapper: {
    marginBottom: 20,
    left: -12,
  },
  secondaryDeckContainer: {
    position: 'absolute',
    top: 0,
    width: '100%',
    alignItems: 'center',
    zIndex: 1,
    elevation: 1,
  },
  secondaryDeckWrapper: {
    marginBottom: 20,
    left: -12,
  },
  buttonRow: {
    width: 330,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 4,
    top: 266,
    left: 0,
  },
  secondaryButtonRow: {
    width: 330,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
    top: 247,
    left: 0,
  },
  goodServiceRow: {
    width: 330,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
    top: -240,
    left: 0,
    zIndex: 3,
    elevation: 3,
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
  tradeText: {
    color: colors.actions.trade,
    fontSize: 52,
    fontFamily: globalFonts.extrabold,
    top: -3,
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
    
    height: 42,
    width: 142,
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
    marginLeft: 'auto'
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 24,
    fontFamily: globalFonts.bold,
  },
  selectButton: {
    width: 54,
    height: 42,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 25,
    borderWidth: 3,
    borderColor: colors.actions.trade,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 'auto',
  },

  editButton: {
    width: 54,
    height: 42,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 25,
    backgroundColor: colors.ui.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendForwardButton: {
    width: 54,
    height: 42,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
    backgroundColor: colors.ui.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBackButton: {
    width: 54,
    height: 42,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
    backgroundColor: colors.ui.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    width: 54,
    height: 42,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 25,
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
    backgroundColor: colors.ui.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsButton: {
    width: 54,
    height: 42,
    borderTopRightRadius: 25,
    borderBottomRightRadius: 2,
    borderTopLeftRadius: 25,
    borderBottomLeftRadius: 2,
    backgroundColor: colors.ui.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});