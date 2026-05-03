import Property from "../models/property.model.js";
import Inquiry from "../models/inquiry.model.js";
import jwt from 'jsonwebtoken';
import { uploadToCloudinary } from "../utils/uploadToCloudinary.js";
import cloudinary from "../config/cloudinary.js";

// Add a property
export const addProperty = async (req, res) => {
    try {
        let imageUrls = [];
        if(req.files && req.files.length > 0) {
            for(let file of req.files) {
                const result = await uploadToCloudinary(file.buffer);
                imageUrls.push(result.secure_url);
            }
        }

        const property = await Property.create({
            title: req.body.title,
            description: req.body.description,
            price: Number(req.body.price),
            city: req.body.city,
            area: req.body.area,
            pincode: req.body.pincode,
            propertyType: req.body.propertyType,
            bhk: req.body.bhk ? String(req.body.bhk) : undefined,
            bathrooms: req.body.bathrooms ? Number(req.body.bathrooms) : undefined,
            areaSize: req.body.areaSize ? Number(req.body.areaSize) : undefined,
            furnishing: req.body.furnishing,
            status: req.body.status,
            images: imageUrls,
            seller: req.user._id,  // only seller can create property
            amenities: req.body.amenities ? Array.isArray(req.body.amenities) ? req.body.amenities : (() => {
                try {
                    return JSON.parse(req.body.amenities);
                } catch (error) {
                    return req.body.amenities.split(",");
                }
            })() : [],
        });

        res.json({
            success: true,
            property,
        })
    } catch (error) {
        console.error("ADD_PROPERTY_ERROR: ", error);
        res.status(500).json({
            success: false,
            message: error.message || "Internal server error while adding property!"
        });
    }
}


// to get my properties
export const getMyProperties = async (req, res) => {
    try {
        const properties = await Property.find({
            seller: req.user._id,
        });
        res.json({
            success: true,
            properties,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

// Update Property
export const updateProperty = async (req, res) => {
    try {
        const property = await Property.findById(req.params.id);
        if(!property) {
            return res.status(404).json({
                success: false,
                message: "Property not found!"
            });
        }

        // if seller id doesn't belongs to property Id
        if(property.seller.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Not authorized!"
            })
        }

        const fields = [
            "title",
            "description",
            "price",
            "city", 
            "area",
            "pincode",
            "propertyType",
            "bhk",
            "bathrooms",
            "areaSize",
            "furnishing",
            "status",
            "amenities"
        ];
        fields.forEach((field) => {
            if(req.body[field] !== undefined) {
                if(field === "amenities" && typeof req.body[field] === "string") {
                    try {
                        property[field] = JSON.parse(req.body[field]);
                    } catch (error) {
                        property[field] = req.body[field].split(",");
                    }
                } else {
                    property[field] = req.body[field];
                }
            }
        });

        // for Image handling
        if(req.body.existingImages) {
            try {
                const existing = JSON.parse(req.body.existingImages);
                property.images = Array.isArray(existing) ? existing : property.images;  
            } catch (error) {
                console.error("Failed to parse existingImages: ", error);
            }
        } // delete existingImage

        // upload new image if there's already an existingImage
        if(req.files && req.files.length > 0) {
            let newImages = [];
            for(let file of req.files) {
                const result = await uploadToCloudinary(file.buffer, "properties");
                newImages.push(result.secure_url);
            }
            property.images = [...property.images, ...newImages];
        };

        await property.save();

        res.json({
            success: true,
            message: "Property updated",
            property,  // updated data
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Delete a property 
export const deleteProperty = async (req, res) => {
    try {
        const property = await Property.findById(req.params.id);
        if(!property) {
            return res.status(404).json({
                success: false,
                message: "Property not found!",
            });
        };

        // if seller id doesn't belongs to property Id(check ownership of the property)
        if(property.seller.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Not authorized!"
            })
        }

        // delete images from cloudinary
        for(let imageUrl of property.images) {
            const publicId = imageUrl.split("/").pop().split(".")["0"];
            await cloudinary.uploader.destroy("properties/" + publicId);
        }

        // delete property from db
        await property.deleteOne();
        res.json({
            success: true,
            message: "Property deleted successfully!",
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

// Update property status
export const updatePropertyStatus = async (req, res) => {
    try {
        const property = await Property.findById(req.params.id);
        if(!property) {
            return res.status(404).json({
                success: false,
                message: "Property not found!",
            });
        };

        // if seller id doesn't belongs to property Id(check ownership of the property)
        if(property.seller.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Not authorized!"
            })
        }

        property.status = req.body.status;
        await property.save();
        res.json({
            success: true,
            message: "Property status updated successfully!",
            property,
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


// Get all properties
export const getAllProperties = async (req, res) => {
    try {
        const {city, area, pincode, propertyType, bhk, furnishing, status, minPrice, maxPrice, amenities, sort, seller} = req.query;
        let query = { status: "sale", };

        if (seller) query.seller = seller;
        if (city) query.city = new RegExp(city, "i");
        if (area) query.area = new RegExp(area, "i");
        if (pincode) query.pincode = pincode;

        if (propertyType) query.propertyType = { $in: propertyType.toLowerCase().split(",")};

        if (bhk) {
            if (bhk === "5+") {
                query.bhk = { $gte: "5" }
            } else {
                query.bhk = bhk;
            }
        }

        if (furnishing) {
            const furnishingArray = furnishing.split(",");
            query.furnishing = { $in: furnishingArray.map((f) => new RegExp(`^${f.trim()}$`, "i")), };
        }

        if (status) query.status = status;

        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice && !isNaN(minPrice)) query.price.$gte = Number(minPrice);
            if (maxPrice && !isNaN(maxPrice)) query.price.$gte = Number(maxPrice);
            if (Object.keys(query.price).length === 0) delete query.price;
        }

        if (amenities) {
            query.amenities = {
                $in: amenities.split(",").map((a) => a.trim()),
            }
        }

        let sortOption = { createdAt: -1 };
        if (sortOption === "priceLow") sort = { price: 1 };
        if (sortOption === "priceHigh") sort = { price: -1 };
        if (sortOption === "latest") sort = { createdAt: -1 };

        const properties = await Property.find(query).populate("seller", "name phone profilePic").sort(sortOption);

        res.json({
            success: true,
            count: properties.length,  // number of properties
            properties,
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error while fetching properties",
            error: error.message,
        });
    }
};

// To get property details
export const getPropertyDetails = async (req, res) => {
    try {
        const property = await Property.findById(req.params.id).populate("seller", "name email phone profilePic");
        if(!property) {
            return res.status(404).json({
                success: false,
                message: "Property not found!",
            });
        };

        // unique view tracking by Id
        let visitorId = req.ip;
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith("Bearer ")) {
            try {
                const token = authHeader.split("")[1];
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                visitorId = decoded.id;
            } catch (error) {
                // ignore
            }
        }

        const isSellerChecking = visitorId === property.seller._id.toString();
        // only increment the view if not seller but if seller edit them, increase the value
        if (!isSellerChecking && !property.viewedBy.includes(visitorId)) {
            property.views += 1;
            property.viewedBy.push(visitorId);
            await property.save();
        }

        const similarProperties = await Property.find({
            _id: { $ne: property._id },
            city: property.city,
            propertyType: property.propertyType,
            status: property.status,
        }).limit(4).select("title price images city area propertyType bhk areaSize status");

        res.json({
            success: true, 
            property,
            similarProperties,
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


// Seller dashboard
export const getSellerDashboard = async (req, res) => {
    try {
        const sellerId = req.user._id;
        const totalProperties = await Property.countDocuments({ seller: sellerId });
        const activeListings = await Property.countDocuments({
            seller: sellerId,
            status: "sale",
        });
        const soldProperties = await Property.countDocuments({
            seller: sellerId,
            status: "sold",
        });

        const totalInquiries = await Inquiry.countDocuments({ seller: sellerId });

        // calculate total views for all properties
        const viewsData = await Property.aggregate([
            { $match: { seller: sellerId }},
            { $group: { _id: null, totalViews: { $num: "$views" }}},
        ]);

        const totalViews = viewsData.length > 0 ? viewsData[0].totalViews : 0;

        res.json({
            success: true,
            stats: {
                totalProperties,
                activeListings,
                soldProperties,
                totalInquiries,
                totalViews,
            }
        })

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Get property type by count
export const getPropertyCounts = async (req, res) => {
    try {
        const counts = await Property.aggregate([
            { $match: { status: "sale" }},
            { $group: { _id: "$PropertyType", count: { $sum: 1 }}},
        ]);

        const formattedCounts = counts.reduce((acc, curr) => {
            acc[curr._id] = curr.count;
            return acc;
        }, {});

        res.json({
            success: true,
            counts: formattedCounts,
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error while fetching counts",
            error: error.message,
        });
    }
}