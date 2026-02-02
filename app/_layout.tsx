import { Tabs } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { useFonts } from 'expo-font';
import { colors } from '@/styles/globalStyles';

function TabBarBackground() {
  return (
    <View style={[StyleSheet.absoluteFill, { height: 120, top: 34}]}>
      <LinearGradient
        colors={['rgba(0, 0, 0, 0)', 'rgb(0, 0, 0, 1)', colors.ui.background]}
        locations={[0, 0.5, 1]}
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
          tabBarActiveTintColor: colors.actions.trade,
          tabBarInactiveTintColor: '#fff',
          
          tabBarStyle: {
            backgroundColor: 'transparent',
            borderTopWidth: 0,
            height: 105,
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
              <FontAwesome6 name="square" size={24} color={color} style={{ marginTop: -14 }}/>
              
            ),
          }}
        />
        <Tabs.Screen
          name="activetradestest1"
          options={{
            tabBarIcon: ({ color }) => (
              <FontAwesome6 name="arrow-right-arrow-left" size={24} color={color} style={{ marginTop: -14 }}/>
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            tabBarIcon: ({ color }) => (
              <FontAwesome6 name="user-circle" size={24} color={color} style={{ marginTop: -14 }}/>
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
    backgroundColor: colors.ui.secondary,
    marginHorizontal: 2,
    justifyContent: 'center',
    alignItems: 'center',
    height: 40,
  },
  leftButton: {
    borderTopLeftRadius: 25,
    borderBottomLeftRadius: 2,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
    marginLeft: 46,
    top: 22,
  },
  middleButton: {
    borderRadius: 2,
    top: 22,
  },
  rightButton: {
    borderTopRightRadius: 30,
    borderBottomRightRadius: 2,
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
    marginRight: 46,
    top: 22,
  },
});
