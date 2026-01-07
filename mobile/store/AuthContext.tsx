/**
 * Authentication Context
 * 
 * Manages authentication state across the app.
 * Integrates with API client and secure storage.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
    setAuthToken as setApiAuthToken,
    clearAuthToken as clearApiAuthToken,
    setUnauthorizedCallback
} from '../services/api';
import {
    storeAuthToken,
    getAuthToken,
    storeStudentData,
    getStudentData,
    clearAllData
} from '../services/storage';

interface Student {
    id: string;
    username: string;
    academyId: string;
    academyName: string;
    academySlug: string;  // Added for API calls
}

interface AuthContextType {
    isAuthenticated: boolean;
    student: Student | null;
    isLoading: boolean;
    login: (student: Student, token: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [student, setStudent] = useState<Student | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Check for existing session on app start
    useEffect(() => {
        checkExistingSession();

        // Register global 401 handler
        // This will automatically logout when API returns 401
        setUnauthorizedCallback(() => {
            console.warn('🔒 Auto-logout triggered by 401 response');
            logout();
        });

        // Cleanup on unmount
        return () => {
            setUnauthorizedCallback(null);
        };
    }, []);

    const checkExistingSession = async () => {
        try {
            const token = await getAuthToken();
            const studentData = await getStudentData();

            if (token && studentData) {
                // Restore session
                setApiAuthToken(token);
                setStudent(studentData);
                setIsAuthenticated(true);
                console.log('✅ Session restored:', studentData.username);
            }
        } catch (error) {
            console.error('❌ Error checking session:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (studentData: Student, token: string) => {
        try {
            // Store token securely
            await storeAuthToken(token);

            // Store student data
            await storeStudentData(studentData);

            // Set API client auth token
            setApiAuthToken(token);

            // Update state
            setStudent(studentData);
            setIsAuthenticated(true);

            console.log('✅ Student logged in:', studentData.username);
        } catch (error) {
            console.error('❌ Error during login:', error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            // Clear all stored data
            await clearAllData();

            // Clear API client auth token
            clearApiAuthToken();

            // Update state
            setStudent(null);
            setIsAuthenticated(false);

            console.log('👋 Student logged out');
        } catch (error) {
            console.error('❌ Error during logout:', error);
            throw error;
        }
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, student, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
