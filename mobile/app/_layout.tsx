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

        const checkExamSession = async () => {
            const { examSessionManager } = await import('../store/examSession');
            const session = await examSessionManager.init();

            if (session && session.examStatus === 'active') {
                console.log('🔄 Active exam session found, redirecting to Gate:', session.examId);
                router.replace({
                    pathname: '/(auth)/exam-gate',
                    params: { examId: session.examId }
                });
                return true;
            }
            return false;
        };

        const inAuthGroup = segments[0] === '(auth)';

        if (!isAuthenticated && inAuthGroup) {
            router.replace('/');
        } else if (isAuthenticated && !inAuthGroup) {
            // Priority: Check if we need to resume an exam first
            checkExamSession().then(isRedirecting => {
                if (!isRedirecting) {
                    router.replace('/(auth)/(tabs)/home');
                }
            });
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
