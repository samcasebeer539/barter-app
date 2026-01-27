//contains feed overly with deck,  button layout, animation



import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity, Animated, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { FontAwesome6, MaterialIcons } from '@expo/vector-icons';
import { useState, useRef, useEffect } from 'react';
import Deck from '@/components/Deck';
import Icon from 'react-native-vector-icons/FontAwesome';




const FeedDeck: React.FC<PostCardWithDeckProps> = ({ 
  post, 
  deckPosts,
  cardWidth,
  scale = 1,
  onRevealChange,
  revealProgress,
  deckRevealed = false,
}) => {
const [showHeader, setShowHeader] = useState(true);
const [showDeck, setShowDeck] = useState(false);

const headerTranslateY = useRef(new Animated.Value(0)).current;

//for deck animation
  const deckTranslateY = useRef(new Animated.Value(-Dimensions.get('window').height)).current;