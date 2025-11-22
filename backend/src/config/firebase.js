const admin = require('firebase-admin');
const logger = require('../utils/logger');

let bucket = null;
let isFirebaseConfigured = false;

// Check if Firebase credentials are provided
if (
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_PRIVATE_KEY &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_STORAGE_BUCKET
) {
    try {
        // Initialize Firebase Admin
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            }),
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET
        });

        bucket = admin.storage().bucket();
        isFirebaseConfigured = true;
        logger.info('✅ Firebase Storage initialized successfully');
    } catch (error) {
        logger.warn('⚠️  Firebase initialization failed:', error.message);
        logger.warn('⚠️  Image upload features will be disabled');
    }
} else {
    logger.warn('⚠️  Firebase credentials not found in .env');
    logger.warn('⚠️  Image upload features will be disabled');
    logger.warn('   To enable: Add FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL, FIREBASE_STORAGE_BUCKET to .env');
}

module.exports = { admin, bucket, isFirebaseConfigured };
