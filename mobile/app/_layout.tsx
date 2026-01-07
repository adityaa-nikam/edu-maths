import { Slot, useRouter, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { AuthProvider, useAuth } from '../store/AuthContext';
import { useEffect } from 'react';

function NavigationContent() {
    const { isAuthenticated, isLoading } = useAuth();
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        if (isLoading) return; // Wait for session check to complete

        const inAuthGroup = segments[0] === '(auth)';

        if (!isAuthenticated && inAuthGroup) {
            // Redirect to login if not authenticated
            router.replace('/');
        } else if (isAuthenticated && !inAuthGroup) {
            // Redirect to home if authenticated
            router.replace('/(auth)/home');
        }
    }, [isAuthenticated, isLoading, segments]);

    // Show nothing while checking session
    if (isLoading) {
        return null;
    }

    return <Slot />;
}

export default function RootLayout() {
    return (
        <GestureHandlerRootView style={styles.container}>
            <AuthProvider>
                <NavigationContent />
            </AuthProvider>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
