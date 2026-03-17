import groupModel from "../models/group.model.js";
import userModel from "../models/user.model.js";
import * as groupService from "../services/group.services.js";
import { validationResult } from "express-validator";


const createGroupController = async (req, res) => {

    const error = validationResult(req);
    if (!error.isEmpty()) {
        return res.status(400).json({ message: "Invalid input", errors: error.array() });
    }

    try {
        const name = req.body.groupName;
        const admin = await userModel.findOne({ email: req.user.email });
        const membersEmail = req.body.members;

        const members = [];
        for (const email of membersEmail) {
            const user = await userModel.findOne({ email });
            if (user) {
                members.push(user._id);
            }
        }

        const group = await groupService.createGroup(name, admin._id, members);
        return res.status(201).json({ message: "Group created successfully", group });
    }
    catch (error) {
        console.log(error.message);
        if (error.code === 11000 || error.message === "Group with this name already exists") {
            return res.status(400).json({ message: "Group with this name already exists" });
        }
        res.status(500).json({ message: "Internal server error" });
    }
}

export { createGroupController };

