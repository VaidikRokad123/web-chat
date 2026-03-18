import mongoose from "mongoose";

const groupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    admin: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "User",
        required: true
    },
    members: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "User",
        required: true
    },

    isDirectChat: {
        type: Boolean,
        default: false
    },


},
    {
        timestamps: true
    }
)


const Group = mongoose.model("Group", groupSchema);

export default Group;
