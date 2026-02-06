import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import Icon from 'react-native-vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';
import { globalFonts, colors } from '../styles/globalStyles';

interface FeedBarProps {
  showLocation: boolean;
  showSaved: boolean;
  onLocationPress: () => void;
  onSearchPress: () => void;
  onSavePress: () => void;
  headerTranslateY: Animated.Value;
}

export default function FeedBar({
  showLocation,
  showSaved,
  onLocationPress,
  onSearchPress,
  onSavePress,
  headerTranslateY,
}: FeedBarProps) {
  return (
    <>
      {/* Top Gradient Overlay */}
      <View style={styles.topGradientContainer}>
        <LinearGradient
          colors={['#000000', 'rgba(0, 0, 0, 1)', 'rgba(0, 0, 0, 0)']}
          locations={[0, 0.5, 1]}
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
          onPress={onSearchPress}
        >
          <Text style={styles.searchText}>Search</Text>
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
    paddingBottom: 10,
    paddingTop: 58,
  },

  topGradientContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 80,
    zIndex: 5,
    pointerEvents: 'none',
  },
  topGradient: {
    flex: 1,
  },
  searchText: {
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
