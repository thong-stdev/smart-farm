const axios = require('axios');
const bcrypt = require('bcryptjs');
const prisma = require('../config/database');
const { generateAccessToken, generateRefreshToken } = require('../utils/jwt');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Register with username/password
 * POST /api/auth/register
 */
const register = asyncHandler(async (req, res) => {
    const { username, password, email, fullName, phone } = req.body;

    if (!username || !password || !email) {
        return res.status(400).json({
            success: false,
            error: 'Username, password, and email are required'
        });
    }

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
        where: {
            OR: [
                { username },
                { email }
            ]
        }
    });

    if (existingUser) {
        return res.status(400).json({
            success: false,
            error: 'Username or email already exists'
        });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await prisma.user.create({
        data: {
            username,
            email,
            password: hashedPassword,
            fullName,
            phone,
            role: 'user'
        },
        select: {
            id: true,
            username: true,
            email: true,
            fullName: true,
            role: true
        }
    });

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id);

    // Store refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await prisma.userSession.create({
        data: {
            userId: user.id,
            refreshToken,
            expiresAt
        }
    });

    res.status(201).json({
        success: true,
        token: accessToken,
        refreshToken,
        user
    });
});

/**
 * Login with username/password
 * POST /api/auth/login
 */
const login = asyncHandler(async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            success: false,
            error: 'Username and password are required'
        });
    }

    // Find user
    const user = await prisma.user.findFirst({
        where: {
            OR: [
                { username },
                { email: username } // Allow login with email
            ]
        },
        include: {
            oauthProviders: {
                select: { provider: true }
            }
        }
    });

    if (!user || !user.password) {
        return res.status(401).json({
            success: false,
            error: 'Invalid credentials'
        });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(401).json({
            success: false,
            error: 'Invalid credentials'
        });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id);

    // Delete old sessions
    await prisma.userSession.deleteMany({
        where: { userId: user.id }
    });

    // Store refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await prisma.userSession.create({
        data: {
            userId: user.id,
            refreshToken,
            expiresAt
        }
    });

    // Get profile image from Line if linked
    // We will fetch all providers below and extract it from there

    // Re-fetch providers properly
    const providers = await prisma.userOAuthProvider.findMany({
        where: { userId: user.id }
    });

    const lineData = providers.find(p => p.provider === 'line')?.providerData;
    const profileImage = lineData?.pictureUrl || null;

    res.json({
        success: true,
        token: accessToken,
        refreshToken,
        user: {
            id: user.id,
            username: user.username,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            profileImage,
            providers: providers.map(p => p.provider)
        }
    });
});

/**
 * Link social account to existing user
 * POST /api/auth/link-social
 */
const linkSocial = asyncHandler(async (req, res) => {
    const { provider, providerUserId, providerData } = req.body;
    const userId = req.user.id; // From auth middleware

    if (!provider || !providerUserId) {
        return res.status(400).json({
            success: false,
            error: 'Provider and Provider User ID are required'
        });
    }

    // Check if this social account is already linked to ANY user
    const existingLink = await prisma.userOAuthProvider.findUnique({
        where: {
            unique_provider_user: {
                provider,
                providerUserId
            }
        }
    });

    if (existingLink) {
        if (existingLink.userId === userId) {
            return res.json({ success: true, message: 'Account already linked' });
        }
        return res.status(400).json({
            success: false,
            error: 'This social account is already linked to another user'
        });
    }

    // Create link
    await prisma.userOAuthProvider.create({
        data: {
            userId,
            provider,
            providerUserId,
            providerData
        }
    });

    res.json({
        success: true,
        message: 'Account linked successfully'
    });
});

/**
 * Set password for existing user (e.g. social login user)
 * POST /api/auth/set-password
 */
const setPassword = asyncHandler(async (req, res) => {
    const { username, password } = req.body;
    const userId = req.user.id;

    if (!username || !password) {
        return res.status(400).json({
            success: false,
            error: 'Username and password are required'
        });
    }

    // Check if username is taken by ANOTHER user
    const existingUser = await prisma.user.findFirst({
        where: {
            username,
            NOT: {
                id: userId
            }
        }
    });

    if (existingUser) {
        return res.status(400).json({
            success: false,
            error: 'Username is already taken'
        });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update user
    await prisma.user.update({
        where: { id: userId },
        data: {
            username,
            password: hashedPassword
        }
    });

    res.json({
        success: true,
        message: 'Password set successfully'
    });
});

/**
 * Line OAuth login/register
 * POST /api/auth/line/callback
 */
const lineCallback = asyncHandler(async (req, res) => {
    const { userId, displayName, pictureUrl, statusMessage, email } = req.body;

    if (!userId) {
        return res.status(400).json({
            success: false,
            error: 'Line user ID is required'
        });
    }

    // Check if user exists with this Line ID
    let oauthProvider = await prisma.userOAuthProvider.findUnique({
        where: {
            unique_provider_user: {
                provider: 'line',
                providerUserId: userId
            }
        },
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    fullName: true,
                    role: true
                }
            }
        }
    });

    let user;

    if (oauthProvider) {
        // User exists, update provider data
        user = oauthProvider.user;
        await prisma.userOAuthProvider.update({
            where: { id: oauthProvider.id },
            data: {
                providerData: {
                    displayName,
                    pictureUrl,
                    statusMessage,
                    email
                }
            }
        });
    } else {
        // Check if email exists (for account merging)
        if (email) {
            const existingUser = await prisma.user.findUnique({
                where: { email }
            });

            if (existingUser) {
                // Link Line account to existing user
                user = existingUser;
                await prisma.userOAuthProvider.create({
                    data: {
                        userId: user.id,
                        provider: 'line',
                        providerUserId: userId,
                        providerData: {
                            displayName,
                            pictureUrl,
                            statusMessage,
                            email
                        }
                    }
                });
            }
        }

        // Create new user
        if (!user) {
            try {
                user = await prisma.user.create({
                    data: {
                        email: email || null,
                        fullName: displayName,
                        role: 'user',
                        oauthProviders: {
                            create: {
                                provider: 'line',
                                providerUserId: userId,
                                providerData: {
                                    displayName,
                                    pictureUrl,
                                    statusMessage,
                                    email
                                }
                            }
                        }
                    },
                    select: {
                        id: true,
                        email: true,
                        fullName: true,
                        role: true
                    }
                });
            } catch (createError) {
                throw createError;
            }
        }
    }

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id);

    // Delete old sessions for this user to prevent token accumulation
    await prisma.userSession.deleteMany({
        where: { userId: user.id }
    });

    // Store refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await prisma.userSession.create({
        data: {
            userId: user.id,
            refreshToken,
            expiresAt
        }
    });

    // Get all providers
    const providers = await prisma.userOAuthProvider.findMany({
        where: { userId: user.id },
        select: { provider: true }
    });

    res.json({
        success: true,
        token: accessToken,
        refreshToken,
        user: {
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            profileImage: pictureUrl,
            providers: providers.map(p => p.provider)
        }
    });
});

/**
 * Refresh access token
 * POST /api/auth/refresh
 */
const refreshToken = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(400).json({
            success: false,
            error: 'Refresh token is required'
        });
    }

    // Find session
    const session = await prisma.userSession.findFirst({
        where: {
            refreshToken,
            expiresAt: { gte: new Date() }
        },
        include: {
            user: {
                select: {
                    id: true,
                    role: true
                }
            }
        }
    });

    if (!session) {
        return res.status(401).json({
            success: false,
            error: 'Invalid or expired refresh token',
            code: 'INVALID_REFRESH_TOKEN'
        });
    }

    // Generate new access token
    const accessToken = generateAccessToken(session.user.id, session.user.role);

    res.json({
        success: true,
        token: accessToken,
        expiresIn: 3600
    });
});

/**
 * Get current user
 * GET /api/auth/me
 */
const getCurrentUser = asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
            id: true,
            username: true,
            email: true,
            fullName: true,
            phone: true,
            role: true,
            createdAt: true,
            oauthProviders: {
                select: {
                    provider: true,
                    providerUserId: true,
                    providerData: true,
                    createdAt: true
                }
            }
        }
    });

    // Extract profile image from LINE provider if available
    const lineProvider = user.oauthProviders.find(p => p.provider === 'line');
    const profileImage = lineProvider?.providerData?.pictureUrl || null;

    res.json({
        success: true,
        user: {
            ...user,
            profileImage,
            providers: user.oauthProviders.map(p => ({
                provider: p.provider,
                providerUserId: p.providerUserId,
                linkedAt: p.createdAt
            }))
        }
    });
});

/**
 * Logout
 * POST /api/auth/logout
 */
const logout = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    if (refreshToken) {
        await prisma.userSession.deleteMany({
            where: { refreshToken }
        });
    }

    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});

module.exports = {
    register,
    login,
    linkSocial,
    setPassword,
    lineCallback,
    refreshToken,
    getCurrentUser,
    logout
};
