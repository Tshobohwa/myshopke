import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import { authApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

// Mock dependencies
jest.mock('@/lib/api');
jest.mock('@/hooks/use-toast');
jest.mock('@/lib/auth-error-handler');

const mockAuthApi = authApi as jest.Mocked<typeof authApi>;
const mockUseToast = useToast as jest.MockedFunction<typeof useToast>;

// Test component to access auth context
const TestComponent = () => {
    const { login, register, user, loading, isAuthenticated } = useAuth();

    return (
        <div>
            <div data-testid="loading">{loading ? 'loading' : 'not-loading'}</div>
            <div data-testid="authenticated">{isAuthenticated ? 'authenticated' : 'not-authenticated'}</div>
            <div data-testid="user">{user?.fullName || 'no-user'}</div>
            <button onClick={() => login('test@example.com', 'password')} data-testid="login-btn">
                Login
            </button>
            <button onClick={() => register({
                email: 'test@example.com',
                password: 'password',
                fullName: 'Test User',
                phoneNumber: '+1234567890',
                role: 'BUYER'
            })} data-testid="register-btn">
                Register
            </button>
        </div>
    );
};

const renderWithProvider = () => {
    return render(
        <AuthProvider>
            <TestComponent />
        </AuthProvider>
    );
};

describe('AuthContext Error Handling', () => {
    const mockToast = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        mockUseToast.mockReturnValue({ toast: mockToast });

        // Mock localStorage
        Object.defineProperty(window, 'localStorage', {
            value: {
                getItem: jest.fn(),
                setItem: jest.fn(),
                removeItem: jest.fn(),
            },
            writable: true,
        });
    });

    describe('login error handling', () => {
        it('should handle API validation errors', async () => {
            const validationError = {
                response: {
                    status: 400,
                    data: {
                        error: {
                            code: 'VALIDATION_ERROR',
                            message: 'Invalid input data',
                            validation: ['Email is required', 'Password is too short']
                        }
                    }
                },
                detailedError: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid input data',
                    details: {
                        validation: ['Email is required', 'Password is too short'],
                        suggestions: ['Check all required fields', 'Use a stronger password']
                    },
                    statusCode: 400,
                    timestamp: '2024-01-01T00:00:00.000Z'
                }
            };

            mockAuthApi.login.mockRejectedValueOnce(validationError);

            renderWithProvider();

            const loginBtn = screen.getByTestId('login-btn');
            loginBtn.click();

            await waitFor(() => {
                expect(mockToast).toHaveBeenCalledWith(
                    expect.objectContaining({
                        title: 'Validation Error',
                        description: expect.stringContaining('Invalid input data'),
                        variant: 'destructive',
                        duration: 8000
                    })
                );
            });
        });

        it('should handle network timeout errors', async () => {
            const networkError = {
                request: {},
                code: 'ECONNABORTED',
                message: 'timeout of 10000ms exceeded',
                detailedError: {
                    code: 'NETWORK_TIMEOUT',
                    message: 'Request timed out - the server is taking too long to respond',
                    details: {
                        suggestions: ['Check your internet connection speed', 'Try again in a few moments']
                    },
                    statusCode: 0,
                    timestamp: '2024-01-01T00:00:00.000Z'
                }
            };

            mockAuthApi.login.mockRejectedValueOnce(networkError);

            renderWithProvider();

            const loginBtn = screen.getByTestId('login-btn');
            loginBtn.click();

            await waitFor(() => {
                expect(mockToast).toHaveBeenCalledWith(
                    expect.objectContaining({
                        title: 'Connection Error',
                        description: expect.stringContaining('Request timed out'),
                        variant: 'destructive'
                    })
                );
            });
        });

        it('should handle server unavailable errors', async () => {
            const serverError = {
                request: {},
                code: 'ECONNREFUSED',
                message: 'connect ECONNREFUSED 127.0.0.1:3001',
                detailedError: {
                    code: 'SERVER_UNAVAILABLE',
                    message: 'Cannot connect to the server - it may be down or unreachable',
                    details: {
                        suggestions: ['Check if the server is running', 'Try again later']
                    },
                    statusCode: 0,
                    timestamp: '2024-01-01T00:00:00.000Z'
                }
            };

            mockAuthApi.login.mockRejectedValueOnce(serverError);

            renderWithProvider();

            const loginBtn = screen.getByTestId('login-btn');
            loginBtn.click();

            await waitFor(() => {
                expect(mockToast).toHaveBeenCalledWith(
                    expect.objectContaining({
                        title: 'Connection Error',
                        description: expect.stringContaining('Cannot connect to the server'),
                        variant: 'destructive'
                    })
                );
            });
        });

        it('should handle authentication errors', async () => {
            const authError = {
                response: {
                    status: 401,
                    data: {
                        error: {
                            code: 'INVALID_CREDENTIALS',
                            message: 'Invalid email or password'
                        }
                    }
                },
                detailedError: {
                    code: 'INVALID_CREDENTIALS',
                    message: 'Invalid email or password',
                    details: {
                        suggestions: ['Double-check your email and password', 'Try resetting your password']
                    },
                    statusCode: 401,
                    timestamp: '2024-01-01T00:00:00.000Z'
                }
            };

            mockAuthApi.login.mockRejectedValueOnce(authError);

            renderWithProvider();

            const loginBtn = screen.getByTestId('login-btn');
            loginBtn.click();

            await waitFor(() => {
                expect(mockToast).toHaveBeenCalledWith(
                    expect.objectContaining({
                        title: 'Authentication Failed',
                        description: expect.stringContaining('Invalid email or password'),
                        variant: 'destructive'
                    })
                );
            });
        });
    });

    describe('register error handling', () => {
        it('should handle email already exists error', async () => {
            const emailExistsError = {
                response: {
                    status: 409,
                    data: {
                        error: {
                            code: 'EMAIL_ALREADY_EXISTS',
                            message: 'Email is already registered'
                        }
                    }
                },
                detailedError: {
                    code: 'EMAIL_ALREADY_EXISTS',
                    message: 'Email is already registered',
                    details: {
                        suggestions: ['Try logging in instead', 'Use a different email address']
                    },
                    statusCode: 409,
                    timestamp: '2024-01-01T00:00:00.000Z'
                }
            };

            mockAuthApi.register.mockRejectedValueOnce(emailExistsError);

            renderWithProvider();

            const registerBtn = screen.getByTestId('register-btn');
            registerBtn.click();

            await waitFor(() => {
                expect(mockToast).toHaveBeenCalledWith(
                    expect.objectContaining({
                        title: 'Authentication Failed',
                        description: expect.stringContaining('Email is already registered'),
                        variant: 'destructive'
                    })
                );
            });
        });

        it('should handle validation errors with field details', async () => {
            const validationError = {
                response: {
                    status: 400,
                    data: {
                        error: {
                            code: 'VALIDATION_ERROR',
                            message: 'Validation failed',
                            field: 'password',
                            validation: ['Password must be at least 8 characters']
                        }
                    }
                },
                detailedError: {
                    code: 'VALIDATION_ERROR',
                    message: 'Validation failed',
                    details: {
                        field: 'password',
                        validation: ['Password must be at least 8 characters'],
                        suggestions: ['Use a stronger password with at least 8 characters']
                    },
                    statusCode: 400,
                    timestamp: '2024-01-01T00:00:00.000Z'
                }
            };

            mockAuthApi.register.mockRejectedValueOnce(validationError);

            renderWithProvider();

            const registerBtn = screen.getByTestId('register-btn');
            registerBtn.click();

            await waitFor(() => {
                expect(mockToast).toHaveBeenCalledWith(
                    expect.objectContaining({
                        title: 'Validation Error',
                        description: expect.stringContaining('Password must be at least 8 characters'),
                        variant: 'destructive'
                    })
                );
            });
        });
    });

    describe('successful authentication', () => {
        it('should handle successful login', async () => {
            const successResponse = {
                data: {
                    user: {
                        id: '1',
                        email: 'test@example.com',
                        fullName: 'Test User',
                        role: 'BUYER'
                    },
                    token: 'jwt-token',
                    refreshToken: 'refresh-token'
                }
            };

            mockAuthApi.login.mockResolvedValueOnce(successResponse);

            renderWithProvider();

            const loginBtn = screen.getByTestId('login-btn');
            loginBtn.click();

            await waitFor(() => {
                expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
                expect(screen.getByTestId('user')).toHaveTextContent('Test User');
                expect(mockToast).toHaveBeenCalledWith(
                    expect.objectContaining({
                        title: 'Login Successful',
                        description: 'Welcome back, Test User!'
                    })
                );
            });
        });

        it('should handle successful registration', async () => {
            const successResponse = {
                data: {
                    user: {
                        id: '1',
                        email: 'test@example.com',
                        fullName: 'Test User',
                        role: 'BUYER'
                    },
                    token: 'jwt-token',
                    refreshToken: 'refresh-token'
                }
            };

            mockAuthApi.register.mockResolvedValueOnce(successResponse);

            renderWithProvider();

            const registerBtn = screen.getByTestId('register-btn');
            registerBtn.click();

            await waitFor(() => {
                expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
                expect(screen.getByTestId('user')).toHaveTextContent('Test User');
                expect(mockToast).toHaveBeenCalledWith(
                    expect.objectContaining({
                        title: 'Registration Successful',
                        description: 'Welcome to MyShopKE, Test User!'
                    })
                );
            });
        });
    });

    describe('loading states', () => {
        it('should show loading state during login', async () => {
            let resolveLogin: (value: any) => void;
            const loginPromise = new Promise((resolve) => {
                resolveLogin = resolve;
            });

            mockAuthApi.login.mockReturnValueOnce(loginPromise);

            renderWithProvider();

            expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');

            const loginBtn = screen.getByTestId('login-btn');
            loginBtn.click();

            await waitFor(() => {
                expect(screen.getByTestId('loading')).toHaveTextContent('loading');
            });

            resolveLogin!({
                data: {
                    user: { id: '1', fullName: 'Test User' },
                    token: 'token',
                    refreshToken: 'refresh'
                }
            });

            await waitFor(() => {
                expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
            });
        });
    });
});