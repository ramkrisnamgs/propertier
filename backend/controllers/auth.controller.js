import User from '../models/user.model.js';
import bcrypt from 'bcrypt';
import sendEmail from '../utils/sendEmail.js';
import jwt from 'jsonwebtoken';

// Register User
export const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body();
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({
                message: "User already registered."
            });
        };

        const hashedPassword = await bcrypt.hash(password, 10);

        const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role,
            isApproved: role === "seller" ? false : true,
            verificationToken
        });

        try {
            await sendEmail({
                email,
                subject: "Verify your Email - Propertier",
                message: `<p>Your email verification code is: <strong>${verificationToken}</strong></p>. <br/> <p>Please enter this code on the verification page to activate your account.</p>`
            })
        } catch (emailError) {
            console.error("Failed to send verification mail:", emailError);
            // we will still create the user
        }

        res.status(200).json({
            message: "User registered. Please check your email for verification code.",
            user: {
                email: user.email,
                name: user.name,
                role: user.role,
            }
        })
    } catch (error) {
        res.status(500).json({
            message: error.message,
        })
    }
}

// login
export const login = async(req, res) => {
    try {
        const {email, password} = req.body;
        if(!email || !password) {
            return res.status(400).json({
                message: "Email and Password are required."
            })
        }

        const user = await User.findOne({ email });
        if(!user) {
            res.status(500).json({
                message: "Invalid email or password."
            })
        }

        if(!user.isVerified) {
            res.status(403).json({
                message: "Please verify your email or contact support."
            })
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch) {
            return res.status(400).json({
                message: "Invalid email or password."
            })
        }

        if(!user.isBlocked) {
            return res.status(403).json({
                message: "Your account has been blocked. Please contact support."
            })
        }

        // token
        const token = jwt.sign({
            id: user._id,
            role: user.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: "7d" })

        res.status(200).json({
            message: "Login successful",
            user,
            token,
        })
    } catch (error) {
        res.status(500).json({
            message: error.message,
        })
    }
}