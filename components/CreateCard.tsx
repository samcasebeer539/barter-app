import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface CreateCardProps {
  scale?: number;
  cardWidth?: number;
}

const CreateCard: React.FC<CreateCardProps> = ({ scale = 1, cardWidth }) => {
  const screenWidth = Dimensions.get('window').width;
  const defaultCardWidth = Math.min(screenWidth - 64, 400);
  const finalCardWidth = cardWidth ?? defaultCardWidth;
  const cardHeight = finalCardWidth * (3.5 / 2.5);

  return (
    <View
      style={[styles.container, { transform: [{ scale }] }]}
    >
      <View style={[styles.card, { width: finalCardWidth, height: cardHeight }]}>
        <MaterialIcons name="add" size={60} color="#000" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.2,
    shadowRadius: 40,
    elevation: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CreateCard;
