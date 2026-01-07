/**
 * Authenticated Layout
 * 
 * Tab navigation for authenticated users.
 * Shows: Home, Exam, Result tabs
 */

import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';

export default function AuthLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: true,
                headerStyle: {
                    backgroundColor: '#007AFF',
                },
                headerTintColor: '#fff',
                headerTitleStyle: {
                    fontWeight: 'bold',
                },
                tabBarActiveTintColor: '#007AFF',
                tabBarInactiveTintColor: '#666',
                tabBarStyle: {
                    backgroundColor: '#fff',
                    borderTopWidth: 1,
                    borderTopColor: '#ddd',
                },
            }}
        >
            <Tabs.Screen
                name="home"
                options={{
                    title: 'Home',
                    tabBarLabel: 'Home',
                    tabBarIcon: () => null, // Will add icons later
                }}
            />
            <Tabs.Screen
                name="exam"
                options={{
                    title: 'Exams',
                    tabBarLabel: 'Exams',
                    tabBarIcon: () => null,
                }}
            />
            <Tabs.Screen
                name="result"
                options={{
                    title: 'Results',
                    tabBarLabel: 'Results',
                    tabBarIcon: () => null,
                }}
            />
        </Tabs>
    );
}
