import { Redirect } from 'expo-router';
import { useState } from 'react';
import { Text, View, StyleSheet, TextInput, KeyboardAvoidingView, Button, ActivityIndicator } from 'react-native'
import { auth } from '@/lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, User } from 'firebase/auth';
import { colors } from '../../styles/globalStyles';

export default function HandleLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const signUp = async () => {
        setLoading(true);
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            alert('Check your email!');
        } catch(e: any) {
            alert('Sign Up Failed: ' + e.message)
        } finally {
            setLoading(false);
        } 
    }

    const signIn = async () => {
        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            // alert('Check your email!');
        } catch(e: any) {
            alert('Sign In Failed: ' + e.message)
        } finally {
            setLoading(false);
        } 
    }

    return (
        <View 
          style={styles.container}
        >
            <KeyboardAvoidingView behavior="padding">
                <TextInput 
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType='email-address'
                    placeholder='Email'
                />
                
                <TextInput 
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    placeholder='Password'
                />
                {loading ? (
                    <ActivityIndicator size={"small"} style={{ margin: 28 }} />
                ) : (
                    <>
                        <Button onPress={signUp} title="Sign Up" />
                        <Button onPress={signIn} title="Sign In" />
                    </>
                )
                } 
            </KeyboardAvoidingView>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 0, 
        flex: 1,
        justifyContent: "center",
        backgroundColor: colors.ui.secondary,
    },
    input: {
        marginVertical: 4,
        marginHorizontal: 12,
        height: 50,
        
        borderRadius: 2,
        padding: 10,
        backgroundColor: '#fff',
    }
})
