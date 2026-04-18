import 'dotenv/config';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import userModel from '../models/user.model.js';

// Check if Google OAuth is configured
const isGoogleConfigured = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

if (isGoogleConfigured) {
    console.log('✅ Configuring Google OAuth strategy...');
    
    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:6969/user/auth/google/callback',
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    let user = await userModel.findOne({ googleId: profile.id });

                    if (!user) {
                        user = await userModel.findOne({ email: profile.emails[0].value });

                        if (user) {
                            user.googleId = profile.id;
                            user.authProvider = 'google';
                            await user.save();
                        } else {
                            user = await userModel.create({
                                googleId: profile.id,
                                email: profile.emails[0].value,
                                username: profile.displayName || profile.emails[0].value.split('@')[0],
                                avatar: profile.photos?.[0]?.value || '',
                                authProvider: 'google',
                            });
                        }
                    }

                    return done(null, user);
                } catch (error) {
                    return done(error, null);
                }
            }
        )
    );

    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser(async (id, done) => {
        try {
            const user = await userModel.findById(id);
            done(null, user);
        } catch (error) {
            done(error, null);
        }
    });
} else {
    console.warn('⚠️  Google OAuth credentials not configured. Google Sign-In will be disabled.');
    console.warn('   Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env to enable.');
}

export default passport;
export { isGoogleConfigured };
