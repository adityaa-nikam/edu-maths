/**
 * API Test Component
 * 
 * Simple component to test API connectivity and configuration.
 * Remove this file once you've verified the API is working.
 */

import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { apiClient } from '@services/api';
import { API_BASE_URL } from '@services/config';

export default function ApiTest() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string>('');

    const testConnection = async () => {
        setLoading(true);
        setResult('Testing connection...');

        try {
            // Test a public endpoint (academy endpoint)
            const response = await apiClient.get('/academy/aditya-academy');

            if (response.success) {
                setResult(`✅ Success!\n${JSON.stringify(response.data, null, 2)}`);
            } else {
                setResult(`❌ Error: ${response.error?.message}`);
            }
        } catch (error: any) {
            setResult(`❌ Exception: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>API Configuration Test</Text>
            <Text style={styles.url}>Base URL: {API_BASE_URL}</Text>

            <TouchableOpacity
                style={styles.button}
                onPress={testConnection}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.buttonText}>Test Connection</Text>
                )}
            </TouchableOpacity>

            {result ? (
                <View style={styles.resultContainer}>
                    <Text style={styles.resultText}>{result}</Text>
                </View>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        margin: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    url: {
        fontSize: 12,
        color: '#666',
        marginBottom: 16,
    },
    button: {
        backgroundColor: '#007AFF',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    resultContainer: {
        marginTop: 16,
        padding: 12,
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    resultText: {
        fontSize: 12,
        fontFamily: 'monospace',
    },
});
