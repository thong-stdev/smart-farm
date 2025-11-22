import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';
import { useLiff } from './LiffContext';
import logger from '../utils/logger';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const { liff, profile, isReady } = useLiff();
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Check for existing token on mount
    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            logger.info('Checking auth token:', token ? 'Found' : 'Not found');

            if (token) {
                try {
                    logger.info('Validating token with backend...');
                    const response = await api.get('/auth/me');
                    logger.info('Auth check response:', response.data);

                    if (response.data.success) {
                        setUser(response.data.user);
                        setIsAuthenticated(true);
                        logger.info('User authenticated:', response.data.user);
                    }
                } catch (error) {
                    logger.error('Token validation failed:', error);
                    // Only clear if it's a 401 (Unauthorized)
                    if (error.response && error.response.status === 401) {
                        logger.info('Token expired or invalid, clearing storage');
                        localStorage.removeItem('token');
                        localStorage.removeItem('refreshToken');
                    }
                }
            }
            setIsLoading(false);
        };

        checkAuth();
    }, []);

    // Handle Line Login
    const loginWithLine = async () => {
        logger.info('Attempting Line Login...', { profile, liff: !!liff });
        if (!profile || !liff) {
            logger.info('Login aborted: No profile or liff object');
            return;
        }

        try {
            setIsLoading(true);
            const accessToken = liff.getAccessToken();
            logger.info('Got Access Token:', accessToken ? 'Yes' : 'No');

            if (!accessToken) {
                throw new Error('No access token available');
            }

            logger.info('Sending token and profile to backend...');
            const idToken = liff.getDecodedIDToken();
            const payload = {
                accessToken,
                userId: profile.userId,
                displayName: profile.displayName,
                pictureUrl: profile.pictureUrl,
                statusMessage: profile.statusMessage,
                email: idToken?.email,
            };

            logger.info('Payload:', payload);

            const response = await api.post('/auth/line/callback', payload);

            logger.info('Backend response:', response.data);

            if (response.data.success) {
                const { token: jwtToken, refreshToken, user } = response.data;

                logger.info('Login success! Saving tokens...', { jwtToken: jwtToken?.substring(0, 10) + '...', refreshToken: !!refreshToken });

                localStorage.setItem('token', jwtToken);
                localStorage.setItem('refreshToken', refreshToken);

                // Verify immediately
                const savedToken = localStorage.getItem('token');
                logger.info('Immediate verification - Token in storage:', savedToken ? 'Yes' : 'No');

                setUser(user);
                setIsAuthenticated(true);
                logger.info('State updated. User:', user);

                // Small delay to ensure state updates before navigation
                await new Promise((resolve) => setTimeout(resolve, 200));
            } else {
                logger.warn('Login response not success:', response.data);
                alert('Login failed: ' + (response.data.error || 'Unknown error from server'));
            }
        } catch (error) {
            logger.error('Login failed:', error);
            logger.error('Error details:', error.response?.data);

            // Properly extract error message
            let errorMessage = 'Connection failed';
            if (error.response?.data?.error) {
                errorMessage = error.response.data.error;
            } else if (error.message) {
                errorMessage = error.message;
            }

            alert('Login error: ' + errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (username, password) => {
        try {
            setIsLoading(true);
            const response = await api.post('/auth/login', { username, password });

            if (response.data.success) {
                const { token, refreshToken, user } = response.data;
                localStorage.setItem('token', token);
                localStorage.setItem('refreshToken', refreshToken);
                setUser(user);
                setIsAuthenticated(true);
                return { success: true };
            }
        } catch (error) {
            logger.error('Login failed:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Login failed'
            };
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (data) => {
        try {
            setIsLoading(true);
            const response = await api.post('/auth/register', data);

            if (response.data.success) {
                const { token, refreshToken, user } = response.data;
                localStorage.setItem('token', token);
                localStorage.setItem('refreshToken', refreshToken);
                setUser(user);
                setIsAuthenticated(true);
                return { success: true };
            }
        } catch (error) {
            logger.error('Registration failed:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Registration failed'
            };
        } finally {
            setIsLoading(false);
        }
    };

    const linkSocialAccount = async (provider, providerUserId, providerData) => {
        try {
            const response = await api.post('/auth/link-social', {
                provider,
                providerUserId,
                providerData
            });
            return response.data;
        } catch (error) {
            logger.error('Link social failed:', error);
            throw error;
        }
    };

    const setPassword = async (username, password) => {
        try {
            const response = await api.post('/auth/set-password', {
                username,
                password
            });
            return response.data;
        } catch (error) {
            logger.error('Set password failed:', error);
            throw error;
        }
    };

    const logout = async () => {
        logger.info('Logging out...');
        try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
                logger.info('Calling backend logout...');
                await api.post('/auth/logout', { refreshToken });
                logger.info('Backend logout successful');
            }
        } catch (error) {
            logger.error('Logout API call failed:', error);
        } finally {
            logger.info('Clearing local state...');
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            setUser(null);
            setIsAuthenticated(false);

            if (liff && liff.isLoggedIn()) {
                logger.info('Logging out from LIFF...');
                liff.logout();
            }

            // Slight delay to ensure state updates
            setTimeout(() => {
                window.location.href = '/login';
            }, 100);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                isAuthenticated,
                loginWithLine,
                login,
                register,
                linkSocialAccount,
                setPassword,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
