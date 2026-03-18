import jwt from "jsonwebtoken";
import { redisClient } from "./services/redis.services.js";
import Chat from "./models/message.model.js";
import userModel from "./models/user.model.js";
import groupModel from "./models/group.model.js";

let _io = null;
export function getIO() { return _io; }

export function setupSocket(io) {
    _io = io;

    // ── Authentication middleware ──
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth?.token;
            if (!token) return next(new Error("Authentication required"));

            const isBlacklisted = await redisClient.get(token);
            if (isBlacklisted) return next(new Error("Token blacklisted"));

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.user = decoded;
            next();
        } catch (err) {
            next(new Error("Invalid token"));
        }
    });

    io.on("connection", async (socket) => {
        console.log(`⚡ User connected: ${socket.user.email}`);

        const currentUser = await userModel.findOne({ email: socket.user.email });
        if (!currentUser) return socket.disconnect();

        // ── Auto-join ALL user group rooms on connect ──
        // This ensures receive-message reaches the user even when they're
        // viewing a different group (critical for real-time sidebar updates)
        const userGroups = await groupModel.find({
            $or: [{ admin: currentUser._id }, { members: currentUser._id }]
        });

        for (const group of userGroups) {
            socket.join(group._id.toString());
        }

        // ── Also join personal room (userId) for targeted events ──
        // e.g. group-added, group-removed emitted from group controller
        socket.join(currentUser._id.toString());

        let currentRoom = null; // the group actively being viewed

        // ── Send unread counts for all groups on connect ──
        async function emitUnreadCounts() {
            try {
                const counts = {};
                for (const group of userGroups) {
                    const chat = await Chat.findOne({ group: group._id });
                    if (chat) {
                        const unread = chat.messages.filter(msg =>
                            msg.type === 'message' &&
                            msg.sender?.toString() !== currentUser._id.toString() &&
                            !(msg.readBy || []).some(id => id.toString() === currentUser._id.toString())
                        ).length;
                        if (unread > 0) counts[group._id.toString()] = unread;
                    }
                }
                socket.emit("unread-counts", counts);
            } catch (err) {
                console.error("Error computing unread counts:", err.message);
            }
        }

        await emitUnreadCounts();

        // ── Join Group (user opened this chat) ──
        socket.on("join-group", async (groupId) => {
            currentRoom = groupId;
            // Note: NOT leaving other rooms — we stay subscribed to all groups
            // so real-time messages can arrive for any group

            // Mark all messages as read for this user in this group
            try {
                await Chat.updateOne(
                    { group: groupId },
                    { $addToSet: { "messages.$[msg].readBy": currentUser._id } },
                    { arrayFilters: [{ "msg.readBy": { $nin: [currentUser._id] } }] }
                );
            } catch (err) {
                // Ignore read marking errors silently
            }

            console.log(`${socket.user.email} opened room: ${groupId}`);
        });

        // ── Load Message History ──
        socket.on("load-messages", async (groupId) => {
            try {
                const chat = await Chat.findOne({ group: groupId })
                    .populate("messages.sender", "email");

                const messages = chat ? chat.messages : [];
                socket.emit("message-history", messages);
            } catch (err) {
                console.error("Error loading messages:", err.message);
                socket.emit("message-history", []);
            }
        });

        // ── Send Message ──
        socket.on("send-message", async ({ groupId, text }) => {
            try {
                // Validate: user must still be a member or admin of the group
                const group = await groupModel.findById(groupId);
                if (!group) return;

                const isMember =
                    group.members.some(id => id.toString() === currentUser._id.toString()) ||
                    group.admin.some(id => id.toString() === currentUser._id.toString());

                if (!isMember) {
                    // Notify this user they were removed
                    socket.emit("removed-from-group", { groupId });
                    return;
                }

                const newMessage = {
                    sender: currentUser._id,
                    message: text,
                    time: new Date(),
                    type: 'message',
                    readBy: [currentUser._id] // sender already read it
                };

                // Upsert: create chat doc on first message
                await Chat.findOneAndUpdate(
                    { group: groupId },
                    { $push: { messages: newMessage } },
                    { upsert: true, new: true }
                );

                // Broadcast to ALL members of the room (every member is subscribed)
                io.to(groupId).emit("receive-message", {
                    _id: Date.now().toString(),
                    sender: { _id: currentUser._id, email: currentUser.email },
                    message: text,
                    time: newMessage.time,
                    type: 'message',
                    groupId: groupId  // needed for frontend sidebar update
                });

            } catch (err) {
                console.error("Error sending message:", err.message);
            }
        });

        // ── Disconnect ──
        socket.on("disconnect", () => {
            console.log(`❌ User disconnected: ${socket.user.email}`);
        });
    });
}
