import { Router } from "express";
import * as groupController from "../controllers/group.controller.js";
import { body, validationResult } from "express-validator";
import * as authMiddleware from "../middleware/auth.middleware.js";

const router = Router();

router.post("/create",
    authMiddleware.authUser,
    body("groupName").notEmpty().withMessage("Group name is required"),
    groupController.createGroupController
);

export default router;