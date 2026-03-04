import { useState } from 'react';
import { Text, View, StyleSheet, TextInput, KeyboardAvoidingView, ActivityIndicator, TouchableOpacity } from 'react-native'
import { auth } from '@/lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { colors, globalFonts } from '../../styles/globalStyles';

export default function HandleLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSigningUp, setIsSigningUp] = useState(false);

    // Update your .env file so that EXPO_PUBLIC_API_URL = {your IP address}
    const API_URL = process.env.EXPO_PUBLIC_API_URL

    const signUp = async () => {
        // If there is currently a sign in happening, stop the extra sign in
        if (loading) return;
        setLoading(true);
        if (!firstName.trim() || !lastName.trim()) {
            alert('Please enter your first and last name.');
            return;
        }
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            // Gets token for backend verification
            const token = await userCredential.user.getIdToken();
        
            const response  = await fetch(`${API_URL}/dev/create_user`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    // Sends first and last name to the backend
                    firstName,
                    lastName,
                }),
            });
            // const data = await response.json();
            // console.log("BACKEND RESPONSE:", data);
        } catch(e: any) {
            alert('Sign Up Failed: ' + e.message);
        } finally {
            setLoading(false);
        }
    };

    const signIn = async () => {
        // If there is currently a sign in happening, stop the extra sign in
        if (loading) {
            console.log("Attempted 2nd sign in")
            return;
        }
        setLoading(true);
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const token = await userCredential.user.getIdToken();
        
            const response = await fetch(`${API_URL}/dev/user_data`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await response.json();
            console.log("BACKEND RESPONSE:", data);
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
                        style={styles.input}
                        value={firstName}
                        onChangeText={setFirstName}
                        placeholder='First Name'
                        placeholderTextColor={colors.ui.cardsecondary}
                    />
                )}
                {isSigningUp && (
                    <TextInput
                        style={styles.input}
                        value={lastName}
                        onChangeText={setLastName}
                        placeholder='Last Name'
                        placeholderTextColor={colors.ui.cardsecondary}
                    />
                )}
                <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType='email-address'
                    placeholder='Email'
                    placeholderTextColor={colors.ui.cardsecondary}
                />
                <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    placeholder='Password'
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