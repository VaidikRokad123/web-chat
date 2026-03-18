import groupModel from "../models/group.model.js";
import userModel from "../models/user.model.js";
import Chat from "../models/message.model.js";
import * as groupService from "../services/group.services.js";
import { validationResult } from "express-validator";
import { getIO } from "../socket.js";

// Helper: push a system log message into the group's chat
async function pushSystemMessage(groupId, text) {
    await Chat.findOneAndUpdate(
        { group: groupId },
        { $push: { messages: { message: text, type: 'system', time: new Date() } } },
        { upsert: true }
    );
}


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
        if (groupDoc.isDirectChat) return res.status(403).json({ message: "Cannot modify members of a direct chat" });

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

        // Push system messages
        for (const email of members) {
            await pushSystemMessage(groupDoc._id, `${email} was added to the group`);
        }

        // Real-time: notify each added user so their sidebar updates instantly
        const io = getIO();
        if (io) {
            for (const userId of userIds) {
                // Populate fresh group data to send
                const freshGroup = await groupModel.findById(groupDoc._id)
                    .populate('admin', 'email')
                    .populate('members', 'email')
                    .lean();
                io.to(userId.toString()).emit('group-added', freshGroup);
                // Also join the user to the new room so they receive messages
                const sockets = await io.in(userId.toString()).fetchSockets();
                for (const s of sockets) s.join(groupDoc._id.toString());
            }
        }

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
        if (group.isDirectChat) return res.status(403).json({ message: "Cannot modify admins of a direct chat" });

        const requester = await userModel.findOne({ email: req.user.email });
        const target = await userModel.findOne({ email: req.body.targetEmail });
        if (!target) return res.status(404).json({ message: "Target user not found" });

        const updatedGroup = await groupService.addAdmin(group._id, requester._id, target._id);
        await pushSystemMessage(group._id, `${req.body.targetEmail} was made an admin`);
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
        if (group.isDirectChat) return res.status(403).json({ message: "Cannot modify admins of a direct chat" });

        const requester = await userModel.findOne({ email: req.user.email });
        const target = await userModel.findOne({ email: req.body.targetEmail });
        if (!target) return res.status(404).json({ message: "Target user not found" });

        const updatedGroup = await groupService.removeAdmin(group._id, requester._id, target._id);
        await pushSystemMessage(group._id, `${req.body.targetEmail} was removed as admin`);
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
        if (group.isDirectChat) return res.status(403).json({ message: "Cannot modify admins of a direct chat" });

        const requester = await userModel.findOne({ email: req.user.email });
        const target = await userModel.findOne({ email: req.body.targetEmail });
        if (!target) return res.status(404).json({ message: "Target user not found" });

        const updatedGroup = await groupService.removeUser(group._id, requester._id, target._id);
        await pushSystemMessage(group._id, `${req.body.targetEmail} was removed from the group`);

        // Real-time: notify removed user
        const io = getIO();
        if (io) {
            io.to(target._id.toString()).emit('group-removed', { groupId: group._id.toString() });
        }

        return res.status(200).json({ message: "User removed successfully", group: updatedGroup });
    } catch (error) {
        console.log(error.message);
        return res.status(400).json({ message: error.message });
    }
};

const deleteGroupController = async (req, res) => {
    const error = validationResult(req);
    if (!error.isEmpty()) return res.status(400).json({ message: "Invalid input", errors: error.array() });

    try {
        const group = await groupModel.findOne({ name: req.body.groupName });
        if (!group) return res.status(404).json({ message: "Group not found" });
        if (group.isDirectChat) return res.status(403).json({ message: "Cannot modify admins of a direct chat" });

        const requester = await userModel.findOne({ email: req.user.email });
        await groupService.deleteGroup(group._id, requester._id);
        return res.status(200).json({ message: "Group deleted successfully" });
    } catch (error) {
        console.log(error.message);
        return res.status(400).json({ message: error.message });
    }
};

const createDirectChatController = async (req, res) => {
    const error = validationResult(req);
    if (!error.isEmpty()) return res.status(400).json({ message: "Invalid input", errors: error.array() });

    try {
        const myEmail = req.user.email;
        const targetEmail = req.body.targetEmail?.trim().toLowerCase();

        if (!targetEmail) return res.status(400).json({ message: "Target email is required" });
        if (myEmail === targetEmail) return res.status(400).json({ message: "Cannot create a chat with yourself" });

        const target = await userModel.findOne({ email: targetEmail });
        if (!target) return res.status(404).json({ message: "User not found" });

        const me = await userModel.findOne({ email: myEmail });

        // Deterministic name: min(email)-max(email)
        const dmName = [myEmail, targetEmail].sort().join('-');

        // Check if DM already exists
        let group = await groupModel.findOne({ name: dmName, isDirectChat: true });
        if (group) {
            return res.status(200).json({ message: "Direct chat already exists", group });
        }

        // Create DM group
        group = await groupModel.create({
            name: dmName,
            admin: [me._id, target._id],
            members: [me._id, target._id],
            isDirectChat: true
        });

        return res.status(201).json({ message: "Direct chat created", group });
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export {
    createGroupController,
    getAllGroupsController,
    addUserToGroupController,
    addAdminController,
    removeAdminController,
    removeUserController,
    deleteGroupController,
    createDirectChatController
};

