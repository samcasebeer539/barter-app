import { Tabs } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

function TabBarBackground() {
  return (
    <View style={[StyleSheet.absoluteFill, { height: 120 }]}>
      <LinearGradient
        colors={['rgba(20, 20, 20, 0)', 'rgba(20, 20, 20, 0.95)', '#121212']}
        locations={[0, 0.6, 1]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#FFA600',
          tabBarInactiveTintColor: '#fff',
          tabBarStyle: {
            backgroundColor: 'transparent',
            borderTopWidth: 0,
            height: 80,
            paddingBottom: 10,
            paddingTop: 20,
            position: 'absolute',
          },
          tabBarBackground: () => <TabBarBackground />,
          tabBarShowLabel: false,
          headerShown: false,
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
              <MaterialIcons name="home" size={28} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="trades"
          options={{
            tabBarIcon: ({ color }) => (
              <MaterialIcons name="compare-arrows" size={28} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            tabBarIcon: ({ color }) => (
              <MaterialIcons name="account-circle" size={28} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="barter"
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
            href: null, // Hide from tab bar completely
          }}
        />
      </Tabs>
    </SafeAreaProvider>
  );
}
