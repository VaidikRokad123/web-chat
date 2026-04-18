import userModel from "../models/user.model.js";
import * as userService from "../services/user.services.js";
import { validationResult } from "express-validator";
import { redisService } from "../services/redis.services.js";

const createUserController = async (req, res) => {

    const error = validationResult(req);
    if (!error.isEmpty()) {
        return res.status(400).json({ error: error.array() });
    }

    try {
        const { email, password, username, avatar, bio, status } = req.body;

        const user = await userService.createUser(email, password, username || email.split('@')[0], { avatar, bio, status });

        const token = user.generateToken();

        return res.status(201).json({ user, token });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ error: error.message });
    }
}

const loginUserController = async (req, res) => {

    const error = validationResult(req);

    if (!error.isEmpty()) {
        return res.status(400).json({ error: error.array() });
    }

    try {

        const { email, password } = req.body;

        const isUser = await userModel.findOne({ email }).select("+password");
        if (!isUser) {
            return res.status(404).json({ error: "User not found" });
        }

        const isPasswordValid = await isUser.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: "Invalid password" });
        }

        const token = isUser.generateToken();

        // Return user without password
        const userObj = isUser.toObject();
        delete userObj.password;

        return res.status(200).json({ user: userObj, token });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: error.message });
    }
}

const profileController = async (req, res) => {

    try {
        const user = await userModel.findOne({ email: req.user.email });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        return res.status(200).json({ user });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: error.message });
    }

}

const updateProfileController = async (req, res) => {
    try {
        const { username, avatar, bio, status } = req.body;
        const updateData = {};

        if (username !== undefined) updateData.username = username.trim();
        if (avatar !== undefined) updateData.avatar = avatar.trim();
        if (bio !== undefined) updateData.bio = bio.trim().slice(0, 200);
        if (status !== undefined) updateData.status = status.trim().slice(0, 50);

        const user = await userModel.findOneAndUpdate(
            { email: req.user.email },
            { $set: updateData },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        return res.status(200).json({ user });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: error.message });
    }
}

const logoutController = async (req, res) => {

    try {

        const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];

        await redisService.set(token, 'logout', { EX: 60 * 60 * 24 });

        return res.status(200).json({ message: "Logout successful" });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: error.message });
    }

}

const getAllUsersController = async (req, res) => {
    try {
        const users = await userModel
            .find({ email: { $ne: req.user.email } })
            .select('email username avatar status lastSeen');
        return res.status(200).json({ users });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: error.message });
    }
};

const googleAuthCallback = async (req, res) => {
    try {
        console.log('📍 Google OAuth callback hit');
        console.log('User from passport:', req.user);
        
        const user = req.user;
        if (!user) {
            console.error('❌ No user found in request');
            return res.redirect(`${process.env.FRONTEND_URL}/login?error=no_user`);
        }
        
        const token = user.generateToken();
        console.log('✅ Token generated, redirecting to:', `${process.env.FRONTEND_URL}/auth/callback?token=${token.substring(0, 20)}...`);
        
        res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
    } catch (error) {
        console.error('❌ Google OAuth callback error:', error);
        res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
    }
};

const sendContactRequest = async (req, res) => {
    try {
        const { targetEmail } = req.body;
        const currentUser = await userModel.findOne({ email: req.user.email });
        const targetUser = await userModel.findOne({ email: targetEmail });

        if (!targetUser) {
            return res.status(404).json({ error: "User not found" });
        }

        if (targetUser.email === currentUser.email) {
            return res.status(400).json({ error: "Cannot send request to yourself" });
        }

        // Check if already contacts
        if (currentUser.contacts.includes(targetUser._id)) {
            return res.status(400).json({ error: "Already in contacts" });
        }

        // Check if request already exists
        const existingRequest = targetUser.contactRequests.find(
            req => req.from.toString() === currentUser._id.toString() && req.status === 'pending'
        );

        if (existingRequest) {
            return res.status(400).json({ error: "Request already sent" });
        }

        targetUser.contactRequests.push({
            from: currentUser._id,
            status: 'pending'
        });

        await targetUser.save();

        return res.status(200).json({ message: "Contact request sent" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: error.message });
    }
};

const acceptContactRequest = async (req, res) => {
    try {
        const { requestId } = req.body;
        const currentUser = await userModel.findOne({ email: req.user.email });

        const request = currentUser.contactRequests.id(requestId);
        if (!request || request.status !== 'pending') {
            return res.status(404).json({ error: "Request not found" });
        }

        request.status = 'accepted';
        currentUser.contacts.push(request.from);

        const fromUser = await userModel.findById(request.from);
        fromUser.contacts.push(currentUser._id);

        await currentUser.save();
        await fromUser.save();

        return res.status(200).json({ message: "Contact request accepted" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: error.message });
    }
};

const rejectContactRequest = async (req, res) => {
    try {
        const { requestId } = req.body;
        const currentUser = await userModel.findOne({ email: req.user.email });

        const request = currentUser.contactRequests.id(requestId);
        if (!request) {
            return res.status(404).json({ error: "Request not found" });
        }

        request.status = 'rejected';
        await currentUser.save();

        return res.status(200).json({ message: "Contact request rejected" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: error.message });
    }
};

const getContactRequests = async (req, res) => {
    try {
        const currentUser = await userModel.findOne({ email: req.user.email })
            .populate('contactRequests.from', 'email username avatar');

        const pending = currentUser.contactRequests.filter(r => r.status === 'pending');

        return res.status(200).json({ requests: pending });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: error.message });
    }
};

const getContacts = async (req, res) => {
    try {
        const currentUser = await userModel.findOne({ email: req.user.email })
            .populate('contacts', 'email username avatar status lastSeen');

        return res.status(200).json({ contacts: currentUser.contacts });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: error.message });
    }
};

export {
    createUserController,
    loginUserController,
    profileController,
    updateProfileController,
    logoutController,
    getAllUsersController,
    googleAuthCallback,
    sendContactRequest,
    acceptContactRequest,
    rejectContactRequest,
    getContactRequests,
    getContacts
};
