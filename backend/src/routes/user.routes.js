import { Router } from "express";
import * as UserController from "../controllers/user.controller.js";
import { body } from "express-validator";
import * as authMiddleware from "../middleware/auth.middleware.js";

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
router.post('/logout',
    authMiddleware.authUser,
    UserController.logoutController
);
router.get('/all',
    authMiddleware.authUser,
    UserController.getAllUsersController
);

export default router;