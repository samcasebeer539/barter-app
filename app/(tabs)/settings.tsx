import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Switch,
} from 'react-native';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { useRouter } from 'expo-router';
import { colors, globalFonts } from '@/styles/globalStyles';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';

export default function SettingsScreen() {
    const BASE_URL = process.env.EXPO_PUBLIC_API_URL;
    const router = useRouter();
    const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
    const [locationEnabled, setLocationEnabled] = React.useState(true);
    const [helpExpanded, setHelpExpanded] = React.useState(false);
    const [aboutExpanded, setAboutExpanded] = React.useState(false);
    const [termsExpanded, setTermsExpanded] = React.useState(false);
    
    React.useEffect(() => {
        loadSettings();
    }, []);
    
    const loadSettings = async () => {
        const user = auth.currentUser;
        if (!user) return;
    
        const token = await user.getIdToken();
    
        const response = await fetch(`${BASE_URL}/settings`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
    
        const data = await response.json();
    
        setLocationEnabled(data.is_location_allowed);
        setNotificationsEnabled(data.notifications_enabled);
    };

    const handleBackPress = () => {
        router.push('/profile');
    };

    const handleSignOut = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.log("Sign out error: ", error);
        }
    };

    const updateLocationSetting = async (value: boolean) => {
        setLocationEnabled(value);
    
        try {
            const user = auth.currentUser;
            if (!user) return;
    
            const token = await user.getIdToken();
    
            await fetch(`${BASE_URL}/dev/update_user`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    is_location_allowed: value,
                }),
            });
        } catch (err) {
            console.log(err);
            setLocationEnabled(!value); // optionally revert on failure
        }
    };

    const updateNotificationsSetting = async (value: boolean) => {
        setNotificationsEnabled(value);
    
        try {
            const user = auth.currentUser;
            if (!user) return;
    
            const token = await user.getIdToken();
    
            await fetch(`${BASE_URL}/dev/update_user`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    is_notifications_allowed: value,
                }),
            });
        } catch (err) {
            console.log(err);
            setNotificationsEnabled(!value); // optionally revert on failure
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.topBarContainer}>
                <TouchableOpacity
                    style={styles.settingsButton}
                    onPress={handleBackPress}
                >

                    <Text style={styles.headerTitle}>
                        SETTINGS
                    </Text>
                    <FontAwesome6 name="circle-chevron-left" size={22} color="#fff" />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView}>
                {/* Account Section */}
                {/* <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Account</Text>

                    <TouchableOpacity style={styles.settingItem}>
                        <View style={styles.settingLeft}>
                            <FontAwesome6 name="user" size={22} color="#fff" />
                            <Text style={styles.settingText}>Edit Profile</Text>
                        </View>
                        <FontAwesome6 name="circle-chevron-right" size={22} color={colors.ui.secondarydisabled} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.settingItem}>
                        <View style={styles.settingLeft}>
                            <FontAwesome6 name="lock" size={22} color="#fff" />
                            <Text style={styles.settingText}>Privacy</Text>
                        </View>
                        <FontAwesome6 name="circle-chevron-right" size={22} color={colors.ui.secondarydisabled} />
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.settingItem}>
                        <View style={styles.settingLeft}>
                            <FontAwesome6 name="shield-halved" size={22} color="#fff" />
                            <Text style={styles.settingText}>Security</Text>
                        </View>
                        <FontAwesome6 name="circle-chevron-right" size={22} color={colors.ui.secondarydisabled} />
                    </TouchableOpacity>
                </View> */}

                {/* Preferences Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Preferences</Text>

                    <View style={styles.settingItem}>
                        <View style={styles.settingLeft}>
                            <FontAwesome6 name="bell" size={22} color="#fff" />
                            <Text style={styles.settingText}>Notifications</Text>
                        </View>
                        <Switch
                            value={notificationsEnabled}
                            onValueChange={updateNotificationsSetting}
                            trackColor={{ false: '#3e3e3e', true: '#30C759' }}
                            thumbColor="#fff"
                        />
                    </View>

                    <View style={styles.settingItem}>
                        <View style={styles.settingLeft}>
                            <FontAwesome6 name="location-dot" size={22} color="#fff" />
                            <Text style={styles.settingText}>Location Services</Text>
                        </View>
                        <Switch
                            value={locationEnabled}
                            onValueChange={updateLocationSetting}
                            trackColor={{ false: '#3e3e3e', true: '#30C759' }}
                            thumbColor="#fff"
                        />
                    </View>
                    {/*
                    <TouchableOpacity style={styles.settingItem}>
                        <View style={styles.settingLeft}>
                            <FontAwesome6 name="globe" size={22} color="#fff" />
                            <Text style={styles.settingText}>Language</Text>
                        </View>
                        <View style={styles.settingRight}>
                            <Text style={styles.settingValue}>English</Text>
                            <FontAwesome6 name="circle-chevron-right" size={22} color={colors.ui.secondarydisabled} />
                        </View>
                    </TouchableOpacity>
                    */}
                </View>

                {/* Support Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Support</Text>

                    <TouchableOpacity
                        style={styles.settingItem}
                        onPress={() => setHelpExpanded(!helpExpanded)}
                    >
                        <View style={styles.settingLeft}>
                            <FontAwesome6 name="circle-question" size={22} color="#fff" />
                            <Text style={styles.settingText}>Help Center</Text>
                        </View>

                        <FontAwesome6
                            name={helpExpanded ? "circle-chevron-up" : "circle-chevron-right"}
                            size={22}
                            color={colors.ui.secondarydisabled}
                        />
                    </TouchableOpacity>
                    {helpExpanded && (
                        <View style={styles.dropdownContainer}>
                            <Text style={styles.dropdownText}>
                                Need help? Email us anytime at{" "}
                                <Text style={styles.linkText}>
                                    example@gmail.com
                                </Text>
                                {"\n\n"}
                                We'd be happy to answer any questions or help resolve issues.
                            </Text>
                        </View>
                    )}
                    <TouchableOpacity
                        style={styles.settingItem}
                        onPress={() => setAboutExpanded(!aboutExpanded)}
                    >
                        <View style={styles.settingLeft}>
                            <FontAwesome6 name="circle-info" size={22} color="#fff" />
                            <Text style={styles.settingText}>About</Text>
                        </View>

                        <FontAwesome6
                            name={aboutExpanded ? "circle-chevron-up" : "circle-chevron-right"}
                            size={22}
                            color={colors.ui.secondarydisabled}
                        />
                    </TouchableOpacity>

                    {aboutExpanded && (
                        <View style={styles.dropdownContainer}>
                            <Text style={styles.dropdownText}>
                                Win-Win is a community marketplace that helps people exchange goods
                                through bartering instead of buying and selling. Our goal is to make
                                trading simple, sustainable, and local.
                            </Text>
                        </View>
                    )}
                    <TouchableOpacity
                        style={styles.settingItem}
                        onPress={() => setTermsExpanded(!termsExpanded)}
                    >
                        <View style={styles.settingLeft}>
                            <FontAwesome6 name="circle-info" size={22} color="#fff" />
                            <Text style={styles.settingText}>Terms and Conditions</Text>
                        </View>

                        <FontAwesome6
                            name={aboutExpanded ? "circle-chevron-up" : "circle-chevron-right"}
                            size={22}
                            color={colors.ui.secondarydisabled}
                        />
                    </TouchableOpacity>

                    {termsExpanded && (
                        <View style={styles.dropdownContainer}>
                            <Text style={styles.Termsheading}>1. Acceptance</Text>
                            <Text style={styles.Termsbody}>
                                By using Win-Win, you agree to these Terms & Conditions.
                            </Text>

                            <Text style={styles.Termsheading}>2. User Responsibilities</Text>
                            <Text style={styles.Termsbody}>
                                Users are responsible for the accuracy of their listings and for
                                communicating honestly with other users.
                            </Text>

                            <Text style={styles.Termsheading}>3. Trades</Text>
                            <Text style={styles.Termsbody}>
                                Win-Win facilitates trades between users but is not responsible
                                for the condition, quality, legality, or outcome of any trade.
                            </Text>
                        </View>
                    )}
                </View>

                {/* Logout Button */}
                <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
                    <FontAwesome6
                        name="right-from-bracket"
                        size={22}
                        color={colors.actions.decline}
                    />
                    <Text style={styles.logoutText}>Log Out</Text>
                </TouchableOpacity>

                <View style={styles.bottomSpacer} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.ui.background,
    },
    topBarContainer: {
        backgroundColor: colors.ui.background,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,

        justifyContent: 'space-between',
        paddingHorizontal: 12,
        zIndex: 10,
        paddingBottom: 4,
        paddingTop: 48,
        gap: 4,
    },
    settingsButton: {
        flex: 1,
        height: 44,
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        borderBottomLeftRadius: 2,
        borderBottomRightRadius: 2,
        backgroundColor: colors.ui.secondary,
        justifyContent: 'space-between',
        alignItems: 'center',
        flexDirection: 'row',
        paddingHorizontal: 16,
    },

    headerTitle: {
        fontSize: 20,
        fontFamily: globalFonts.bold,
        color: '#fff',
    },
    placeholder: {
        width: 40,
    },
    scrollView: {
        flex: 1,
        marginTop: 92,

    },
    section: {
        marginTop: 8,
        marginHorizontal: 12,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 2,
        backgroundColor: colors.ui.secondary
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: colors.ui.secondarydisabled,
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        fontFamily: globalFonts.bold,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,

    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    settingText: {
        fontSize: 18,
        color: '#fff',
        fontFamily: globalFonts.regular,
    },
    settingRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    settingValue: {
        fontSize: 18,
        fontFamily: globalFonts.regular,
        color: colors.ui.secondarydisabled,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        height: 44,
        marginHorizontal: 12,
        marginTop: 8,


        borderTopLeftRadius: 2,
        borderTopRightRadius: 2,
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
        borderWidth: 3,
        borderColor: colors.actions.decline,
    },
    logoutText: {
        fontSize: 18,
        fontFamily: globalFonts.bold,
        color: colors.actions.decline,
    },
    bottomSpacer: {
        height: 80,
    },
    dropdownContainer: {
        paddingLeft: 40,
        paddingRight: 12,
        paddingBottom: 12,
    },
    
    dropdownText: {
        color: "#fff",
        fontSize: 15,
        lineHeight: 22,
        fontFamily: globalFonts.regular,
    },
    
    linkText: {
        color: "#4DA3FF",
        textDecorationLine: "underline",
    },
    Termsheading: {
        color: "#fff",
        fontSize: 18,
        fontFamily: globalFonts.bold,
        marginTop: 16,
        marginBottom: 8,
    },
    Termsbody: {
        color: "#ddd",
        fontSize: 16,
        lineHeight: 24,
        fontFamily: globalFonts.regular,
    },
});