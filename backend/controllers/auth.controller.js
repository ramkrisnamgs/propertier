import User from '../models/user.model.js';
import bcrypt from 'bcrypt';
import sendEmail from '../utils/sendEmail.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// Register User
export const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
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

        if(user.isBlocked) {
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

// to get profile
export const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        if(!user) {
            return res.status(404).json({
                message: "User not found."
            })
        }

        res.json({
            success: true,
            user,
        })
    } catch (error) {
        res.status(500).json({
            message: error.message,
        })
    }
}


// verify Email
export const verifyEmail = async (req, res) => {
    try {
        const { email, code } = req.body;
        if(!email || !code) return res.status(400).json({ message: "Email and code are required." });

        const user = await User.findOne({ email });
        if(!user) return res.status(404).json({ message: "User not found." });

        if(user.isVerified) return res.status(400).json({ message: "Email is already verified." });

        if(user.verificationToken !== code) return res.status(400).json({ message: "Invalid verification code." });

        user.isVerified = true;
        user.verificationToken = undefined;
        await user.save();
        res.status(200).json({ message: "Email verified successfully.", success: true });

    } catch (error) {
        res.status(500).json({
            message: error.message,
            success: false,
        })
    }
}

// forgot password
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if(!user) return res.status(404).json({ message: "No user is found with this email address." });

        const resetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
        const resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 minutes
        await user.save();

        const clientUrl = "http://localhost:5173"; // frontend url
        const resetUrl = `${clientUrl}/reset-password/${resetUrl}`;
        const message = `
        <h2>Password Reset Request</h2>
        <p>You requested a password reset. Please click on the link below to reset your password:</p>
        <a href="${resetUrl}" clicktracking="off">${resetUrl}</a>
        <p>The link will expire in 15 minutes.</p>
        `

        try {
            await sendEmail({
                email: user.email,
                subject: "Password reset - Propertier",
                message,
            })
            res.status(200).json({ message: "Password reset email sent.", success: true });
        } catch (error) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save();
            return res.status(500).json({ message: "Could not send email.", success: false});
        }

    } catch (error) {
        res.status(500).json({ message: error.message, success: false });
    }
}

// for reset password, we require the email
// now to reset password
export const resetPassword = async (res, req) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        const resetPasswordToken = crypto.createHash("sha256").update(token).digest("hex");
        
        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() },
        });
        if(!user) return res.status(400).json({ message: "Invalid or expired password reset token.", success: false });

        user.password = await bcrypt.hash(password, 10);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();
        res.status(200).json({ message: "Password updated successfully.", success: true })

    } catch (error) {
        res.status(500).json({ message: error.message, success: false });
    }
}