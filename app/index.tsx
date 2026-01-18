import { View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      
      <Text style={styles.title}>🔄 Barter App</Text>
      <Text style={styles.subtitle}>Trade goods & services without money</Text>
      
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>Welcome to Barter!</Text>
        <Text style={styles.infoText}>
          • Browse available trades in the Barter tab{'\n'}
          • Create your own listings{'\n'}
          • Connect with other barterers{'\n'}
          • Trade without using money
        </Text>
      </View>
      
      <Text style={styles.footer}>Built with React Native + Expo</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 40,
    textAlign: 'center',
  },
  infoContainer: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    width: '100%',
    maxWidth: 350,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    color: '#999',
    fontSize: 12,
  },
});
