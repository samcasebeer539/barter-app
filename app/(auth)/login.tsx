import { useState } from 'react';
import { Text, View, StyleSheet, TextInput, KeyboardAvoidingView, ActivityIndicator, TouchableOpacity } from 'react-native'
import { auth } from '@/lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { colors, globalFonts } from '../../styles/globalStyles';
import { apiJson } from '@/lib/api';
import { TEXT_LIMITS } from '@/config/textLimits';

export default function HandleLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSigningUp, setIsSigningUp] = useState(false);

    // The server address comes from EXPO_PUBLIC_API_URL in .env (your IP
    // address); lib/api adds it and the sign-in token to every request.

    const signUp = async () => {
        // If there is currently a sign in happening, stop the extra sign in
        if (loading) return;
        setLoading(true);
        if (!firstName.trim() || !lastName.trim()) {
            alert('Please enter your first and last name.');
            return;
        }
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            // Creates the account's record on the server, with first and last
            // name. A failure now shows the alert below (it used to be silent,
            // leaving a signed-in user with no account record).
            await apiJson('/dev/create_user', { method: 'POST', body: { firstName, lastName } });
        } catch(e: any) {
            alert('Sign Up Failed: ' + e.message);
        } finally {
            setLoading(false);
        }
    };

    const signIn = async () => {
        // If there is currently a sign in happening, stop the extra sign in
        if (loading) {
            return;
        }
        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch(e: any) {
            alert('Sign In Failed: ' + e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSignInPress = () => {
        if (!isSigningUp) {
            // already selected — submit
            signIn();
        } else {
            // switch to sign in mode
            setIsSigningUp(false);
        }
    };

    const handleSignUpPress = () => {
        if (isSigningUp) {
            // already selected — submit
            signUp();
        } else {
            // switch to sign up mode
            setIsSigningUp(true);
        }
    };

    return (
        <View style={styles.container}>
            <KeyboardAvoidingView behavior="padding">

                {!isSigningUp && (
                    <View style={styles.headerBanner}>
                        <Text style={styles.buttonText}>Welcome Back!</Text>
                    </View>
                )}
                {isSigningUp && (
                    <View style={styles.headerBanner}>
                        <Text style={styles.buttonText}>Welcome to Win-Win!</Text>
                    </View>
                )}

                {isSigningUp && (
                    <TextInput
                        keyboardAppearance="dark"
                        returnKeyType="done"
                        style={styles.input}
                        value={firstName}
                        onChangeText={setFirstName}
                        placeholder='First Name'
                        maxLength={TEXT_LIMITS.firstName}
                        placeholderTextColor={colors.ui.cardsecondary}
                    />
                )}
                {isSigningUp && (
                    <TextInput
                        keyboardAppearance="dark"
                        returnKeyType="done"
                        style={styles.input}
                        value={lastName}
                        onChangeText={setLastName}
                        placeholder='Last Name'
                        maxLength={TEXT_LIMITS.lastName}
                        placeholderTextColor={colors.ui.cardsecondary}
                    />
                )}
                <TextInput
                    keyboardAppearance="dark"
                    returnKeyType="done"
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType='email-address'
                    placeholder='Email'
                    maxLength={TEXT_LIMITS.email}
                    placeholderTextColor={colors.ui.cardsecondary}
                />
                <TextInput
                    keyboardAppearance="dark"
                    returnKeyType="done"
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    placeholder='Password'
                    maxLength={TEXT_LIMITS.password}
                    placeholderTextColor={colors.ui.cardsecondary}
                />

                {loading ? (
                    <ActivityIndicator size={"small"} style={{ margin: 28 }} />
                ) : (
                    <View style={styles.signButtonRow}>
                        <TouchableOpacity
                            disabled={loading}
                            activeOpacity={loading ? 1 : 0.7}
                            style={[styles.signInButton, { backgroundColor: !isSigningUp ? colors.actions.offer : colors.ui.secondary }]}
                            onPress={handleSignInPress}
                        >
                            <Text style={styles.buttonText}>Sign In</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            disabled={loading}
                            activeOpacity={loading ? 1 : 0.7}
                            style={[styles.signUpButton, { backgroundColor: isSigningUp ? colors.actions.offer : colors.ui.secondary }]}
                            onPress={handleSignUpPress}
                        >
                            <Text style={styles.buttonText}>Sign Up</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 0,
        flex: 1,
        justifyContent: "center",
        backgroundColor: colors.ui.background,
    },
    input: {
        marginVertical: 4,
        marginHorizontal: 12,
        height: 50,
        fontFamily: globalFonts.regular,
        borderRadius: 2,
        padding: 10,
        backgroundColor: '#fff',
    },
    signButtonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 4,
        marginHorizontal: 12,
        marginVertical: 4,
    },
    signInButton: {
        flex: 1,
        height: 44,
        borderTopLeftRadius: 2,
        borderTopRightRadius: 2,
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 2,
        backgroundColor: colors.ui.secondary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    signUpButton: {
        flex: 1,
        height: 44,
        borderTopLeftRadius: 2,
        borderTopRightRadius: 2,
        borderBottomLeftRadius: 2,
        borderBottomRightRadius: 25,
        backgroundColor: colors.ui.secondary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontFamily: globalFonts.bold,
        fontSize: 16,
    },
    buttonActive: {
        backgroundColor: colors.actions.offer,
    },
    headerBanner: {
        marginHorizontal: 12,
        marginVertical: 4,
        height: 44,
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        borderBottomLeftRadius: 2,
        borderBottomRightRadius: 2,
        backgroundColor: colors.ui.secondary,
        justifyContent: 'center',
        alignItems: 'center',
    },
});