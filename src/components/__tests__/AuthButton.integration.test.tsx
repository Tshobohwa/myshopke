import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AuthButton from '../AuthButton';
import { AuthProvider } from '@/contexts/AuthContext';
import { authApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

// Mock dependencies
jest.mock('@/lib/api');
jest.mock('@/hooks/use-toast');

const mockAuthApi = authApi as jest.Mocked<typeof authApi>;
const mockUseToast = useToast as jest.MockedFunction<typeof useToast>;

const renderWithProvider = () => {
    const mockToast = jest.fn();
    mockUseToast.mockReturnValue({ toast: mockToast });

    return {
        ...render(
            <AuthProvider>
                <AuthButton />
            </AuthProvider>
        ),
        mockToast
    };
};

describe('AuthButton Integration Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();

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

    describe('Error Display Integration', () => {
        it('should display field-specific validation errors', async () => {
            const user = userEvent.setup();

            const validationError = {
                response: {
                    status: 400,
                    data: {
                        error: {
                            code: 'VALIDATION_ERROR',
                            message: 'Validation failed',
                            field: 'email',
                            validation: ['Email format is invalid']
                        }
                    }
                },
                detailedError: {
                    code: 'VALIDATION_ERROR',
                    message: 'Validation failed',
                    details: {
                        field: 'email',
                        validation: ['Email format is invalid'],
                        suggestions: ['Please enter a valid email address']
                    },
                    statusCode: 400,
                    timestamp: '2024-01-01T00:00:00.000Z'
                }
            };

            mockAuthApi.login.mockRejectedValueOnce(validationError);

            const { mockToast } = renderWithProvider();

            // Open the auth dialog
            const loginButton = screen.getByRole('button', { name: /login/i });
            await user.click(loginButton);

            // Fill in the form
            const emailInput = screen.getByLabelText(/email/i);
            const passwordInput = screen.getByLabelText(/password/i);
            const submitButton = screen.getByRole('button', { name: /login/i });

            await user.type(emailInput, 'invalid-email');
            await user.type(passwordInput, 'password');
            await user.click(submitButton);

            // Wait for error handling
            await waitFor(() => {
                expect(mockToast).toHaveBeenCalledWith(
                    expect.objectContaining({
                        title: 'Validation Error',
                        description: expect.stringContaining('Email format is invalid'),
                        variant: 'destructive'
                    })
                );
            });

            // Check that the email field has error styling
            expect(emailInput).toHaveClass('border-red-500');
        });

        it('should display network error with retry suggestions', async () => {
            const user = userEvent.setup();

            const networkError = {
                request: {},
                code: 'ECONNABORTED',
                message: 'timeout of 10000ms exceeded',
                detailedError: {
                    code: 'NETWORK_TIMEOUT',
                    message: 'Request timed out - the server is taking too long to respond',
                    details: {
                        suggestions: [
                            'Check your internet connection speed',
                            'Try again in a few moments',
                            'The server may be experiencing high load'
                        ]
                    },
                    statusCode: 0,
                    timestamp: '2024-01-01T00:00:00.000Z'
                }
            };

            mockAuthApi.login.mockRejectedValueOnce(networkError);

            const { mockToast } = renderWithProvider();

            // Open the auth dialog
            const loginButton = screen.getByRole('button', { name: /login/i });
            await user.click(loginButton);

            // Fill in and submit the form
            const emailInput = screen.getByLabelText(/email/i);
            const passwordInput = screen.getByLabelText(/password/i);
            const submitButton = screen.getByRole('button', { name: /login/i });

            await user.type(emailInput, 'test@example.com');
            await user.type(passwordInput, 'password');
            await user.click(submitButton);

            // Wait for error handling
            await waitFor(() => {
                expect(mockToast).toHaveBeenCalledWith(
                    expect.objectContaining({
                        title: 'Connection Error',
                        description: expect.stringContaining('Request timed out'),
                        variant: 'destructive',
                        duration: 8000
                    })
                );
            });
        });

        it('should display comprehensive registration errors', async () => {
            const user = userEvent.setup();

            const registrationError = {
                response: {
                    status: 400,
                    data: {
                        error: {
                            code: 'VALIDATION_ERROR',
                            message: 'Multiple validation errors',
                            validation: [
                                'Email format is invalid',
                                'Password must be at least 8 characters',
                                'Phone number format is invalid'
                            ]
                        }
                    }
                },
                detailedError: {
                    code: 'VALIDATION_ERROR',
                    message: 'Multiple validation errors',
                    details: {
                        validation: [
                            'Email format is invalid',
                            'Password must be at least 8 characters',
                            'Phone number format is invalid'
                        ],
                        suggestions: [
                            'Check all required fields',
                            'Use a valid email format',
                            'Use a stronger password',
                            'Use international phone number format'
                        ]
                    },
                    statusCode: 400,
                    timestamp: '2024-01-01T00:00:00.000Z'
                }
            };

            mockAuthApi.register.mockRejectedValueOnce(registrationError);

            const { mockToast } = renderWithProvider();

            // Open the auth dialog and switch to register
            const loginButton = screen.getByRole('button', { name: /login/i });
            await user.click(loginButton);

            const registerTab = screen.getByRole('tab', { name: /register/i });
            await user.click(registerTab);

            // Fill in the registration form
            const emailInput = screen.getByLabelText(/email/i);
            const passwordInput = screen.getByLabelText(/password/i);
            const fullNameInput = screen.getByLabelText(/full name/i);
            const phoneInput = screen.getByLabelText(/phone/i);
            const submitButton = screen.getByRole('button', { name: /create account/i });

            await user.type(emailInput, 'invalid-email');
            await user.type(passwordInput, 'short');
            await user.type(fullNameInput, 'Test User');
            await user.type(phoneInput, 'invalid-phone');
            await user.click(submitButton);

            // Wait for error handling
            await waitFor(() => {
                expect(mockToast).toHaveBeenCalledWith(
                    expect.objectContaining({
                        title: 'Validation Error',
                        description: expect.stringMatching(/Multiple validation errors.*Email format is invalid.*Password must be at least 8 characters/s),
                        variant: 'destructive'
                    })
                );
            });
        });

        it('should clear errors on successful authentication', async () => {
            const user = userEvent.setup();

            // First, simulate an error
            const loginError = {
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
                        suggestions: ['Double-check your credentials']
                    },
                    statusCode: 401,
                    timestamp: '2024-01-01T00:00:00.000Z'
                }
            };

            mockAuthApi.login
                .mockRejectedValueOnce(loginError)
                .mockResolvedValueOnce({
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
                });

            const { mockToast } = renderWithProvider();

            // Open the auth dialog
            const loginButton = screen.getByRole('button', { name: /login/i });
            await user.click(loginButton);

            // Fill in the form with wrong credentials first
            const emailInput = screen.getByLabelText(/email/i);
            const passwordInput = screen.getByLabelText(/password/i);
            const submitButton = screen.getByRole('button', { name: /login/i });

            await user.type(emailInput, 'test@example.com');
            await user.type(passwordInput, 'wrongpassword');
            await user.click(submitButton);

            // Wait for error
            await waitFor(() => {
                expect(mockToast).toHaveBeenCalledWith(
                    expect.objectContaining({
                        title: 'Authentication Failed',
                        variant: 'destructive'
                    })
                );
            });

            // Clear the password and try again with correct credentials
            await user.clear(passwordInput);
            await user.type(passwordInput, 'correctpassword');
            await user.click(submitButton);

            // Wait for success
            await waitFor(() => {
                expect(mockToast).toHaveBeenCalledWith(
                    expect.objectContaining({
                        title: 'Login Successful',
                        description: 'Welcome back, Test User!'
                    })
                );
            });

            // Dialog should close on success
            await waitFor(() => {
                expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
            });
        });
    });

    describe('Error Recovery', () => {
        it('should allow retry after network error', async () => {
            const user = userEvent.setup();

            const networkError = {
                request: {},
                code: 'ECONNREFUSED',
                message: 'connect ECONNREFUSED 127.0.0.1:3001'
            };

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

            mockAuthApi.login
                .mockRejectedValueOnce(networkError)
                .mockResolvedValueOnce(successResponse);

            renderWithProvider();

            // Open the auth dialog
            const loginButton = screen.getByRole('button', { name: /login/i });
            await user.click(loginButton);

            // Fill in and submit the form
            const emailInput = screen.getByLabelText(/email/i);
            const passwordInput = screen.getByLabelText(/password/i);
            const submitButton = screen.getByRole('button', { name: /login/i });

            await user.type(emailInput, 'test@example.com');
            await user.type(passwordInput, 'password');

            // First attempt - should fail
            await user.click(submitButton);

            // Wait a moment for the error to be processed
            await waitFor(() => {
                expect(mockAuthApi.login).toHaveBeenCalledTimes(1);
            });

            // Second attempt - should succeed
            await user.click(submitButton);

            await waitFor(() => {
                expect(mockAuthApi.login).toHaveBeenCalledTimes(2);
            });
        });
    });
});