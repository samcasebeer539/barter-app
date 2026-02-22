  import React, { useMemo, useRef, useEffect, useState } from 'react';
  import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated } from 'react-native';
  import { FontAwesome6 } from '@expo/vector-icons';
  import Icon from 'react-native-vector-icons/FontAwesome';
  import { useRouter } from 'expo-router';

  import Deck from './Deck';
  import TradeTurns, { TradeTurn } from '../components/TradeTurns';
  import { globalFonts, colors } from '../styles/globalStyles';

  const SLIDE_DISTANCE = 600;
  const { width } = Dimensions.get('window');

  const trade1Turns: TradeTurn[] = [
    { type: 'turnOffer', user: 'Jay Wilson', item: 'Fantasy Books', isUser: false },
  ];

  const PRIMARY_USER = {
    name: 'Sam Casebeer',
    pronouns: '(they/them)',
    location: 'Santa Cruz, CA',
    bio: 'UCSC 2026 for Computer Science, multimedia visual artist, sci-fi/fantasy reader, cat lover',
    profileImageUrl: 'https://picsum.photos/seed/cat/400/400',
  };

  const SECONDARY_USER = {
    name: 'Jay Wilson',
    pronouns: '(she/he/they)',
    location: 'Santa Cruz, CA',
    bio: 'Pro Smasher',
    profileImageUrl: 'https://picsum.photos/seed/bird/400/400',
  };

  export interface Post {
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
    isDeckRevealed = false,
  }: ProfileDeckProps) {
    const router = useRouter();
    const slideAnim = useRef(new Animated.Value(0)).current;
    const [showSecondary, setShowSecondary] = useState(false);

    const { goodCount, serviceCount } = useMemo(() => ({
      goodCount: posts.filter(p => p.type === 'good').length,
      serviceCount: posts.filter(p => p.type === 'service').length,
    }), [posts]);

    useEffect(() => {
      if (isDeckRevealed) setShowSecondary(true);

      Animated.spring(slideAnim, {
        toValue: isDeckRevealed ? 1 : 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start(() => {
        if (!isDeckRevealed) setShowSecondary(false);
      });
    }, [isDeckRevealed]);

    const cardWidth = Math.min(width - 40, 400);
    const translateY = slideAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, SLIDE_DISTANCE],
    });

    return (
      <View style={styles.container} pointerEvents="box-none">
        {/* offers bar */}
        <View style={styles.goodServiceRow}>
          <View style={[styles.goodServiceButton, { borderBottomLeftRadius: isDeckRevealed ? 2 : 25 }]}>
            <Text style={styles.offerText}>OFFERS: </Text>
            <Text style={styles.secondaryText}>1/2 :  0{goodCount}</Text>
            <FontAwesome6 name="gifts" size={18} color={colors.ui.secondarydisabled} />
            <Text style={styles.secondaryText}> 0{serviceCount}</Text>
            <FontAwesome6 name="hand-sparkles" size={18} color={colors.ui.secondarydisabled} />
          </View>

          <TouchableOpacity
            style={styles.toggleButton}
            onPress={onToggleReveal}
            disabled={!toggleEnabled}
          >
            
            <FontAwesome6
              name={isDeckRevealed ? 'angle-up' : 'angle-down'}
              size={26}
              color={colors.actions.offer}
            />
          </TouchableOpacity>
        </View>

        {/* Decks */}
        <View style={styles.decksContainer}>

          {/* Secondary deck */}
          {showSecondary && secondaryPosts.length > 0 && (
            <View style={styles.secondaryDeckContainer}>
              <View style={styles.deckWrapper}>
                <Deck posts={secondaryPosts} user={SECONDARY_USER} cardWidth={cardWidth} enabled />
              </View>

              <View style={styles.turnsAndButtonRow}>
                <View style={styles.secondaryButtonRow}>
                  <TouchableOpacity style={styles.selectButton} onPress={() => {}}>
                    <Icon name="circle-o" size={22} color={colors.actions.trade} />
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => {}}>
                    <Text style={styles.tradeText}>TRADE</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.playButton} onPress={() => {}}>
                    <FontAwesome6 name="arrow-left-long" size={26} color="#000" />
                  </TouchableOpacity>
                </View>

                <View style={styles.tradeRow}>
                  <TradeTurns turns={trade1Turns} />
                </View>
              </View>
            </View>
          )}

          {/* Primary deck (animated drawer) */}
          <Animated.View style={[styles.deckAndButtonsContainer, { transform: [{ translateY }] }]}>
            <View style={styles.deckWrapper}>
              <Deck posts={posts} user={PRIMARY_USER} cardWidth={cardWidth} enabled />
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity style={[styles.iconButton, styles.addButton]} onPress={() => router.push('/settings')}>
                <FontAwesome6 name="plus" size={24} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.iconButton} onPress={() => {}}>
                <FontAwesome6 name="sliders" size={22} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.iconButton} onPress={() => {}}>
                <FontAwesome6 name="arrow-down-up-across-line" size={22} color="#fff" />
              </TouchableOpacity>

            
              <View style={styles.mygoodServiceButton}>
                <Text style={[styles.goodText, ]}>0{goodCount}</Text>
                <FontAwesome6 name="gifts" size={20} color={colors.cardTypes.good} />
                <Text style={styles.serviceText}> 0{serviceCount}</Text>
                <FontAwesome6 name="hand-sparkles" size={20} color={colors.cardTypes.service} />
              </View>

            

              
            </View>
          </Animated.View>

        </View>
      </View>
    );
  }

  const roundedButton = {
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
    backgroundColor: colors.ui.secondary,
  };

  const styles = StyleSheet.create({
    container: {
      width: '100%',
      maxWidth: 400,
      position: 'relative',
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
    buttonRow: {
      width: 334,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
      gap: 4,
      top: 266,
    },
    secondaryButtonRow: {
      width: 338,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
      gap: 4,
      top: -12,
      elevation: 10,
      zIndex: 10,
    },
    tradeRow: {
      width: 338,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
      gap: 4,
      top: -27,
      elevation: 10,
      zIndex: 10,
    },
    goodServiceRow: {
      width: 334,
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 4,
      top: -240,
      zIndex: 3,
      elevation: 3,

    },
    turnsAndButtonRow: {
      width: 338,
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      top: 261,
      zIndex: 10,
    },
    goodServiceButton: {
      height: 36,
      flexDirection: 'row',
      flex: 1,
      gap: 4,
      borderTopRightRadius: 2,
      borderBottomRightRadius: 2,
      borderTopLeftRadius: 25,
      backgroundColor: colors.ui.secondary,
      justifyContent: 'flex-start',
      alignItems: 'center',
      paddingLeft: 18,
      paddingRight: 10, 
      paddingVertical: 6,
      marginLeft: 'auto'
    },
    mygoodServiceButton: {
      height: 44,
      flexDirection: 'row',
      flex: 1,
      gap: 4,
      borderTopLeftRadius: 2,
      borderBottomLeftRadius: 2,
      borderTopRightRadius: 2,
      borderBottomRightRadius: 25,
      backgroundColor: colors.ui.secondary,
      justifyContent: 'flex-start',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 10,
    },
    toggleButton: {
      width: 50,
      height: 36,
      borderTopRightRadius: 25,
      borderBottomRightRadius: 2,
      borderTopLeftRadius: 2,
      borderBottomLeftRadius: 2,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 3,
      borderColor: colors.actions.offer,
    },
    playButton: {
      width: 50,
      height: 40,
      borderTopRightRadius: 25,
      borderBottomRightRadius: 2,
      borderTopLeftRadius: 2,
      borderBottomLeftRadius: 25,
      backgroundColor: colors.actions.trade,
      justifyContent: 'center',
      alignItems: 'center',
    },
    selectButton: {
      flex: 1,
      height: 40,
      borderTopRightRadius: 2,
      borderBottomRightRadius: 25,
      borderTopLeftRadius: 2,
      borderBottomLeftRadius: 25,
      borderWidth: 3,
      borderColor: colors.actions.trade,
      justifyContent: 'center',
      alignItems: 'center',
    },
    iconButton: {
      ...roundedButton,
      width: 50,
      height: 44,
    },
    addButton: {
      borderBottomLeftRadius: 25,
    },
    secondaryText: {
      color: colors.ui.secondarydisabled,
      fontSize: 20,
      fontFamily: globalFonts.bold,
    },
    goodText: {
      color: colors.cardTypes.good,
      fontSize: 20,
      fontFamily: globalFonts.bold,
    },
    serviceText: {
      color: colors.cardTypes.service,
      fontSize: 20,
      fontFamily: globalFonts.bold,
    },
    offerText: {
      color: colors.actions.offer,
      fontSize: 20,
      fontFamily: globalFonts.bold,
    },
    tradeText: {
      color: colors.actions.trade,
      fontSize: 48,
      fontFamily: globalFonts.extrabold,
      top: -2,
      letterSpacing: -2,
    },
  });