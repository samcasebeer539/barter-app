//Reusable component for displaying offer sections
//Can be used for:
//  - Sent Offers (outgoing offers)
//  - Declined/Expired Offers (rejected or expired)

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import React, { useState } from 'react';
import { defaultTextStyle, globalFonts, colors } from '../styles/globalStyles';
import { TradeTurnType, getTurnConfig } from '../config/tradeConfig';
import TradeTurns, { TradeTurn } from '../components/TradeTurns';


interface OffersSectionProps {
  title: string;
  turns: TradeTurn[];
  defaultExpanded?: boolean;
}

const OffersSection: React.FC<OffersSectionProps> = ({ 
  title, 
  turns, 
  defaultExpanded = true 
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  

  // Don't render if no turns
  if (turns.length === 0) return null;

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.header}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}
      >
        <Text style={styles.headerTitle}>{title}</Text>  
        <FontAwesome6 
          name={isExpanded ? "chevron-up" : "chevron-down"} 
          size={22} 
          color="#fff" 
        />
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.expandedContent}>
          <TradeTurns turns={turns} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    marginBottom: 8,
    backgroundColor: colors.ui.background,
    paddingHorizontal: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.ui.secondary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderTopLeftRadius: 24,
    borderBottomLeftRadius: 2,
    borderTopRightRadius: 24,
    borderBottomRightRadius: 2,
    marginHorizontal: 1,
    marginTop: 12,
    marginBottom: 6,
  },
  headerTitle: {
    fontSize: 20,
    color: '#fff',
    fontFamily: globalFonts.bold
  },
  expandedContent: {
    padding: 12,
    marginTop: -12,
    marginBottom: -6
  },
  tradeSection: {
    gap: -4,
  },
  turnRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  arrow: {
    marginTop: 4,
  },
  tradeText: {
    flex: 1,
    fontSize: 16,
    color: '#E0E0E0',
    lineHeight: 22,
    ...defaultTextStyle
  },
});

export default OffersSection;
