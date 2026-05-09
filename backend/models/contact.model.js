import mongoose from "mongoose";

const contactSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    phone: {
        type: String
    },
    role: {
        type: String,
        enum: ["buyer", "seller"],
        required: true
    },
    message: {
        type: String,
        required: true
    }
}, { timestamps: true });

const Contact = mongoose.model("Contact", contactSchema);

export default Contact;