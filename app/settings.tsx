import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Switch,
    Alert,
    useWindowDimensions,
    Linking,
} from 'react-native';
import * as Location from 'expo-location';
import { setLocationAllowedCache } from '@/hooks/useUserRegion';
import { getSettings, updateSettingsCache } from '@/lib/settingsCache';
import { showError } from '@/lib/errors';
import legal from '@/config/legal.json';
import { apiJson } from '@/lib/api';
import { getBlockedUsers, onBlockChange } from '@/lib/safety';
import Deck, { DeckGroup } from '@/components/Deck';
import { deckStyles } from '@/styles/deckStyles';
import { User } from '@/types/index';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { useRouter } from 'expo-router';
import { colors, globalFonts } from '@/styles/globalStyles';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const HEADER_HEIGHT = 44;

export default function SettingsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
    const [locationEnabled, setLocationEnabled] = React.useState(true);
    const [helpExpanded, setHelpExpanded] = React.useState(false);
    // Blocked users, shown as a deck of their user cards. Loaded fresh each
    // time the section opens; a card's block button (lit while blocked)
    // offers to unblock, which takes the card out of the deck.
    const [blockedExpanded, setBlockedExpanded] = React.useState(false);
    const [blockedUsers, setBlockedUsers] = React.useState<User[] | null>(null);
    const [scrollEnabled, setScrollEnabled] = React.useState(true);
    const toggleBlocked = () => {
        const opening = !blockedExpanded;
        setBlockedExpanded(opening);
        if (opening) {
            setBlockedUsers(null);
            getBlockedUsers()
                .then(setBlockedUsers)
                .catch(err => { console.warn('Failed to load blocked users:', err); setBlockedUsers([]); });
        }
    };
    React.useEffect(() => onBlockChange((userId, blocked) => {
        if (!blocked) setBlockedUsers(prev => prev && prev.filter(u => u._id !== userId));
    }), []);
    const blockedGroups: DeckGroup[] = React.useMemo(
        () => (blockedUsers ?? []).map(user => ({ user, posts: [], locations: [] })),
        [blockedUsers],
    );
    const { width: screenWidth } = useWindowDimensions();
    // Same size as the profile's deck.
    const blockedCardWidth = Math.min(screenWidth - 36, 400);
    const disableScroll = React.useCallback(() => setScrollEnabled(false), []);
    const enableScroll = React.useCallback(() => setScrollEnabled(true), []);
    const [aboutExpanded, setAboutExpanded] = React.useState(false);
    const [termsExpanded, setTermsExpanded] = React.useState(false);
    const [privacyExpanded, setPrivacyExpanded] = React.useState(false);
    
    React.useEffect(() => {
        loadSettings();
    }, []);
    
    // From the session's settings cache (the profile request fills it), so
    // this usually doesn't hit the server; fetched once otherwise.
    const loadSettings = async () => {
        if (!auth.currentUser) return;
        let settings;
        try {
            settings = await getSettings();
        } catch (err) {
            console.warn('Failed to load settings:', err);
            return;
        }
    
        // On only if it's on in your account and the phone allows it.
        const { status } = await Location.getForegroundPermissionsAsync();
        const allowed = settings.locationAllowed && status === 'granted';
        setLocationEnabled(allowed);
        setLocationAllowedCache(allowed);
        setNotificationsEnabled(settings.notificationsEnabled);
    };

    const handleBackPress = () => {
        router.back();
    };

    const handleSignOut = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            showError("Couldn't log out", error);
        }
    };

    // Apple requires a way to delete your account from inside the app. Asks
    // first; the server removes everything (see backend routes/dev/account),
    // then signing out returns you to the login screen.
    const [deleting, setDeleting] = React.useState(false);
    const handleDeleteAccount = () => {
        Alert.alert(
            'Delete your account?',
            'This permanently deletes your profile, posts and photos, and ends any trades you have going. ' +
                'Finished trades stay in the other person\'s history. This can\'t be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete Account',
                    style: 'destructive',
                    onPress: async () => {
                        setDeleting(true);
                        try {
                            await apiJson('/dev/account', { method: 'DELETE' });
                        } catch (err) {
                            setDeleting(false);
                            showError("Couldn't delete your account", err);
                            return;
                        }
                        // The sign-in is already gone on the server; this
                        // clears it on the phone too.
                        await signOut(auth).catch(() => {});
                    },
                },
            ],
        );
    };

    const updateLocationSetting = async (value: boolean) => {
        // Turning it on asks the phone for location access. If that's refused
        // (now or before), it stays off; iOS only lets you change it in Settings.
        if (value) {
            const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setLocationEnabled(false);
                Alert.alert(
                    'Location access is off',
                    canAskAgain
                        ? 'Allow location access to use Location Services.'
                        : 'To use Location Services, allow location access for this app in your phone\'s Settings.',
                    canAskAgain
                        ? [{ text: 'OK' }]
                        : [{ text: 'Cancel', style: 'cancel' }, { text: 'Open Settings', onPress: () => Linking.openSettings() }],
                );
                return;
            }
        }

        setLocationEnabled(value);
        setLocationAllowedCache(value);
    
        try {
            if (!auth.currentUser) return;
            await apiJson('/dev/update_user', { method: 'PATCH', body: { is_location_allowed: value } });
        } catch (err) {
            showError("Couldn't save the setting", err);
            setLocationEnabled(!value);
            setLocationAllowedCache(!value);
        }
    };

    const updateNotificationsSetting = async (value: boolean) => {
        setNotificationsEnabled(value);
        // Remembered in the app too (like Location Services), so it's still
        // what you set when you come back to this screen.
        updateSettingsCache({ notificationsEnabled: value });

        try {
            if (!auth.currentUser) return;
            await apiJson('/dev/update_user', { method: 'PATCH', body: { is_notifications_allowed: value } });
        } catch (err) {
            showError("Couldn't save the setting", err);
            setNotificationsEnabled(!value);
            updateSettingsCache({ notificationsEnabled: !value });
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.topBarContainer, { paddingTop: insets.top }]}>
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

            <ScrollView
                style={[styles.scrollView, { marginTop: insets.top + HEADER_HEIGHT }]}
                scrollEnabled={scrollEnabled}
            >
                {/* Account Section */}
                {/* <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Account</Text>

                    <TouchableOpacity style={styles.settingItem}>
                        <View style={styles.settingLeft}>
                            <Text style={styles.settingText}>Edit Profile</Text>
                        </View>
                        <FontAwesome6 name="circle-chevron-right" size={22} color={colors.ui.secondarydisabled} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.settingItem}>
                        <View style={styles.settingLeft}>
                            <Text style={styles.settingText}>Privacy</Text>
                        </View>
                        <FontAwesome6 name="circle-chevron-right" size={22} color={colors.ui.secondarydisabled} />
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.settingItem}>
                        <View style={styles.settingLeft}>
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
                            <Text style={styles.settingText}>Language</Text>
                        </View>
                        <View style={styles.settingRight}>
                            <Text style={styles.settingValue}>English</Text>
                            <FontAwesome6 name="circle-chevron-right" size={22} color={colors.ui.secondarydisabled} />
                        </View>
                    </TouchableOpacity>
                    */}
                </View>

                {/* Safety: blocked users as a deck of their cards */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Safety</Text>
                    <TouchableOpacity style={styles.settingItem} onPress={toggleBlocked}>
                        <View style={styles.settingLeft}>
                            <Text style={styles.settingText}>Blocked Users</Text>
                        </View>
                        <FontAwesome6
                            name={blockedExpanded ? "circle-chevron-up" : "circle-chevron-right"}
                            size={22}
                            color={blockedExpanded ? colors.text.primary : colors.ui.secondarydisabled}
                        />
                    </TouchableOpacity>
                    {blockedExpanded && (
                        blockedUsers === null ? (
                            <View style={styles.dropdownContainer}>
                                <Text style={styles.dropdownText}>Loading…</Text>
                            </View>
                        ) : blockedUsers.length === 0 ? (
                            <View style={styles.dropdownContainer}>
                                <Text style={styles.dropdownText}>You haven't blocked anyone.</Text>
                            </View>
                        ) : null
                    )}
                </View>

                {/* The blocked users' deck, under the section at full size
                    (same width and centering as the profile's deck). */}
                {blockedExpanded && blockedUsers && blockedUsers.length > 0 && (
                    <View style={styles.blockedDeck}>
                        <View style={deckStyles.deckWrapper}>
                            <Deck
                                groups={blockedGroups}
                                cardWidth={blockedCardWidth}
                                enabled
                                isUser={false}
                                showLocation={false}
                                onHorizontalGestureStart={disableScroll}
                                onGestureEnd={enableScroll}
                            />
                        </View>
                    </View>
                )}

                {/* Support Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Support</Text>

                    <TouchableOpacity
                        style={styles.settingItem}
                        onPress={() => setHelpExpanded(!helpExpanded)}
                    >
                        <View style={styles.settingLeft}>
                            <Text style={styles.settingText}>Help Center</Text>
                        </View>

                        <FontAwesome6
                            name={helpExpanded ? "circle-chevron-up" : "circle-chevron-right"}
                            size={22}
                            color={helpExpanded ? colors.text.primary : colors.ui.secondarydisabled}
                        />
                    </TouchableOpacity>
                    {helpExpanded && (
                        <View style={styles.dropdownContainer}>
                            {/* The address comes from config/legal.json (supportEmail). */}
                            {legal.supportEmail ? (
                                <Text style={styles.dropdownText}>
                                    Need help? Email us anytime at{" "}
                                    <Text
                                        style={styles.linkText}
                                        accessibilityRole="link"
                                        onPress={() => Linking.openURL(`mailto:${legal.supportEmail}`)}
                                    >
                                        {legal.supportEmail}
                                    </Text>
                                    {"\n\n"}
                                    We'd be happy to answer any questions or help resolve issues.
                                </Text>
                            ) : (
                                <Text style={styles.dropdownText}>Support email coming soon.</Text>
                            )}
                        </View>
                    )}
                    <TouchableOpacity
                        style={styles.settingItem}
                        onPress={() => setAboutExpanded(!aboutExpanded)}
                    >
                        <View style={styles.settingLeft}>
                            <Text style={styles.settingText}>About</Text>
                        </View>

                        <FontAwesome6
                            name={aboutExpanded ? "circle-chevron-up" : "circle-chevron-right"}
                            size={22}
                            color={aboutExpanded ? colors.text.primary : colors.ui.secondarydisabled}
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
                            <Text style={styles.settingText}>Terms and Conditions</Text>
                        </View>

                        <FontAwesome6
                            name={termsExpanded ? "circle-chevron-up" : "circle-chevron-right"}
                            size={22}
                            color={termsExpanded ? colors.text.primary : colors.ui.secondarydisabled}
                        />
                    </TouchableOpacity>

                    {termsExpanded && (
                        <View style={styles.dropdownContainer}>
                            <Text style={styles.dropdownText}>Effective {legal.effectiveDate}</Text>
                            {legal.terms.map(section => (
                                <React.Fragment key={section.heading}>
                                    <Text style={styles.Termsheading}>{section.heading}</Text>
                                    <Text style={styles.Termsbody}>{section.body}</Text>
                                </React.Fragment>
                            ))}
                        </View>
                    )}
                    <TouchableOpacity
                        style={styles.settingItem}
                        onPress={() => setPrivacyExpanded(!privacyExpanded)}
                    >
                        <View style={styles.settingLeft}>
                            <Text style={styles.settingText}>Privacy Policy</Text>
                        </View>
                        <FontAwesome6
                            name={privacyExpanded ? "circle-chevron-up" : "circle-chevron-right"}
                            size={22}
                            color={privacyExpanded ? colors.text.primary : colors.ui.secondarydisabled}
                        />
                    </TouchableOpacity>
                    {privacyExpanded && (
                        <View style={styles.dropdownContainer}>
                            <Text style={styles.dropdownText}>Effective {legal.effectiveDate}</Text>
                            {legal.privacy.map(section => (
                                <React.Fragment key={section.heading}>
                                    <Text style={styles.Termsheading}>{section.heading}</Text>
                                    <Text style={styles.Termsbody}>{section.body}</Text>
                                </React.Fragment>
                            ))}
                        </View>
                    )}
                </View>

                {/* Logout Button */}
                <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
                    <Text style={styles.logoutText}>Log Out</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.deleteAccountButton}
                    onPress={handleDeleteAccount}
                    disabled={deleting}
                    accessibilityRole="button"
                >
                    <Text style={[styles.deleteAccountText, deleting && styles.deleteAccountTextBusy]}>
                        {deleting ? 'Deleting…' : 'Delete Account'}
                    </Text>
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
        fontFamily: globalFonts.bold,
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
        justifyContent: 'flex-start',
        gap: 16,
        height: 44,
        marginHorizontal: 12,
        marginTop: 8,
        paddingHorizontal: 16,


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
    // Quieter than Log Out (it's rarely wanted), under it.
    deleteAccountButton: {
        height: 44,
        marginHorizontal: 12,
        paddingHorizontal: 16,
        justifyContent: 'center',
    },
    deleteAccountText: {
        fontSize: 16,
        fontFamily: globalFonts.regular,
        color: colors.ui.secondarydisabled,
    },
    deleteAccountTextBusy: {
        opacity: 0.5,
    },
    bottomSpacer: {
        height: 80,
    },
    // Expanded text lines up with the row titles (no leading icons now).
    dropdownContainer: {
        paddingLeft: 0,
        paddingRight: 12,
        paddingBottom: 12,
    },
    
    dropdownText: {
        color: "#fff",
        fontSize: 16,
        lineHeight: 22,
        fontFamily: globalFonts.regular,
    },
    
    blockedDeck: {
        alignItems: 'center',
        marginTop: 8,
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