import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { View, ActivityIndicator } from 'react-native';

export default function RootLayout() {
    const [initializing, setInitializing] = useState(true);
    const [user, setUser] = useState<User | null>(null);

    const router = useRouter();
    const segments = useSegments();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            if (initializing) setInitializing(false);
        });
      
        return unsubscribe;
    }, []);

    useEffect(() => {
        if (initializing) return;

        const inAuthGroup = segments[0] === '(auth)';
        const inTabsGroup = segments[0] === '(tabs)';
        const atRoot = (segments as string[]).length === 0;
        
        // If user is not logged in or currently not in an authorization tab, send to auth tab
        if (!user && !inAuthGroup) {
            router.replace('/login');
        } 
        // if user is logged in and (on login page OR at the root (/)), send to feed
        else if (user && (inAuthGroup || atRoot)) {
            router.replace('/feed');
        }

    }, [user, initializing, segments]
    )

    if (initializing) 
        return (
            <View 
                style={{
                    alignItems: "center",
                    justifyContent: "center",
                    flex: 1,
                }} >
                <ActivityIndicator size="large" />
            </View>
    )
    
    return <Stack screenOptions={{ headerShown: false }} />;
}
