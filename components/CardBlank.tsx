

import React from 'react';
import { View, Text, StyleSheet, Dimensions, Image, TouchableOpacity } from 'react-native';

import { globalFonts, colors } from '../styles/globalStyles';






interface UserCardProps {
  scale?: number;
  cardWidth?: number;
}

const UserCard: React.FC<UserCardProps> = ({  scale = 1, cardWidth,  }) => {
  const screenWidth = Dimensions.get('window').width;
  const defaultCardWidth = Math.min(screenWidth - 64, 400);
  const finalCardWidth = cardWidth ?? defaultCardWidth;
  const cardHeight = finalCardWidth * (3.5 / 2.5);




 

  return (
    <View style={[styles.container, { transform: [{ scale }] }]}>
      <View style={[styles.card, { width: finalCardWidth, height: cardHeight }]}>
        


       
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: 'transparent',
    
  },
    card: {
    backgroundColor: '#ffffff',
    borderRadius: 6,
 
    position: 'relative',


  },

  
});

export default UserCard;