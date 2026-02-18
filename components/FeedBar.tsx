import { View, StyleSheet, TouchableOpacity, Animated, TextInput } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import Icon from 'react-native-vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useRef } from 'react';
import { globalFonts, colors } from '../styles/globalStyles';

interface FeedBarProps {
  showLocation: boolean;
  showSaved: boolean;
  onLocationPress: () => void;
  onSavePress: () => void;
  headerTranslateY: Animated.Value;
}

export default function FeedBar({
  showLocation,
  showSaved,
  onLocationPress,
  onSavePress,
  headerTranslateY,
}: FeedBarProps) {
  const [searchText, setSearchText] = useState('');
  const searchInputRef = useRef<TextInput>(null);

  const handleSearchBarPress = () => {
    searchInputRef.current?.focus();
  };

  const handleSearchChange = (text: string) => {
    setSearchText(text);
    console.log('Search text:', text);
  };

  return (
    <>
      {/* Top Gradient Overlay */}
      <View style={styles.topGradientContainer}>
        <LinearGradient
          colors={['#372788', 'rgba(37, 27, 88, 0)', 'rgba(37, 27, 88, 1)']}
          locations={[0, 1, 1]}
          style={styles.topGradient}
        />
      </View>

      <Animated.View
        style={[
          styles.topIconsContainer,
          { transform: [{ translateY: headerTranslateY }] }
        ]}
      >
        <TouchableOpacity
          style={styles.locationButton}
          onPress={onLocationPress}
        >
          <FontAwesome6 name='location-dot' size={22} color={showLocation ? '#fff' : colors.actions.offer} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.searchBar}
          onPress={handleSearchBarPress}
          activeOpacity={1}
        >
          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor={colors.ui.secondarydisabled}
            value={searchText}
            onChangeText={handleSearchChange}
            returnKeyType="search"
          />
          <FontAwesome6 name='magnifying-glass' size={22} color='#FFFFFF' />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={onSavePress}
        >
          <Icon name='bookmark' size={24} color={showSaved ? '#fff' : colors.actions.offer} />
        </TouchableOpacity>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  topIconsContainer: {
    backgroundColor: colors.ui.background,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 16,
    zIndex: 10,
    paddingBottom: 4,
    paddingTop: 48,
  },

  topGradientContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 40,
    zIndex: 5,
    pointerEvents: 'none',
  },
  topGradient: {
    flex: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: globalFonts.regular,
  },

  saveButton: {
    width: 50,
    height: 44,
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
    borderTopRightRadius: 25,
    borderBottomRightRadius: 2,
    backgroundColor: colors.ui.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationButton: {
    width: 50,
    height: 44,
    borderTopLeftRadius: 25,
    borderBottomLeftRadius: 2,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
    backgroundColor: colors.ui.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBar: {
    width: 258,
    height: 44,
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
    backgroundColor: colors.ui.secondary,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
});
