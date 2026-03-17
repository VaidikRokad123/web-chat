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
router.get("/all",
    authMiddleware.authUser,
    groupController.getAllGroupsController
);

router.post("/add-user",
    authMiddleware.authUser,
    body("groupName").notEmpty().withMessage("Group name is required"),
    body("targetEmail").notEmpty().withMessage("Target email is required"),
    groupController.addUserToGroupController
);

router.post("/add-admin",
    authMiddleware.authUser,
    body("groupName").notEmpty().withMessage("Group name is required"),
    body("targetEmail").notEmpty().withMessage("Target email is required"),
    groupController.addAdminController
);

router.post("/remove-admin",
    authMiddleware.authUser,
    body("groupName").notEmpty().withMessage("Group name is required"),
    body("targetEmail").notEmpty().withMessage("Target email is required"),
    groupController.removeAdminController
);

router.post("/remove-user",
    authMiddleware.authUser,
    body("groupName").notEmpty().withMessage("Group name is required"),
    body("targetEmail").notEmpty().withMessage("Target email is required"),
    groupController.removeUserController
);

export default router;