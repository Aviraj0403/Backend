import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { MasterUser } from "../models/masterUser.model.js";

// Middleware to verify JWT
export const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            throw new ApiError(401, "Unauthorized request: No token provided");
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const user = await MasterUser.findById(decodedToken?._id).select("-password ");

        if (!user) {
            throw new ApiError(401, "Invalid Access Token: User not found");
        }

        req.user = user; // Store user info in request
        next();
    } catch (error) {
        console.error("JWT Verification Error:", error);
        throw new ApiError(401, error?.message || "Invalid access token");
    }
});

// Role-checking middleware
// Role-checking middleware
const checkRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new ApiError(401, "Unauthorized: No user found"));
        }

        if (!roles.includes(req.user.role)) {
            return next(new ApiError(403, `Access denied. Required roles: ${roles.join(', ')}`));
        }

        next();
    };
};

// Usage examples
export const isSuperAdmin = checkRole(['superAdmin']);
export const isRestaurantOwner = checkRole(['restaurantOwner']);
