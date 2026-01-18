import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function BarterScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
});
