import { Tabs } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { useFonts } from 'expo-font';
import { colors, globalFonts } from '@/styles/globalStyles';


function TabBarBackground() {
    return (
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: '#000' }]} />
    );
}

export default function RootLayout() {
    const [fontsLoaded] = useFonts({
        'YourFontName-Regular': require('@/assets/fonts/Roboto-Regular.ttf'),
        'YourFontName-Bold': require('@/assets/fonts/RobotoCondensed-SemiBold.ttf'),
        'YourFontName-ExtraBold': require('@/assets/fonts/Oswald-Bold.ttf'),
    });

    if (!fontsLoaded) {
        return null;
    }

    return (
        <SafeAreaProvider>
        <Tabs
            screenOptions={{
            tabBarActiveTintColor: '#fff',
            tabBarInactiveTintColor: colors.ui.secondarydisabled,
            
            tabBarStyle: {
                backgroundColor: 'transparent',
                borderTopWidth: 0,
                height: 72,
                paddingBottom: 0,
                paddingTop: 0,
                position: 'absolute',
                bottom: 0,
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
                href: null,
            }}
            />
            <Tabs.Screen
            name="feed"
            options={{
                tabBarIcon: ({ color }) => (
                <FontAwesome6 name="circle" size={22} color={color} style={{ marginTop: 0 }}/>
                ),
            }}
            />
            <Tabs.Screen
                name="barter"
                options={{
                    
                    tabBarIcon: ({ color }) => (
                    <FontAwesome6 name="arrow-right-arrow-left" size={22} color={color} style={{ marginTop: 0 }}/>
                    ),
                    
                }}
                />
            <Tabs.Screen
            name="profiledeck"
            options={{
                tabBarIcon: ({ color }) => (
                <FontAwesome6 name="user-circle" size={22} color={color} style={{ marginTop: 0 }}/>
                ),
            }}
            />
            <Tabs.Screen
            name="settings"
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
        
        height: 44,
        marginTop: 8,
        marginBottom: 20,
    },
    leftButton: {
        borderTopLeftRadius: 2,
        borderBottomLeftRadius: 32,
        borderTopRightRadius: 2,
        borderBottomRightRadius: 2,
        marginLeft: 12,
    },
    middleButton: {
        
        borderTopRightRadius: 2,
        borderBottomRightRadius: 2,
        borderTopLeftRadius: 2,
        borderBottomLeftRadius: 2,
        
    },
    rightButton: {
        borderTopRightRadius: 2,
        borderBottomRightRadius: 32,
        borderTopLeftRadius: 2,
        borderBottomLeftRadius: 2,
        marginRight: 12,
    },
    actionButtonText: {
        fontSize: 22,
        fontFamily: globalFonts.bold,
        bottom: 14,
        },
});