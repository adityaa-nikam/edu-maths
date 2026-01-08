import { Stack } from 'expo-router';

export default function AuthStackLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false, // We'll manage headers in individual screens or tabs
                animation: 'slide_from_right',
            }}
        >
            {/* The tabs are the entry point */}
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

            {/* Flow screens */}
            <Stack.Screen
                name="exam-gate"
                options={{
                    title: 'Exam Summary',
                    headerShown: true,
                    headerStyle: { backgroundColor: '#007AFF' },
                    headerTintColor: '#fff',
                }}
            />
            <Stack.Screen
                name="exam-taking"
                options={{
                    headerShown: false,
                    gestureEnabled: false, // Prevent swiping back during exam
                }}
            />
            <Stack.Screen
                name="result"
                options={{
                    headerShown: false,
                    gestureEnabled: false,
                }}
            />
        </Stack>
    );
}
