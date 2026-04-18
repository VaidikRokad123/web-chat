import { Router } from "express";
import * as UserController from "../controllers/user.controller.js";
import { body } from "express-validator";
import * as authMiddleware from "../middleware/auth.middleware.js";
import passport, { isGoogleConfigured } from "../config/passport.js";

const router = Router();

router.post('/register',
    body('email').isEmail().withMessage("Please enter a valid email address"),
    body('password').isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),
    UserController.createUserController
);
router.post('/login',
    body('email').isEmail().withMessage("Please enter a valid email address"),
    body('password').isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),
    UserController.loginUserController
);
router.get('/profile',
    authMiddleware.authUser,
    UserController.profileController
);
router.put('/profile',
    authMiddleware.authUser,
    UserController.updateProfileController
);
router.post('/logout',
    authMiddleware.authUser,
    UserController.logoutController
);
router.get('/all',
    authMiddleware.authUser,
    UserController.getAllUsersController
);

// Google OAuth routes (only if configured)
if (isGoogleConfigured) {
    router.get('/auth/google',
        passport.authenticate('google', { scope: ['profile', 'email'] })
    );

    router.get('/auth/google/callback',
        passport.authenticate('google', { session: false, failureRedirect: '/login' }),
        UserController.googleAuthCallback
    );
} else {
    // Fallback routes when OAuth is not configured
    router.get('/auth/google', (req, res) => {
        res.status(503).json({ error: 'Google OAuth is not configured on this server' });
    });

    router.get('/auth/google/callback', (req, res) => {
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=oauth_not_configured`);
    });
}

router.post('/contact/request',
    authMiddleware.authUser,
    UserController.sendContactRequest
);

router.post('/contact/accept',
    authMiddleware.authUser,
    UserController.acceptContactRequest
);

router.post('/contact/reject',
    authMiddleware.authUser,
    UserController.rejectContactRequest
);

router.get('/contact/requests',
    authMiddleware.authUser,
    UserController.getContactRequests
);

router.get('/contacts',
    authMiddleware.authUser,
    UserController.getContacts
);

export default router;