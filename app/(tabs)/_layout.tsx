import { Tabs } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { useFonts } from 'expo-font';
import { colors } from '@/styles/globalStyles';


function TabBarBackground() {
    return (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000', top: 32}]} />
    );
}

export default function RootLayout() {
    const [fontsLoaded] = useFonts({
        'YourFontName-Regular': require('@/assets/fonts/RobotoCondensed-Regular.ttf'),
        'YourFontName-Bold': require('@/assets/fonts/RobotoCondensed-SemiBold.ttf'),
        'YourFontName-ExtraBold': require('@/assets/fonts/Oswald-Bold.ttf'),
        // Add other font weights/styles as needed
    });

    if (!fontsLoaded) {
        return null;
    }

    return (
        <SafeAreaProvider>
        <Tabs
            screenOptions={{
            tabBarActiveTintColor: colors.actions.offer,
            tabBarInactiveTintColor: '#fff',
            
            tabBarStyle: {
                backgroundColor: 'transparent',
                borderTopWidth: 0,
                height: 110,
                paddingBottom: 42,
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
                const isLast = href === '/profiledeck';
                const isMiddle = href === '/barter';
                
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
                <FontAwesome6 name="square" size={24} color={color} style={{ marginTop: 0 }}/>
                
                ),
            }}
            />
            <Tabs.Screen
            name="barter"
            options={{
                tabBarIcon: ({ color }) => (
                <FontAwesome6 name="arrow-right-arrow-left" size={24} color={color} style={{ marginTop: 0 }}/>
                ),
            }}
            />
            <Tabs.Screen
            name="profiledeck"
            options={{
                tabBarIcon: ({ color }) => (
                <FontAwesome6 name="user-circle" size={24} color={color} style={{ marginTop: 0 }}/>
                ),
            }}
            />
    
            <Tabs.Screen
            name="settings"
            options={{
                href: null, // Hide from tab bar completely
            }}
            />
            <Tabs.Screen
            name="profile"
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
        borderTopLeftRadius: 2,
        borderBottomLeftRadius: 36,
        borderTopRightRadius: 2,
        borderBottomRightRadius: 2,
        marginLeft: 12,
        top: 22,
    },
    middleButton: {
        borderTopRightRadius: 2,
        borderBottomRightRadius: 2,
        borderTopLeftRadius: 2,
        borderBottomLeftRadius: 2,
        top: 22,
    },
    rightButton: {
        borderTopRightRadius: 2,
        borderBottomRightRadius: 36,
        borderTopLeftRadius: 2,
        borderBottomLeftRadius: 2,
        marginRight: 12,
        top: 22,
    },
});