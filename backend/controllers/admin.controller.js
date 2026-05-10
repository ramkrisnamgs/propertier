import User from "../models/user.model.js"
import Property from "../models/property.model.js";
import Inquiry from "../models/inquiry.model.js";

// Get all users
export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select("-password");
        res.json({
            success: true,
            count: users.length,
            users
        })
    } catch (error) {
        res.status(500).json({
            message: error.message
        })
    }
}   

// Block a particular user
export const blockUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        user.isBlocked = !user.isBlocked;
        await user.save();

        res.json({
            success: true,
            message: user.isBlocked ? "User BLocked" : "User Unblocked",
            isBlocked: user.isBlocked
        })
    } catch (error) {
        res.status(500).json({
            message: error.message
        })
    }
}

// Delete a particular user
export const deleteUser = async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({
            success: true,
            message: "User deleted successfully!"
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        }) 
    }
}


// View all properties
export const getAllProperties = async (req, res) => {
    try {
        const properties = await Property.find().populate("seller", "name email");
        res.json({
            success: true,
            count: properties.length,
            properties
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        })
    }
};

// Delete a particular property
export const deleteProperty = async (req, res) => {
    try {
        await Property.findByIdAndDelete(req.params.id);
        
        res.status({
            success: true,
            message: "Property deleted successfully!"
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        })
    }
}


// View all Inquiries
export const getAllInquiries = async (req, res) => {
    try {
        const inquiries = await Inquiry.find()
        .populate("buyer", "name email")
        .populate("seller", "name email")
        .populate("property", "title price")
        .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: inquiries.length,
            inquiries
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        })
    }
};

// Dashboard Analytics
export const getDashboardStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalProperties = await Property.countDocuments();

        const activeListings = await Property.countDocuments({
            status: "sale"
        });
        const soldProperties = await Property.countDocuments({
            status: "sold"
        });

        res.json({
            success: true,
            stats: {
                totalUsers,
                totalProperties,
                activeListings,
                soldProperties
            }
        })
    } catch (error) {
        res.status(500).json({
            message: error.message
        })
    }
}

// Get pending seller account
export const getPendingSellers = async (req, res) => {
     try {
        const pendingSellers = await User.find({
            role: "seller",
            isApproved: false
        }).select("-password");

        // seller will get approval from the admin panel
        res.json({
            success: true,
            count: pendingSellers.length,
            pendingSellers
        })
     } catch (error) {
        res.status(500).json({
            message: error.message
        });
     }
};

// Approve a seller
export const approveSeller = async (req, res) => {
    try {
        const seller = await User.findById(req.params.id);
        if(!seller || seller.role !== "seller") {
            return res.status({
                success: false,
                message: "You are not a seller or seller not found!"
            });
        }

        seller.isApproved = true;
        await seller.save();

        res.json({
            success: true, 
            message: "Seller approved successfully!",
            seller
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
}