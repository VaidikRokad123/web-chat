import groupModel from "../models/group.model.js";
import userModel from "../models/user.model.js";
import Chat from "../models/message.model.js";


const createGroup = async (name, admin, members) => {

    if (!name) {
        throw new Error("Group name is required");
    }
    if (!admin) {
        throw new Error("Admin is required");
    }
    if (members.length === 0) {
        throw new Error("Members are required");
    }


    const isAdmin = await userModel.findById(admin);
    if (!isAdmin) {
        throw new Error("Admin not found");
    }

    const isMembers = await userModel.findById(members);
    if (!isMembers) {
        throw new Error("Members not found");
    }

    try {
        const group = await groupModel.create({ name, admin, members });
        return group;
    } catch (error) {
        throw error;
    }
}

const getAllGroups = async (userId) => {
    try {
        const groups = await groupModel
            .find({ $or: [{ admin: userId }, { members: userId }] })
            .populate('admin', 'email')
            .populate('members', 'email')
            .lean();

        // Attach lastMessage to each group
        for (const group of groups) {
            const chat = await Chat.findOne({ group: group._id });
            if (chat && chat.messages.length > 0) {
                const last = chat.messages[chat.messages.length - 1];
                group.lastMessage = {
                    message: last.message,
                    time: last.time,
                    type: last.type || 'message'
                };
            } else {
                group.lastMessage = null;
            }
        }

        // Sort by most recent activity
        groups.sort((a, b) => {
            const timeA = a.lastMessage?.time || a.createdAt;
            const timeB = b.lastMessage?.time || b.createdAt;
            return new Date(timeB) - new Date(timeA);
        });

        return groups;
    } catch (error) {
        throw error;
    }
}

const addUserToGroup = async (groupId, userId) => {
    try {
        const group = await groupModel.findById(groupId);
        if (!group) {
            throw new Error("Group not found");
        }

        for (const id of userId) {
            const user = await userModel.findById(id);
            if (!user) {
                throw new Error("User not found");
            }
            // Use .toString() for proper ObjectId comparison
            const alreadyMember = group.members.some(m => m.toString() === id.toString());
            if (!alreadyMember) {
                group.members.push(id);
            }
        }
        await group.save();
        return group;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

const addAdmin = async (groupId, requesterId, targetUserId) => {
    const group = await groupModel.findById(groupId);
    if (!group) throw new Error("Group not found");

    const reqIdStr = requesterId.toString();
    const isAdmin = group.admin.some(id => id.toString() === reqIdStr);
    if (!isAdmin) throw new Error("Only admins can promote members");

    const targetStr = targetUserId.toString();
    const alreadyAdmin = group.admin.some(id => id.toString() === targetStr);
    if (alreadyAdmin) throw new Error("User is already an admin");

    const isMember = group.members.some(id => id.toString() === targetStr);
    if (!isMember) throw new Error("Target user is not a member of this group");

    group.admin.push(targetUserId);
    await group.save();
    return group;
};

const removeAdmin = async (groupId, requesterId, targetUserId) => {
    const group = await groupModel.findById(groupId);
    if (!group) throw new Error("Group not found");

    const reqIdStr = requesterId.toString();
    const isAdmin = group.admin.some(id => id.toString() === reqIdStr);
    if (!isAdmin) throw new Error("Only admins can demote admins");

    const targetStr = targetUserId.toString();
    const isTargetAdmin = group.admin.some(id => id.toString() === targetStr);
    if (!isTargetAdmin) throw new Error("User is not an admin");

    if (group.admin.length <= 1) throw new Error("Cannot remove the last admin");

    group.admin = group.admin.filter(id => id.toString() !== targetStr);
    await group.save();
    return group;
};

const removeUser = async (groupId, requesterId, targetUserId) => {
    const group = await groupModel.findById(groupId);
    if (!group) throw new Error("Group not found");

    const reqIdStr = requesterId.toString();
    const isAdmin = group.admin.some(id => id.toString() === reqIdStr);
    if (!isAdmin) throw new Error("Only admins can remove members");

    const targetStr = targetUserId.toString();
    const isMember = group.members.some(id => id.toString() === targetStr);
    if (!isMember) throw new Error("User is not a member of this group");

    group.members = group.members.filter(id => id.toString() !== targetStr);
    // also demote if they were an admin
    group.admin = group.admin.filter(id => id.toString() !== targetStr);
    await group.save();
    return group;
};

const deleteGroup = async (groupId, requesterId) => {
    const group = await groupModel.findById(groupId);
    if (!group) throw new Error("Group not found");

    const reqIdStr = requesterId.toString();
    const isAdmin = group.admin.some(id => id.toString() === reqIdStr);
    if (!isAdmin) throw new Error("Only admins can delete the group");

    await groupModel.findByIdAndDelete(groupId);
    return { deleted: true };
};

export {
    createGroup,
    getAllGroups,
    addUserToGroup,
    addAdmin,
    removeAdmin,
    removeUser,
    deleteGroup
};