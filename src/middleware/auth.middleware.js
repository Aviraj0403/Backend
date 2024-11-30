import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { MasterUser } from "../models/masterUser.model.js";
import crypto from 'crypto';

// Helper function to extract the token from the request
const extractToken = (req) => {
    console.log("Cookies:", req.cookies); 
    console.log("Headers:", req.headers); // Log headers
    const cookieToken = req.cookies?.accessToken; 
    const headerToken = req.headers?.authorization ? req.headers.authorization.split(" ")[1] : null; 
    const token = cookieToken || headerToken; 

    if (!token) {
        console.warn("No token found in cookies or headers."); // Warning if no token
    }

    return token;
};

// Helper function to retrieve user by ID
const getUserById = async (userId) => {
    return await MasterUser.findById(userId).select("-password");
};

// Middleware to verify JWT
export const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        const token = extractToken(req);

        if (!token) {
            return next(new ApiError(401, "Unauthorized request: No token provided"));
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = await getUserById(decodedToken?._id);

        if (!user) {
            return next(new ApiError(401, "Invalid Access Token: User not found"));
        }

        req.user = user; // Store user info in request
        next();
    } catch (error) {
        console.error("JWT Verification Error:", error);
        return next(new ApiError(401, error?.message || "Invalid access token"));
    }
});

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

// Exporting role-checking middlewares
export const isSuperAdmin = checkRole(['superAdmin']);
export const isRestaurantOwner = checkRole(['restaurantOwner']);
export const hasRoles = (...roles) => checkRole(roles);

// CSRF Protection Middleware
export const csrfProtectionMiddleware = (req, res, next) => {
    const csrfToken = req.cookies.csrfToken; // CSRF token from cookies
    const clientToken = req.headers['x-csrf-token']; // CSRF token from request headers

    if (!csrfToken || csrfToken !== clientToken) {
        return res.status(403).json({ message: 'CSRF token validation failed' });
    }

    next();
};

// Function to generate a CSRF token
// export const generateCsrfToken = () => {
//     return crypto.randomBytes(32).toString('hex');
// };
