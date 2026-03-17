import groupModel from "../models/group.model.js";
import userModel from "../models/user.model.js";


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

    //check admin_id is valid user schema



    const isAdmin = await userModel.findById(admin);
    if (!isAdmin) {
        throw new Error("Admin not found");
    }

    //check for members id validation
    const isMembers = await userModel.findById(members);
    if (!isMembers) {
        throw new Error("Members not found");
    }


    // Check for duplicate group name (case-insensitive)
    // const existingGroup = await groupModel.findOne({ name: name.toLowerCase().trim() });
    // if (existingGroup) {
    //     throw new Error("Group with this name already exists");
    // }

    try {
        const group = await groupModel.create({ name, admin, members });
        return group;
    } catch (error) {
        throw error;
    }
}


export { createGroup };