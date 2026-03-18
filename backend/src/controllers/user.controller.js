import userModel from "../models/user.model.js";
import * as userService from "../services/user.services.js";
import { validationResult } from "express-validator";
import { redisClient } from "../services/redis.services.js";

const createUserController = async (req, res) => {

    const error = validationResult(req);
    if (!error.isEmpty()) {
        return res.status(400).json({ error: error.array() });
    }


    try {
        const { email, password } = req.body;

        const user = await userService.createUser(email, password);

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
        return res.status(200).json({ user: isUser, token });

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

const logoutController = async (req, res) => {

    try {

        const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];

        await redisClient.set(token, 'logout', { EX: 60 * 60 * 24 });

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
            .select('email -_id');
        return res.status(200).json({ users });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: error.message });
    }
};

export {
    createUserController,
    loginUserController,
    profileController,
    logoutController,
    getAllUsersController
};
