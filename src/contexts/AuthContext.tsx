import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { AuthErrorHandler } from '@/lib/auth-error-handler';

interface User {
    id: string;
    email: string;
    password: string;
    fullName: string;
    phoneNumber: string;
    role: 'FARMER' | 'BUYER';
    isActive: boolean;
    profile?: {
        location?: string;
        farmSize?: number;
    };
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<boolean>;
    register: (userData: RegisterData) => Promise<boolean>;
    logout: () => void;
    updateProfile: (profileData: any) => Promise<boolean>;
    refreshUser: () => Promise<void>;
}

interface RegisterData {
    email: string;
    password: string;
    fullName: string;
    phoneNumber: string;
    role: 'FARMER' | 'BUYER';
    profile?: {
        location?: string;
        farmSize?: number;
    };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    // Local storage functions
    const getCurrentUser = (): User | null => {
        const userData = localStorage.getItem('user');
        return userData ? JSON.parse(userData) : null;
    };

    const saveUser = (userData: User): void => {
        localStorage.setItem('user', JSON.stringify(userData));
    };

    const clearUser = (): void => {
        localStorage.removeItem('user');
    };

    // Check if user is authenticated on mount
    useEffect(() => {
        const initializeAuth = () => {
            const userData = getCurrentUser();
            if (userData) {
                setUser(userData);
            }
            setLoading(false);
        };

        initializeAuth();
    }, []);

    const login = async (email: string, password: string): Promise<boolean> => {
        try {
            setLoading(true);

            const response = await authApi.login(email, password);

            if (response.success) {
                const userData = response.user;
                saveUser(userData);
                setUser(userData);

                toast({
                    title: "Login Successful",
                    description: `Welcome back, ${userData.fullName}!`,
                });

                return true;
            } else {
                // Process the error using AuthErrorHandler for detailed error information
                const detailedError = AuthErrorHandler.processError(response);
                const errorMessage = AuthErrorHandler.formatErrorMessage(detailedError, {
                    showDetails: true,
                    showSuggestions: true,
                    logToConsole: true,
                });

                // Log detailed error for debugging
                AuthErrorHandler.logError(detailedError, 'Login Failed');

                toast({
                    title: AuthErrorHandler.getErrorTitle(detailedError),
                    description: errorMessage,
                    variant: "destructive",
                });
                return false;
            }
        } catch (error: any) {
            // Process the caught error using AuthErrorHandler
            const detailedError = AuthErrorHandler.processError(error);
            const errorMessage = AuthErrorHandler.formatErrorMessage(detailedError, {
                showDetails: true,
                showSuggestions: true,
                logToConsole: true,
            });

            // Log detailed error for debugging
            AuthErrorHandler.logError(detailedError, 'Login Exception');

            toast({
                title: AuthErrorHandler.getErrorTitle(detailedError),
                description: errorMessage,
                variant: "destructive",
            });
            return false;
        } finally {
            setLoading(false);
        }
    };

    const register = async (userData: RegisterData): Promise<boolean> => {
        try {
            setLoading(true);
            const response = await authApi.register(userData);

            if (response.success) {
                const newUser = response.user;
                saveUser(newUser);
                setUser(newUser);

                toast({
                    title: "Registration Successful",
                    description: `Welcome to MyShopKE, ${newUser.fullName}!`,
                });

                return true;
            } else {
                // Process the error using AuthErrorHandler for detailed error information
                const detailedError = AuthErrorHandler.processError(response);
                const errorMessage = AuthErrorHandler.formatErrorMessage(detailedError, {
                    showDetails: true,
                    showSuggestions: true,
                    logToConsole: true,
                });

                // Log detailed error for debugging
                AuthErrorHandler.logError(detailedError, 'Registration Failed');

                toast({
                    title: AuthErrorHandler.getErrorTitle(detailedError),
                    description: errorMessage,
                    variant: "destructive",
                });
                return false;
            }
        } catch (error: any) {
            // Process the caught error using AuthErrorHandler
            const detailedError = AuthErrorHandler.processError(error);
            const errorMessage = AuthErrorHandler.formatErrorMessage(detailedError, {
                showDetails: true,
                showSuggestions: true,
                logToConsole: true,
            });

            // Log detailed error for debugging
            AuthErrorHandler.logError(detailedError, 'Registration Exception');

            toast({
                title: AuthErrorHandler.getErrorTitle(detailedError),
                description: errorMessage,
                variant: "destructive",
            });
            return false;
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        clearUser();
        setUser(null);

        toast({
            title: "Logged Out",
            description: "You have been successfully logged out.",
        });
    };

    const updateProfile = async (profileData: any): Promise<boolean> => {
        try {
            setLoading(true);

            if (!user) {
                toast({
                    title: "Update Failed",
                    description: "No user logged in",
                    variant: "destructive",
                });
                return false;
            }

            const response = await authApi.updateProfile({ userId: user.id, ...profileData });

            if (response.success) {
                const updatedUser = response.user;
                saveUser(updatedUser);
                setUser(updatedUser);

                toast({
                    title: "Profile Updated",
                    description: "Your profile has been updated successfully.",
                });

                return true;
            } else {
                // Process the error using AuthErrorHandler for detailed error information
                const detailedError = AuthErrorHandler.processError(response);
                const errorMessage = AuthErrorHandler.formatErrorMessage(detailedError, {
                    showDetails: true,
                    showSuggestions: true,
                    logToConsole: true,
                });

                // Log detailed error for debugging
                AuthErrorHandler.logError(detailedError, 'Profile Update Failed');

                toast({
                    title: AuthErrorHandler.getErrorTitle(detailedError),
                    description: errorMessage,
                    variant: "destructive",
                });
                return false;
            }
        } catch (error: any) {
            // Process the caught error using AuthErrorHandler
            const detailedError = AuthErrorHandler.processError(error);
            const errorMessage = AuthErrorHandler.formatErrorMessage(detailedError, {
                showDetails: true,
                showSuggestions: true,
                logToConsole: true,
            });

            // Log detailed error for debugging
            AuthErrorHandler.logError(detailedError, 'Profile Update Exception');

            toast({
                title: AuthErrorHandler.getErrorTitle(detailedError),
                description: errorMessage,
                variant: "destructive",
            });
            return false;
        } finally {
            setLoading(false);
        }
    };

    const refreshUser = async () => {
        if (!user) return;

        try {
            const response = await authApi.getProfile(user.id);
            if (response.success) {
                const updatedUser = response.user;
                saveUser(updatedUser);
                setUser(updatedUser);
            }
        } catch (error: any) {
            console.error('User refresh failed:', error);
        }
    };

    const value: AuthContextType = {
        user,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updateProfile,
        refreshUser,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};