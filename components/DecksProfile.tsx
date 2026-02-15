import React, { useMemo, useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated, Image } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import Deck from './Deck';
import { defaultTextStyle, globalFonts, colors } from '../styles/globalStyles';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useRouter } from 'expo-router';

import TradeTurns, { TradeTurn, TradeTurnType } from '../components/TradeTurns';

const trade1Turns: TradeTurn[] = [
  { type: 'turnOffer', user: 'Jay Wilson', item: 'Fantasy Books', isUser: false  },

  
];


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
  const router = useRouter();
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
  const handleSettingsPress = () => {
    router.push('/settings');
  };

  // Calculate slide distance
  const slideDistance = 600;
  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, slideDistance],
  });

  const cardWidth = Math.min(width - 40, 400);

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Top controls row */}
      <View style={styles.goodServiceRow}>
        

        <View style={[
          styles.goodServiceButton, 
            {borderBottomLeftRadius: isDeckRevealed ? 2 : 25 }]}>

          <Text style={styles.buttonText}>1/2</Text>
          <FontAwesome6 name="user-astronaut" size={18} color={colors.cardTypes.user} />
          <Text style={styles.buttonText}>:  0{goodCount}</Text>
          <FontAwesome6 name="gifts" size={18} color={colors.cardTypes.good} />
          
          <Text style={styles.buttonText}> 0{serviceCount}</Text>
          <FontAwesome6 name="hand-sparkles" size={18} color={colors.cardTypes.service} />

        </View>
        
        {/* Toggle reveal button */}
        <TouchableOpacity 
          
          style={[
            styles.toggleButton, 
            {backgroundColor: isDeckRevealed ? 'transparent' : colors.actions.trade, borderBottomRightRadius: isDeckRevealed ? 2 : 2 }
          ]} 
          onPress={handleToggleReveal}
          disabled={!toggleEnabled}
        >
          <FontAwesome6 
            name={isDeckRevealed ? "angle-up" : "angle-down"} 
            size={26} 
            color={isDeckRevealed ? colors.actions.trade : '#000'} 
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
                    pronouns: "(she/he/they)",
                    location: "Santa Cruz, CA",
                    bio: "Pro Smasher",
                    profileImageUrl: 'https://picsum.photos/seed/bird/400/400'
                }}
                cardWidth={cardWidth}
                enabled={true}
              />
            </View>

            {/* always just one line - offer */}
            <View style={styles.turnsAndButtonRow}>
              <TradeTurns turns={trade1Turns} />
              <View style={styles.secondaryButtonRow}>
                

                <TouchableOpacity 
                  style={styles.selectButton}
                  onPress={handleSecondaryMinus}
                >
                  <Icon name="circle-o" size={22} color={colors.actions.trade} />
                </TouchableOpacity>
                
                <TouchableOpacity onPress={handleSecondaryTrade}>
                  <Text style={styles.tradeText}>TRADE</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.playButton}
                  onPress={handleSecondaryPlus}
                >
                  <FontAwesome6 name="arrow-left-long" size={26} color="#000" />
                </TouchableOpacity>


                

              </View>
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
                    pronouns: "(they/them)",
                    location: "Santa Cruz, CA",
                    bio: "UCSC 2026 for Computer Science, multimedia visual artist, sci-fi/fantasy reader, cat lover",
                    profileImageUrl: 'https://picsum.photos/seed/cat/400/400'
                }}
                cardWidth={cardWidth}
                enabled={true}
            />
          </View>

          {/* Primary button row */}
          <View style={styles.buttonRow}>
            

            <TouchableOpacity 
              style={styles.addButton}
              onPress={handlePlus}
            >
              <FontAwesome6 name="plus" size={24} color="#fff" />
            </TouchableOpacity>

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
              <FontAwesome6 name="arrow-down-up-across-line" size={22} color="#fff" />
              
            </TouchableOpacity>

            
            
           
            
            
            <View style={styles.mygoodServiceButton}>
              <View style={styles.imageContainer}>
                        <Image
                          
                          source={{ uri: 'https://picsum.photos/seed/cat/80/80' }} 
                          style={styles.profileImage}
                        />
                      </View>
              <Text style={styles.buttonText}>: 0{goodCount}</Text>
              <FontAwesome6 name="gifts" size={18} color={colors.cardTypes.good} />
              
              <Text style={styles.buttonText}> 0{serviceCount}</Text>
              <FontAwesome6 name="hand-sparkles" size={18} color={colors.cardTypes.service} />
            </View>


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
    bottom: 408,
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
    paddingTop: 240,
    paddingBottom: 280,
    bottom: 240,
    backgroundColor: colors.ui.background,
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
    width: 334,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 4,
    top: 266,
    left: 0,
  },
  secondaryButtonRow: {
    width: 338,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 4,
    top: -12,
    left: 0,
    shadowColor: colors.actions.trade,
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.9,
    shadowRadius: 3,
    elevation: 10,
    zIndex: 10,
  },
  goodServiceRow: {
    width: 334,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
    top: -240,
    left: 0,
    zIndex: 3,
    elevation: 3,
  },
  playButton: {
    width: 50,
    height: 40,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 25,
    borderTopLeftRadius: 25,
    borderBottomLeftRadius: 2,
    backgroundColor: colors.actions.trade,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tradeText: {
    color: colors.actions.trade,
    fontSize: 48,
    fontFamily: globalFonts.extrabold,
    top: -2,
    
  },
  toggleButton: {
    width: 50,
    height: 44,
    borderTopRightRadius: 25,
    borderBottomRightRadius: 2,
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
    
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.actions.trade,
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.9,
    shadowRadius: 3,
    borderWidth: 3,
    borderColor: colors.actions.trade

  },
  
  goodServiceButton: {
    
      
    height: 44,
    // width: 160,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
    borderTopLeftRadius: 25,
    
    backgroundColor: colors.ui.secondary,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingLeft: 18,
    paddingRight: 10,
    paddingVertical: 10,
    marginLeft: 'auto',
    
  },
  mygoodServiceButton: {
    
      
    height: 44,
    // width: 160,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 25,
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
    
    backgroundColor: colors.ui.secondary,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingLeft: 10,
    paddingRight: 14,
    paddingVertical: 2,
    
    
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 20,
    fontFamily: globalFonts.bold,
  },
  selectButton: {
    width: 50,
    height: 40,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
    borderTopLeftRadius: 25,
    borderBottomLeftRadius: 25,
    borderWidth: 3,
    borderColor: colors.actions.trade,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 'auto',
  },

  editButton: {
    width: 50,
    height: 44,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
    backgroundColor: colors.ui.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    
  },
  sendForwardButton: {
    width: 50,
    height: 44,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
    backgroundColor: colors.ui.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 0,
  },
  sendBackButton: {
    width: 50,
    height: 44,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
    backgroundColor: colors.ui.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    width: 50,
    height: 44,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 25,
    backgroundColor: colors.ui.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsButton: {
    width: 50,
    height: 44,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
    borderTopLeftRadius: 25,
    borderBottomLeftRadius: 25,
    backgroundColor: colors.ui.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  turnsAndButtonRow: {
    width: 338,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start', // Changed from flex-end
    
    top: 261,
    left: 0, // Changed from -200
    zIndex: 10,
    
  },
  profileImage: {
    width: 22,
    height: 22,
    borderRadius: 80,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
});