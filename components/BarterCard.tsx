import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

interface BarterCardProps {
  title: string;
  photo: string;
}

const BarterCard: React.FC<BarterCardProps> = ({ title, photo }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Image source={{ uri: photo }} style={styles.photo} resizeMode="cover" />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 220,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
    textAlign: 'center',
  },
  photo: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
});

export default BarterCard;
