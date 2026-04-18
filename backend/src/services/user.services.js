import userModel from "../models/user.model.js";

const createUser = async (email, password, username, extras = {}) => {
    if (!email || !password) {
        throw new Error("Email and password are required");
    }

    const hashPassword = await userModel.hashPassword(password);

    const user = await userModel.create({
        email,
        password: hashPassword,
        username: username || email.split('@')[0],
        avatar: extras.avatar || '',
        bio: extras.bio || '',
        status: extras.status || 'Hey there!'
    });

    return user;
}

export { createUser };