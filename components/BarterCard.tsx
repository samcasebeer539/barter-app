import React from 'react';
import { View, Image, StyleSheet, ImageSourcePropType } from 'react-native';

interface BarterCardProps {
  title: string;
  photo: ImageSourcePropType;
}

const BarterCard: React.FC<BarterCardProps> = ({ title, photo }) => {
  return (
    <View style={styles.card}>
      <Image source={photo} style={styles.photo} resizeMode="cover" />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 200,
    height: 280,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
});

export default BarterCard;
