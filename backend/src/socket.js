import jwt from "jsonwebtoken";
import { redisService } from "./services/redis.services.js";
import Chat from "./models/message.model.js";
import userModel from "./models/user.model.js";
import groupModel from "./models/group.model.js";

let _io = null;
export function getIO() { return _io; }

// ── Online presence tracking ──
const onlineUsers = new Map(); // userId → Set<socketId>

export function getOnlineUsers() { return onlineUsers; }

export function setupSocket(io) {
    _io = io;

    // ── Authentication middleware ──
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth?.token;
            if (!token) return next(new Error("Authentication required"));

            const isBlacklisted = await redisService.get(token);
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

        const userId = currentUser._id.toString();

        // ── Track online presence ──
        if (!onlineUsers.has(userId)) {
            onlineUsers.set(userId, new Set());
        }
        onlineUsers.get(userId).add(socket.id);

        // Broadcast to all: this user is online
        io.emit("user-online", { userId, email: currentUser.email });

        // ── Auto-join ALL user group rooms on connect ──
        const userGroups = await groupModel.find({
            $or: [{ admin: currentUser._id }, { members: currentUser._id }]
        });

        for (const group of userGroups) {
            socket.join(group._id.toString());
        }

        // Join personal room for targeted events
        socket.join(userId);

        let currentRoom = null;

        // ── E2E Encryption: store user's public key ──
        socket.on("publish-public-key", async ({ publicKey }) => {
            if (publicKey && typeof publicKey === 'string') {
                await userModel.findByIdAndUpdate(currentUser._id, { publicKey });
            }
        });

        // ── Send unread counts for all groups on connect ──
        async function emitUnreadCounts() {
            try {
                const counts = {};
                for (const group of userGroups) {
                    const chat = await Chat.findOne({ group: group._id });
                    if (chat) {
                        const unread = chat.messages.filter(msg =>
                            msg.type === 'message' &&
                            msg.sender?.toString() !== userId &&
                            !(msg.readBy || []).some(id => id.toString() === userId)
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

        // ── Send list of currently online users ──
        socket.emit("online-users", Array.from(onlineUsers.keys()));

        // ── Join Group (user opened this chat) ──
        socket.on("join-group", async (groupId) => {
            currentRoom = groupId;

            // Mark all messages as read + seen
            try {
                const chat = await Chat.findOne({ group: groupId });
                const group = await groupModel.findById(groupId);
                if (chat && group) {
                    let modified = false;
                    // Total non-sender members count for determining 'seen' status
                    const allMemberIds = [...new Set([
                        ...group.members.map(id => id.toString()),
                        ...group.admin.map(id => id.toString())
                    ])];

                    for (const msg of chat.messages) {
                        if (msg.type !== 'message') continue;
                        if (msg.sender?.toString() === userId) continue;

                        const alreadyRead = (msg.readBy || []).some(id => id.toString() === userId);
                        if (!alreadyRead) {
                            msg.readBy.push(currentUser._id);
                            modified = true;
                        }
                        const alreadyDelivered = (msg.deliveredTo || []).some(id => id.toString() === userId);
                        if (!alreadyDelivered) {
                            msg.deliveredTo.push(currentUser._id);
                            modified = true;
                        }

                        // Update deliveryStatus based on readBy count
                        const senderId = msg.sender?.toString();
                        const otherMembers = allMemberIds.filter(id => id !== senderId);
                        const allRead = otherMembers.every(mid =>
                            (msg.readBy || []).some(id => id.toString() === mid)
                        );
                        if (allRead && msg.deliveryStatus !== 'seen') {
                            msg.deliveryStatus = 'seen';
                            modified = true;
                        } else if (!allRead && msg.deliveryStatus === 'sent') {
                            // At least one person read, mark as delivered
                            const anyDelivered = otherMembers.some(mid =>
                                (msg.deliveredTo || []).some(id => id.toString() === mid)
                            );
                            if (anyDelivered) {
                                msg.deliveryStatus = 'delivered';
                                modified = true;
                            }
                        }
                    }

                    // Also update the sender's own messages deliveryStatus
                    for (const msg of chat.messages) {
                        if (msg.type !== 'message') continue;
                        if (msg.sender?.toString() !== userId) continue;

                        const senderId = msg.sender?.toString();
                        const otherMembers = allMemberIds.filter(id => id !== senderId);
                        const allRead = otherMembers.every(mid =>
                            (msg.readBy || []).some(id => id.toString() === mid)
                        );
                        if (allRead && msg.deliveryStatus !== 'seen') {
                            msg.deliveryStatus = 'seen';
                            modified = true;
                        }
                    }

                    if (modified) {
                        await chat.save();
                        // Notify senders their messages were seen
                        io.to(groupId).emit("messages-seen", { groupId, seenBy: userId });
                    }
                }
            } catch (err) {
                // Ignore read marking errors silently
            }

            console.log(`${socket.user.email} opened room: ${groupId}`);
        });

        // ── Load Message History ──
        socket.on("load-messages", async (groupId) => {
            try {
                const chat = await Chat.findOne({ group: groupId })
                    .populate("messages.sender", "email username avatar");

                const messages = chat ? chat.messages : [];
                socket.emit("message-history", messages);
            } catch (err) {
                console.error("Error loading messages:", err.message);
                socket.emit("message-history", []);
            }
        });

        // ── Send Message ──
        socket.on("send-message", async ({ groupId, text, mediaUrl, mediaType, fileName, fileSize }) => {
            try {
                const group = await groupModel.findById(groupId);
                if (!group) return;

                const isMember =
                    group.members.some(id => id.toString() === userId) ||
                    group.admin.some(id => id.toString() === userId);

                if (!isMember) {
                    socket.emit("removed-from-group", { groupId });
                    return;
                }

                // Determine which members are online for delivery status
                const allMemberIds = [...new Set([
                    ...group.members.map(id => id.toString()),
                    ...group.admin.map(id => id.toString())
                ])];
                const onlineMemberIds = allMemberIds.filter(id => id !== userId && onlineUsers.has(id));
                const allOnline = onlineMemberIds.length === (allMemberIds.length - 1);

                const msgType = mediaUrl ? (mediaType?.startsWith('image/') ? 'image' : 'file') : 'message';

                const newMessage = {
                    sender: currentUser._id,
                    message: text || (mediaUrl ? fileName || 'File' : ''),
                    time: new Date(),
                    type: msgType,
                    readBy: [currentUser._id],
                    deliveredTo: [currentUser._id, ...onlineMemberIds.map(id => new currentUser._id.constructor(id))],
                    deliveryStatus: allOnline && onlineMemberIds.length > 0 ? 'delivered' : 'sent',
                    mediaUrl: mediaUrl || null,
                    mediaType: mediaType || null,
                    fileName: fileName || null,
                    fileSize: fileSize || null,
                };

                const chat = await Chat.findOneAndUpdate(
                    { group: groupId },
                    { $push: { messages: newMessage } },
                    { upsert: true, new: true }
                );

                const savedMsg = chat.messages[chat.messages.length - 1];

                io.to(groupId).emit("receive-message", {
                    _id: savedMsg._id.toString(),
                    sender: { _id: currentUser._id, email: currentUser.email, username: currentUser.username, avatar: currentUser.avatar },
                    message: newMessage.message,
                    time: newMessage.time,
                    type: msgType,
                    groupId: groupId,
                    deliveryStatus: newMessage.deliveryStatus,
                    mediaUrl: newMessage.mediaUrl,
                    mediaType: newMessage.mediaType,
                    fileName: newMessage.fileName,
                    fileSize: newMessage.fileSize,
                });

            } catch (err) {
                console.error("Error sending message:", err.message);
            }
        });

        // ── Typing Indicator ──
        socket.on("typing-start", ({ groupId }) => {
            socket.to(groupId).emit("user-typing", {
                groupId,
                userId,
                email: currentUser.email,
                username: currentUser.username
            });
        });

        socket.on("typing-stop", ({ groupId }) => {
            socket.to(groupId).emit("user-stopped-typing", {
                groupId,
                userId
            });
        });

        // ── WebRTC Signaling for Voice/Video Calls ──
        socket.on("call-user", ({ targetUserId, offer, callType }) => {
            io.to(targetUserId).emit("incoming-call", {
                from: userId,
                fromEmail: currentUser.email,
                fromUsername: currentUser.username,
                fromAvatar: currentUser.avatar,
                offer,
                callType, // 'voice' or 'video'
            });
        });

        socket.on("call-accepted", ({ targetUserId, answer }) => {
            io.to(targetUserId).emit("call-accepted", {
                from: userId,
                answer,
            });
        });

        socket.on("call-rejected", ({ targetUserId }) => {
            io.to(targetUserId).emit("call-rejected", {
                from: userId,
            });
        });

        socket.on("ice-candidate", ({ targetUserId, candidate }) => {
            io.to(targetUserId).emit("ice-candidate", {
                from: userId,
                candidate,
            });
        });

        socket.on("end-call", ({ targetUserId }) => {
            io.to(targetUserId).emit("call-ended", {
                from: userId,
            });
        });

        // ── Disconnect ──
        socket.on("disconnect", async () => {
            console.log(`❌ User disconnected: ${socket.user.email}`);

            // Remove from online tracking
            const sockets = onlineUsers.get(userId);
            if (sockets) {
                sockets.delete(socket.id);
                if (sockets.size === 0) {
                    onlineUsers.delete(userId);

                    // Update lastSeen
                    const now = new Date();
                    await userModel.findByIdAndUpdate(currentUser._id, { lastSeen: now });

                    // Broadcast offline
                    io.emit("user-offline", { userId, lastSeen: now });
                }
            }
        });
    });
}
