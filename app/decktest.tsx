import React from 'react';
import { View, StyleSheet } from 'react-native';
import DeckTest from '@/components/DeckTest';

export default function DeckTestScreen() {
  return (
    <View style={styles.container}>
      <DeckTest />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#141414',
  },
});
