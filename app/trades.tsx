import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function TradesScreen() {
  const router = useRouter();
  const [activeTradesExpanded, setActiveTradesExpanded] = useState(true);
  const [outgoingOffersExpanded, setOutgoingOffersExpanded] = useState(true);
  const [declinedExpiredExpanded, setDeclinedExpiredExpanded] = useState(false);

  const handleYourTurnPress = () => {
    router.push('/barter');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Active Trades Section */}
      <View style={styles.section}>
        <TouchableOpacity 
          style={styles.sectionHeader}
          onPress={() => setActiveTradesExpanded(!activeTradesExpanded)}
          activeOpacity={0.7}
        >
          <Text style={styles.sectionTitle}>Active Trades</Text>
          <MaterialIcons 
            name={activeTradesExpanded ? "expand-less" : "expand-more"} 
            size={28} 
            color="#fff" 
          />
        </TouchableOpacity>
        
        {activeTradesExpanded && (
          <>
            {/* Single Active Trade */}
            <View style={styles.tradeSection}>
              <Text style={styles.tradeText}>
                <Text style={styles.heavyChar}>┬─</Text> Jay sent <Text style={styles.highlightBlue}>OFFER</Text> on "Vintage Books"
              </Text>
              <Text style={styles.tradeText}>
                <Text style={styles.heavyChar}>├─</Text> You proposed <Text style={styles.highlightYellow}>TRADE</Text> for "Pokemon Cards"
              </Text>
              <Text style={styles.tradeText}>
                <Text style={styles.heavyChar}>├─</Text> Jay proposed <Text style={styles.highlightPink}>COUNTEROFFER</Text>
              </Text>
              <TouchableOpacity onPress={handleYourTurnPress} activeOpacity={0.7}>
                <Text style={styles.yourTurnText}>
                  <Text style={styles.heavyChar}>└─</Text> Your turn! <Text style={styles.arrow}>⟶</Text>
                </Text>
              </TouchableOpacity>
            </View>

            {/* Single Active Trade */}
            <View style={styles.tradeSection}>
              <Text style={styles.tradeText}>
                <Text style={styles.heavyChar}>┬─</Text> You sent <Text style={styles.highlightBlue}>OFFER</Text> on "Item"
              </Text>
              <Text style={styles.tradeText}>
                <Text style={styles.heavyChar}>├─</Text> Jay proposed <Text style={styles.highlightYellow}>TRADE</Text> for "item"
              </Text>
              <Text style={styles.tradeText}>
                <Text style={styles.heavyChar}>└─</Text> You asked <Text style={styles.highlightPurple}>QUESTION</Text>
              </Text>
            </View>
          </>
        )}
      </View>

      {/* Outgoing Offers Section */}
      <View style={styles.section}>
        <TouchableOpacity 
          style={styles.sectionHeader}
          onPress={() => setOutgoingOffersExpanded(!outgoingOffersExpanded)}
          activeOpacity={0.7}
        >
          <Text style={styles.sectionTitle}>Outgoing Offers</Text>
          <MaterialIcons 
            name={outgoingOffersExpanded ? "expand-less" : "expand-more"} 
            size={28} 
            color="#fff" 
          />
        </TouchableOpacity>
        
        {outgoingOffersExpanded && (
          <>
            {/* Outgoing Offer 1 */}
            <View style={styles.tradeSection}>
              <Text style={styles.tradeText}>
                <Text style={styles.heavyChar}>─</Text> You sent <Text style={styles.highlightBlue}>OFFER</Text> on "item"
              </Text>
            </View>

            {/* Outgoing Offer 2 */}
            <View style={styles.tradeSection}>
              <Text style={styles.tradeText}>
                <Text style={styles.heavyChar}>─</Text> You sent <Text style={styles.highlightBlue}>OFFER</Text> on "item"
              </Text>
            </View>

            {/* Outgoing Offer 3 */}
            <View style={styles.tradeSection}>
              <Text style={styles.tradeText}>
                <Text style={styles.heavyChar}>─</Text> You sent <Text style={styles.highlightBlue}>OFFER</Text> on "item"
              </Text>
            </View>
          </>
        )}
      </View>

      {/* Declined/Expired Offers Section */}
      <View style={styles.section}>
        <TouchableOpacity 
          style={styles.sectionHeader}
          onPress={() => setDeclinedExpiredExpanded(!declinedExpiredExpanded)}
          activeOpacity={0.7}
        >
          <Text style={styles.sectionTitle}>Declined/Expired Offers</Text>
          <MaterialIcons 
            name={declinedExpiredExpanded ? "expand-less" : "expand-more"} 
            size={28} 
            color="#fff" 
          />
        </TouchableOpacity>
        
        {declinedExpiredExpanded && (
          <>
            {/* Declined Offer 1 */}
            <View style={styles.tradeSection}>
              <Text style={styles.tradeText}>
                <Text style={styles.heavyChar}>─</Text> Jay declined your <Text style={styles.highlightBlue}>OFFER</Text> on "item"
              </Text>
            </View>

            {/* Expired Offer 1 */}
            <View style={styles.tradeSection}>
              <Text style={styles.tradeText}>
                <Text style={styles.heavyChar}>─</Text> Your <Text style={styles.highlightBlue}>OFFER</Text> on "item" expired
              </Text>
            </View>
          </>
        )}
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
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
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
  heavyChar: {
    fontWeight: '900',
    fontSize: 16,
  },
  arrow: {
    fontSize: 20,
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
  highlightPurple: {
    color: '#a73bff',
    fontWeight: '600',
  },
});
