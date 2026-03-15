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


export { createUserController };
