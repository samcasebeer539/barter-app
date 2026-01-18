import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';


export default function BarterScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
   
    <View style={styles.container}>
      <StatusBar style="light" />
    </View>
  </ScrollView>


  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#141414',
  },
  scrollContent: {
    paddingTop: 60,
  },
  cardWrapper: {
    alignItems: 'center',
    marginTop: 16,
  },
});
