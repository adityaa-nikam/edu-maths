import { Tabs } from 'expo-router';

export default function TabsLayout() {
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
                    tabBarIcon: () => null, // Placeholder for icon
                }}
            />
            <Tabs.Screen
                name="exam"
                options={{
                    title: 'Exams',
                    tabBarLabel: 'Exams',
                    tabBarIcon: () => null, // Placeholder for icon
                }}
            />
        </Tabs>
    );
}
