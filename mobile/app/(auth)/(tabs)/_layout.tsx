import { Tabs } from 'expo-router';
import { TouchableOpacity, Alert, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../store/AuthContext';

export default function TabsLayout() {
    const { logout } = useAuth();

    const handleAccountPress = () => {
        Alert.alert(
            'Account Actions',
            'What would you like to do?',
            [
                {
                    text: 'Logout',
                    onPress: logout,
                    style: 'destructive',
                },
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
            ],
            { cancelable: true }
        );
    };

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
                headerRight: () => (
                    <TouchableOpacity
                        onPress={handleAccountPress}
                        style={{ marginRight: 16, padding: 4 }}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="person-circle-outline" size={28} color="#fff" />
                    </TouchableOpacity>
                ),
                tabBarActiveTintColor: '#007AFF',
                tabBarInactiveTintColor: '#666',
                tabBarStyle: {
                    backgroundColor: '#fff',
                    borderTopWidth: 1,
                    borderTopColor: '#ddd',
                    height: 60,
                    paddingBottom: 8,
                },
            }}
        >
            <Tabs.Screen
                name="home"
                options={{
                    title: 'Home',
                    tabBarLabel: 'Home',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="home-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="exam"
                options={{
                    title: 'Exams',
                    tabBarLabel: 'Exams',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="document-text-outline" size={size} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}
