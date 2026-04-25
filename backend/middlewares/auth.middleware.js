import jwt from 'jsonwebtoken'
import User from '../models/user.model.js';

// protect
export const protect = async (req, res, next) => {
    try {
        let token;
        if(req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
            token = req.headers.authorization.split(" ")[1];
        }

        if(!token) {
            res.status(401).json({
                success: false,
                message: "Not authorized, missing token!",
            })
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        req.user = await User.findById(decoded.id).select("-password");

        if(req.user && req.user.isBlocked) {
            return res.status(403).json({
                success: false,
                message: "Your account has been blocked."
            })
        }
        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            message: "Invalid token!"
        })
    }
}


// roles based authentication
export const authorize = async (...roles) => {
    return (req, res, next) => {
        if(!roles.includes(req.user.role)) {
            return res.status(403).json({
                status: false,
                message: "Access Denied! Your don't have permission."
            })
        }
    }
}