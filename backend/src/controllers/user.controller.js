import userModel from "../models/user.model.js";
import userService from "../services/user.services.js";
import { validationResult } from "express-validator";

const createUserController = async (req, res) => {

    const error = validationResult(req);
    if (!error.isEmpty()) {
        return res.status(400).json({ error: error.array() });
    }


    try {
        const { email, password } = req.body;

        const user = await userService(email, password);

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

export {
    createUserController,
    loginUserController,
    profileController
};
