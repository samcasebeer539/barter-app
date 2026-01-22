import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';

export default function TradesScreen() {
  const router = useRouter();

  const handleYourTurnPress = () => {
    router.push('/barter');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Active Trades Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Active Trades</Text>
        
        {/* Trade Item 1 */}
        <View style={styles.tradeCard}>
          <Text style={styles.tradeText}>
            Jay sent <Text style={styles.highlightBlue}>offer</Text> on "Item"
          </Text>
        </View>

        {/* Trade Item 2 */}
        <View style={styles.tradeCard}>
          <Text style={styles.tradeText}>
            You proposed <Text style={styles.highlightYellow}>trade</Text> for "item"
          </Text>
        </View>

        {/* Trade Item 3 */}
        <View style={styles.tradeCard}>
          <Text style={styles.tradeText}>
            Jay proposed <Text style={styles.highlightPink}>counteroffer</Text>
          </Text>
        </View>

        {/* Trade Item 4 - Your Turn (clickable) */}
        <TouchableOpacity 
          style={styles.tradeCard} 
          onPress={handleYourTurnPress}
          activeOpacity={0.7}
        >
          <Text style={styles.yourTurnText}>Your turn!</Text>
        </TouchableOpacity>
      </View>

      {/* Outgoing Offers Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Outgoing Offers</Text>
        
        {/* Outgoing Offer 1 */}
        <View style={styles.tradeCard}>
          <Text style={styles.tradeText}>
            You sent <Text style={styles.highlightBlue}>offer</Text> on "item"
          </Text>
        </View>

        {/* Outgoing Offer 2 */}
        <View style={styles.tradeCard}>
          <Text style={styles.tradeText}>
            You sent <Text style={styles.highlightBlue}>offer</Text> on "item"
          </Text>
        </View>

        {/* Outgoing Offer 3 */}
        <View style={styles.tradeCard}>
          <Text style={styles.tradeText}>
            You sent <Text style={styles.highlightBlue}>offer</Text> on "item"
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#141414',
  },
  contentContainer: {
    padding: 20,
    paddingTop: 60,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  tradeCard: {
    backgroundColor: '#1E1E1E',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  tradeText: {
    fontSize: 16,
    color: '#E0E0E0',
    lineHeight: 22,
  },
  yourTurnText: {
    fontSize: 16,
    color: '#34C759',
    fontWeight: '600',
    lineHeight: 22,
  },
  highlightBlue: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  highlightYellow: {
    color: '#FFA600',
    fontWeight: '600',
  },
  highlightPink: {
    color: '#FF3B81',
    fontWeight: '600',
  },
});
