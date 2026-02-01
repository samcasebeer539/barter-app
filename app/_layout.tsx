import { Tabs } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { useFonts } from 'expo-font';
import colors, { uiColors } from '@/styles/globalStyles';

function TabBarBackground() {
  return (
    <View style={[StyleSheet.absoluteFill, { height: 120 }]}>
      <LinearGradient
        colors={['rgba(0, 0, 0, 0)', 'rgb(0, 0, 0)', uiColors.background]}
        locations={[0, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'YourFontName-Regular': require('../assets/fonts/RobotoCondensed-Regular.ttf'),
    'YourFontName-Bold': require('../assets/fonts/RobotoCondensed-SemiBold.ttf'),
    'YourFontName-ExtraBold': require('../assets/fonts/RobotoCondensed-Black.ttf'),
    // Add other font weights/styles as needed
  });
 
  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#FFA600',
          tabBarInactiveTintColor: '#fff',
          tabBarStyle: {
            backgroundColor: 'transparent',
            borderTopWidth: 0,
            height: 90,
            paddingBottom: 20,
            paddingTop: 20,
            position: 'absolute',
          },
          tabBarBackground: () => <TabBarBackground />,
          tabBarShowLabel: false,
          headerShown: false,
          tabBarButton: (props) => {
            const { 
              children, 
              onPress, 
              onLongPress,
              testID,
              accessibilityLabel,
              accessibilityRole,
              accessibilityState,
              style,
              ...rest 
            } = props as any;
            
            // Determine button position based on the route
            const href = props.href as string;
            const isFirst = href === '/feed';
            const isLast = href === '/profile';
            const isMiddle = href === '/activetradestest1';
            
            return (
              <TouchableOpacity
                onPress={onPress}
                onLongPress={onLongPress}
                testID={testID}
                accessibilityLabel={accessibilityLabel}
                accessibilityRole={accessibilityRole}
                accessibilityState={accessibilityState}
                style={[
                  styles.tabButton,
                  isFirst && styles.leftButton,
                  isLast && styles.rightButton,
                  isMiddle && styles.middleButton,
                ]}
              >
                {children}
              </TouchableOpacity>
            );
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            href: null, // Hide from tab bar completely
          }}
        />
        <Tabs.Screen
          name="feed"
          options={{
            tabBarIcon: ({ color }) => (
              <FontAwesome6 name="square" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="activetradestest1"
          options={{
            tabBarIcon: ({ color }) => (
              <FontAwesome6 name="arrow-right-arrow-left" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            tabBarIcon: ({ color }) => (
              <FontAwesome6 name="user-circle" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="trades"
          options={{
            href: null, // Hide from tab bar - accessed from trades page
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            href: null, // Hide from tab bar completely
          }}
        />
        <Tabs.Screen
          name="decktest"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="barter"
          options={{
              href: null,
          }}
        />
        <Tabs.Screen
          name="activetradestest"
          options={{
              href: null,
          }}
        />
      </Tabs>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  tabButton: {
    flex: 1,
    backgroundColor: '#5c5579',
    marginHorizontal: 2,
    justifyContent: 'center',
    alignItems: 'center',
    height: 50,
  },
  leftButton: {
    borderTopLeftRadius: 25,
    borderBottomLeftRadius: 25,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
    marginLeft: 45,
  },
  middleButton: {
    borderRadius: 4,
  },
  rightButton: {
    borderTopRightRadius: 25,
    borderBottomRightRadius: 25,
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
    marginRight: 45,
  },
});
