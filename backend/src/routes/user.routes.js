import { Router } from "express";
import * as UserController from "../controllers/user.controller.js";
import { body, validationResult } from "express-validator";

const router = Router();

router.post('/register',
    body('email').isEmail().withMessage("Please enter a valid email address"),
    // body('password').isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),
    UserController.createUserController
);


export default router;


