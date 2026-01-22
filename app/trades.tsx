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
        
        {/* Single Active Trade */}
        <View style={styles.tradeSection}>
          <Text style={styles.tradeText}>
            — Jay sent <Text style={styles.highlightBlue}>offer</Text> on "Item"
          </Text>
          <Text style={styles.tradeText}>
            ├─ You proposed <Text style={styles.highlightYellow}>trade</Text> for "item"
          </Text>
          <Text style={styles.tradeText}>
            ├─ Jay proposed <Text style={styles.highlightPink}>counteroffer</Text>
          </Text>
          <TouchableOpacity onPress={handleYourTurnPress} activeOpacity={0.7}>
            <Text style={styles.yourTurnText}>└─ Your turn!</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Outgoing Offers Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Outgoing Offers</Text>
        
        {/* Outgoing Offer 1 */}
        <View style={styles.tradeSection}>
          <Text style={styles.tradeText}>
            — You sent <Text style={styles.highlightBlue}>offer</Text> on "item"
          </Text>
        </View>

        {/* Outgoing Offer 2 */}
        <View style={styles.tradeSection}>
          <Text style={styles.tradeText}>
            — You sent <Text style={styles.highlightBlue}>offer</Text> on "item"
          </Text>
        </View>

        {/* Outgoing Offer 3 */}
        <View style={styles.tradeSection}>
          <Text style={styles.tradeText}>
            — You sent <Text style={styles.highlightBlue}>offer</Text> on "item"
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
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  tradeSection: {
    gap: 4,
    marginBottom: 20,
  },
  tradeText: {
    fontSize: 16,
    color: '#E0E0E0',
    lineHeight: 24,
  },
  yourTurnText: {
    fontSize: 16,
    color: '#34C759',
    fontWeight: '600',
    lineHeight: 24,
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
