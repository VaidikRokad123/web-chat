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

const getAllGroupsController = async (req, res) => {

    const error = validationResult(req);
    if (!error.isEmpty()) {
        return res.status(400).json({ message: "Invalid input", errors: error.array() });
    }

    try {

        const user = await userModel.findOne({ email: req.user.email });

        const groups = await groupService.getAllGroups(user._id);

        return res.status(200).json({ message: "Groups fetched successfully", groups });
    }
    catch (error) {
        console.log(error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

const addUserToGroupController = async (req, res) => {

    const error = validationResult(req);
    if (!error.isEmpty()) {
        return res.status(400).json({ message: "Invalid input", errors: error.array() });
    }

    try {
        const groupDoc = await groupModel.findOne({ name: req.body.groupName });
        if (!groupDoc) return res.status(404).json({ message: "Group not found" });

        const members = req.body.targetEmail;  // array of emails
        const requester = await userModel.findOne({ email: req.user.email });

        // Proper ObjectId comparison
        const isAdmin = groupDoc.admin.some(id => id.toString() === requester._id.toString());
        if (!isAdmin) {
            return res.status(400).json({ message: "Editor is not Admin" });
        }

        const userIds = [];
        for (const email of members) {
            const user = await userModel.findOne({ email });
            if (user) userIds.push(user._id);
        }

        const group = await groupService.addUserToGroup(groupDoc._id, userIds);
        return res.status(200).json({ message: "User added to group successfully", group });
    }
    catch (error) {
        console.log(error.message);
        console.log(error);

        res.status(500).json({ message: "Internal server error" });
    }
}

const addAdminController = async (req, res) => {
    const error = validationResult(req);
    if (!error.isEmpty()) return res.status(400).json({ message: "Invalid input", errors: error.array() });

    try {
        const group = await groupModel.findOne({ name: req.body.groupName });
        if (!group) return res.status(404).json({ message: "Group not found" });

        const requester = await userModel.findOne({ email: req.user.email });
        const target = await userModel.findOne({ email: req.body.targetEmail });
        if (!target) return res.status(404).json({ message: "Target user not found" });

        const updatedGroup = await groupService.addAdmin(group._id, requester._id, target._id);
        return res.status(200).json({ message: "Admin added successfully", group: updatedGroup });
    } catch (error) {
        console.log(error.message);
        return res.status(400).json({ message: error.message });
    }
};

const removeAdminController = async (req, res) => {
    const error = validationResult(req);
    if (!error.isEmpty()) return res.status(400).json({ message: "Invalid input", errors: error.array() });

    try {
        const group = await groupModel.findOne({ name: req.body.groupName });
        if (!group) return res.status(404).json({ message: "Group not found" });

        const requester = await userModel.findOne({ email: req.user.email });
        const target = await userModel.findOne({ email: req.body.targetEmail });
        if (!target) return res.status(404).json({ message: "Target user not found" });

        const updatedGroup = await groupService.removeAdmin(group._id, requester._id, target._id);
        return res.status(200).json({ message: "Admin removed successfully", group: updatedGroup });
    } catch (error) {
        console.log(error.message);
        return res.status(400).json({ message: error.message });
    }
};

const removeUserController = async (req, res) => {
    const error = validationResult(req);
    if (!error.isEmpty()) return res.status(400).json({ message: "Invalid input", errors: error.array() });

    try {
        const group = await groupModel.findOne({ name: req.body.groupName });
        if (!group) return res.status(404).json({ message: "Group not found" });

        const requester = await userModel.findOne({ email: req.user.email });
        const target = await userModel.findOne({ email: req.body.targetEmail });
        if (!target) return res.status(404).json({ message: "Target user not found" });

        const updatedGroup = await groupService.removeUser(group._id, requester._id, target._id);
        return res.status(200).json({ message: "User removed successfully", group: updatedGroup });
    } catch (error) {
        console.log(error.message);
        return res.status(400).json({ message: error.message });
    }
};

export {
    createGroupController,
    getAllGroupsController,
    addUserToGroupController,
    addAdminController,
    removeAdminController,
    removeUserController
};

