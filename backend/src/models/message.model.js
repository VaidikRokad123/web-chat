import mongoose from "mongoose";

const singleMessageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    time: {
        type: Date,
        default: Date.now
    },
    type: {
        type: String,
        enum: ['message', 'system'],
        default: 'message'
    },
    readBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }]
}, { _id: true });

const chatSchema = new mongoose.Schema({
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group",
        required: true,
        unique: true,
        index: true
    },
    messages: [singleMessageSchema]
}, {
    timestamps: true
});

const Chat = mongoose.model("Chat", chatSchema);

export default Chat;
