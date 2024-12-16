import { MasterUser, RestaurantOwner } from '../models/masterUser.model.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { Restaurant } from '../models/restaurant.model.js';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { sendOtpToPhone } from '../services/otpService.js';


// OAuth2 client initialization with credentials from environment variables


// const CLIENT_ID = process.env.GMAIL_CLIENT_ID;
// const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET;
// const REDIRECT_URI = 'https://developers.google.com/oauthplayground'; // Ensure this matches your redirect URI
// const REFRESH_TOKEN = process.env.GMAIL_REFRESH_TOKEN;
// console.log("CLIENT_ID",CLIENT_ID);
// console.log("CLIENT_SECRET",CLIENT_SECRET);
// console.log("REFRESH_TOKEN",REFRESH_TOKEN);
// const oAuth2Client = new google.auth.OAuth2(
//   CLIENT_ID,
//   CLIENT_SECRET,
//   REDIRECT_URI
// );

// // Set credentials with refresh token
// oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

// // Create a transporter using the OAuth2 client
// async function createTransporter() {
//   try {
//     // Get a fresh access token (it will be automatically refreshed if expired)
//     const { token } = await oAuth2Client.getAccessToken();
    
//     // Create and return the nodemailer transporter
//     const transporter = nodemailer.createTransport({
//       service: 'gmail',
//       auth: {
//         type: 'OAuth2',
//         user: process.env.EMAIL_USER,  // Your Gmail address (e.g., aviraj0403@gmail.com)
//         clientId: CLIENT_ID,
//         clientSecret: CLIENT_SECRET,
//         refreshToken: REFRESH_TOKEN,
//         accessToken: token,  // Current access token
//       },
//     });

//     return transporter;
//   } catch (error) {
//     console.error('Error creating transporter:', error);
//     throw error;
//   }
// }

  
const backendUrl = process.env.NODE_ENV === "production" ? process.env.BACKEND_URL_PROD : process.env.BACKEND_URL;
console.log("Backend URL is:", backendUrl);


// Check if user exists by email
const userExists = async (email) => {
    return await MasterUser.findOne({ email });
};
export const refreshToken = async (req, res) => {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
        return res.status(400).json({ message: 'Refresh token is missing' });
    }

    try {
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        const user = await MasterUser.findById(decoded._id);
        if (!user) {
            return res.status(401).json({ message: 'Invalid refresh token' });
        }

        const newAccessToken = user.generateAccessToken();
        return res.json({ accessToken: newAccessToken });
    } catch (error) {
        console.error('Error refreshing token:', error);
        return res.status(403).json({ message: 'Invalid or expired refresh token' });
    }
};

// Generate a CSRF token
const generateCsrfToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

// Refresh Token
// export const refreshAccessToken = asyncHandler(async (req, res) => {
//     const refreshToken = req.cookies.refreshToken; // Get refresh token from cookies
//     if (!refreshToken) {
//         throw new ApiError(401, "Refresh token not found"); // No refresh token provided
//     }

//     // Verify the refresh token
//     const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
//     const user = await MasterUser.findById(decoded._id); // Find the user

//     if (!user) {
//         throw new ApiError(403, "Forbidden in refresh token"); // User not found
//     }

//     // Generate new access and refresh tokens
//     const accessToken = user.generateAccessToken(); // Use existing method
//     const newRefreshToken = user.generateRefreshToken(); // Generate new refresh token

//     user.refreshToken = newRefreshToken; // Update the refresh token in the user model
//     await user.save({ validateBeforeSave: false }); // Save the user with new refresh token

//     // Set new tokens in cookies
//     res.cookie("accessToken", accessToken, {
//         httpOnly: true,
//         secure: process.env.NODE_ENV === "production", // Use secure in production
//         sameSite: 'Strict',
//         path: '/'
//     });

//     res.cookie("refreshToken", refreshToken, {
//         httpOnly: true,
//         secure: process.env.NODE_ENV === "production",
//         sameSite: 'Strict',
//         path: '/'
//     });

//     res.status(200).json({ accessToken, refreshToken: refreshToken }); // Send new tokens
// });

// Handle token generation and cookie setting
const setTokensAndCookies = async (res, user,restaurantId) => {
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken(); // Generate the refresh token
    console.log("Access Token:", accessToken);  // Log the access token
    console.log("Refresh Token:", refreshToken);  // Log the refresh token
    user.refreshToken = refreshToken;

    // Save the refresh token in the database
    await user.save({ validateBeforeSave: false });

    // Generate CSRF token
    const csrfToken = generateCsrfToken();
    console.log("CSRF Token set in cookie:", csrfToken);

    // Set cookies
    res
        .cookie("accessToken", accessToken, {
            httpOnly: true,
            // secure:true,
            secure: process.env.NODE_ENV === "production", // Use secure in production
            maxAge: 3600000, // 1 ho
            sameSite: 'None',
            // domain: '.onrender.com',
            path: '/'
        })
        .cookie("refreshToken", refreshToken, { // Use refreshToken instead of refreshAccessToken
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: 'None',
            // domain: '.onrender.com',
            path: '/'
        })
        .cookie("csrfToken", csrfToken, {
            httpOnly: false,
            secure: process.env.NODE_ENV === "production",
            sameSite: 'None',
            // domain: '.onrender.com',
            path: '/'
        })
        .status(200)
        .json({ 
            message: "Login successful", 
            user: { id: user._id, username: user.username, restaurantId }, 
            csrfToken, 
            accessToken, 
            refreshToken // Correctly send the refreshToken
        });
};


// Check if the user is a super admin
export const checkSuperAdmin = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: 'User not authenticated' });
    }

    if (req.user.role !== 'superAdmin') {
        return res.status(403).json({ message: 'Access denied' });
    }

    return res.status(200).json({ message: 'Authorized' });
};

// Super Admin Registration
export const registerSuperAdmin = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;

    const existingUser = await userExists(email);
    if (existingUser) {
        throw new ApiError(400, 'Email is already in use');
    }

    const user = new MasterUser({
        username,
        email,
        password,
        role: 'superAdmin'
    });

    await user.save();
    res.status(201).json({ message: 'Super admin registered successfully' });
});

// Super Admin Login
export const loginSuperAdmin = asyncHandler(async (req, res) => {
    const { username, password } = req.body;

    const user = await MasterUser.findOne({ username, role: 'superAdmin' });
    if (!user || !(await user.isPasswordCorrect(password))) {
        throw new ApiError(401, "Invalid credentials");
    }

    setTokensAndCookies(res, user);
});

// Login for Restaurant Owner
export const loginRestaurantOwner = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await MasterUser.findOne({ email, role: 'restaurantOwner' });
    if (!user || !(await user.isPasswordCorrect(password))) {
        throw new ApiError(401, "Invalid credentials");
    }
      

    // Fetch the associated restaurant
    const restaurant = await Restaurant.findOne({ ownerId: user._id });
    if (!restaurant) {
        throw new ApiError(404, "Restaurant not found");
    }

    setTokensAndCookies(res, user, restaurant._id); // Pass restaurantId here
    // setTokensAndCookies(res, user);
});

// Register a new Restaurant Owner (only for Super Admin)
export const registerRestaurantOwner = asyncHandler(async (req, res) => {
    const { username, email, password, restaurantName, restaurantLocation, contactInfo, subscription } = req.body;

    // Validate required fields
    if (!username || !email || !password || !restaurantName || !restaurantLocation || !subscription || !subscription.paymentMethod) {
        throw new ApiError(400, "All fields are required");
    }

    const existingUser = await userExists(email);
    if (existingUser) {
        throw new ApiError(400, 'Email already in use');
    }

    const user = new RestaurantOwner({
        username,
        email,
        password,
    });

    await user.save();

    const restaurant = new Restaurant({
        name: restaurantName,
        ownerId: user._id,
        location: restaurantLocation,
        contactInfo: contactInfo || {},
    });

    await restaurant.save();

    user.restaurants.push(restaurant._id);
    await user.save();

    const subscriptionRecord = {
        restaurantId: restaurant._id,
        startDate: new Date(),
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
        status: 'active',
        plan: subscription.plan,
        paymentMethod: subscription.paymentMethod,
    };

    user.subscriptionRecords.push(subscriptionRecord);
    await user.save();

    res.status(201).json({
        message: 'Restaurant owner and restaurant created successfully',
        ownerId: user._id,
        restaurantId: restaurant._id,
    });
});

// Logout function
export const logoutUser = asyncHandler(async (req, res) => {
    try {
        // CSRF Token Validation - You can include this if CSRF validation is needed for logout
        const csrfToken = req.body.csrfToken || req.headers['csrf-token'];
        console.log("c",csrfToken);
        if (!csrfToken) {
            return res.status(400).json({ message: 'CSRF token is missing' });
        }

        // Here, you can validate the CSRF token if needed

        // Clear cookies related to authentication and CSRF
        res.clearCookie("accessToken", { 
            httpOnly: true, 
            secure: process.env.NODE_ENV === "production", // Ensure secure cookies in production
            sameSite: 'None', 
            path: '/' 
        });
        res.clearCookie("refreshToken", { 
            httpOnly: true, 
            secure: process.env.NODE_ENV === "production", 
            sameSite: 'None', 
            path: '/' 
        });
        res.clearCookie("csrfToken", { 
            httpOnly: false, // CSRF token doesn't need httpOnly
            secure: process.env.NODE_ENV === "production", 
            sameSite: 'None', 
            path: '/' 
        });

        // Send success response
        return res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        console.error('Error during logout:', error);
        return res.status(500).json({ message: "An error occurred during logout." });
    }
});

// const transporter = nodemailer.createTransport({
//     service: 'gmail',
//     auth: {
//         type: 'OAuth2',
//         user: process.env.EMAIL_USER,            // Your Gmail email address
//         clientId: process.env.GMAIL_CLIENT_ID,   // Your Client ID
//         clientSecret: process.env.GMAIL_CLIENT_SECRET, // Your Client Secret
//         refreshToken: process.env.GMAIL_REFRESH_TOKEN,  // Your refresh token
//         accessToken: await getAccessToken(),          // Access token (automatically generated)
//     },
// });


// Request Password Reset
// export const requestPasswordReset = asyncHandler(async (req, res) => {
//     const { email } = req.body;
  
//     try {
//       console.log('Received email:', email);  // Log the email
//       const user = await RestaurantOwner.findOne({ email });
//       if (!user) {
//         console.log('User not found');
//         return res.status(404).json({ message: 'User not found' });
//       }
  
//       console.log('User found, generating token');
//       const resetToken = user.generatePasswordResetToken();
//       await user.save();
  
//       const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
  
//       // Create transporter and send the password reset email
//       const transporter = await createTransporter();
//       await transporter.sendMail({
//         from: process.env.EMAIL_USER,
//         to: email,
//         subject: 'Password Reset Request',
//         text: `Here is your password reset link: ${resetUrl}`,
//       });
  
//       console.log('Password reset link sent');
//       res.status(200).json({ message: 'Password reset link sent to your email.' });
//     } catch (error) {
//       console.error('Error requesting password reset:', error);
//       res.status(500).json({ message: 'Error processing your request.' });
//     }
//   });
  
// // Reset Password Handler
// export const resetPassword = asyncHandler(async (req, res) => {
//   const { token, newPassword } = req.body;

//   try {
//     // Find user by reset token
//     const user = await RestaurantOwner.findOne({ passwordResetToken: token });
//     if (!user || !user.isValidResetToken(token)) {
//       return res.status(400).json({ message: 'Invalid or expired token' });
//     }

//     // Hash the new password before saving
//     const hashedPassword = await bcrypt.hash(newPassword, 10);
//     user.password = hashedPassword;

//     // Clear reset token and expiration
//     await user.clearPasswordResetData();
//     await user.save();

//     res.status(200).json({ message: 'Password successfully reset.' });
//   } catch (error) {
//     console.error('Error resetting password:', error);
//     res.status(500).json({ message: 'Error resetting your password.' });
//   }
// });



// SMS OTP SETUP


export const requestOtp = async (req, res) => {
    console.log("Request Body:", req.body);  // Log the entire request body for debugging
    
    const { contactInfo } = req.body;

    // Ensure that contactInfo and contactInfo.phone are provided
    if (!contactInfo || !contactInfo.phone) {
        return res.status(400).json({ message: 'Phone number is required' });
    }

    try {   
        let phoneNumber = contactInfo.phone.trim();  // Get phone number from the request

        // If the phone number starts with '+91', remove the country code
        if (phoneNumber.startsWith('+91')) {
            phoneNumber = phoneNumber.slice(3);  // Remove '+91'
        }

        console.log("Formatted Phone Number received:", phoneNumber);  // Log the formatted phone number
       // Step 1: Find the restaurant by phone number
        const restaurant = await Restaurant.findOne({ 'contactInfo.phone': phoneNumber });
         console.log("Res",restaurant)
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant with this phone number not found' });
        }

         // Step 2: Get the RestaurantOwner using the ownerId from the restaurant
         const restaurantOwner = await RestaurantOwner.findById(restaurant.ownerId);
         console.log("Res Own",restaurantOwner);
         if (!restaurantOwner) {
             return res.status(404).json({ message: 'Restaurant owner not found' });
         }


        // Find the user by phone number in 'contactInfo.phone'
        // const user = await RestaurantOwner.findOne({ 'contactInfo.phone': phoneNumber });
        // console.log(user);  // Log the user object for debugging

        // if (!user) {
        //     return res.status(404).json({ message: 'User with this phone number not found' });
        // }
       console.log(phoneNumber)
        // Send OTP to the phone number using the sendOtpToPhone function
        const otpRecord = await sendOtpToPhone(phoneNumber);
        console.log(otpRecord);  // Log OTP details for debugging

        // Save OTP and its expiration time to the user's record
        restaurantOwner.passwordResetOtp = otpRecord.otp;
        restaurantOwner.passwordResetOtpExpiresAt = otpRecord.otpExpiresAt;
        await restaurantOwner.save();
       
        // Respond back with success
        res.status(200).json({ message: 'OTP sent successfully' });
    } catch (error) {
        console.error('Error in OTP request:', error);  // Log the error for debugging
        return res.status(500).json({ message: 'An error occurred while sending OTP' });
    }
};


export const verifyOtpAndChangePassword = async (req, res) => {
    const { contactInfo, otp, newPassword } = req.body;

    console.log(req.body);  // Log the body to check the input

    if (!contactInfo || !otp || !newPassword) {
        return res.status(400).json({ message: 'Phone number, OTP, and new password are required' });
    }

    try {
        let phoneNumber = contactInfo.phone.trim();  // Get phone number from the request

        // If the phone number starts with '+91', remove the country code
        if (phoneNumber.startsWith('+91')) {
            phoneNumber = phoneNumber.slice(3);  // Remove '+91'
        }

        console.log("Formatted Phone Number received:", phoneNumber);  // Log the formatted phone number

        // Step 1: Find the restaurant by phone number
        const restaurant = await Restaurant.findOne({ 'contactInfo.phone': phoneNumber });
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant with this phone number not found' });
        }

        // Step 2: Get the RestaurantOwner using the ownerId from the restaurant
        const restaurantOwner = await RestaurantOwner.findById(restaurant.ownerId);
        if (!restaurantOwner) {
            return res.status(404).json({ message: 'Restaurant owner not found' });
        }

        // Step 3: Check if the provided OTP matches the stored OTP
        if (restaurantOwner.passwordResetOtp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        // Step 4: Check if the OTP has expired
        if (restaurantOwner.passwordResetOtpExpiresAt < Date.now()) {
            return res.status(400).json({ message: 'OTP has expired' });
        }

        console.log("New Password received:", newPassword);

        // Step 5: Hash the new password before saving it
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        console.log("Hashed new password:", hashedPassword);

        // Step 6: Update the password and clear the OTP data
        restaurantOwner.password = newPassword;  // Update the password field
        restaurantOwner.passwordResetOtp = undefined; // Clear OTP after successful reset
        restaurantOwner.passwordResetOtpExpiresAt = undefined; // Clear expiration time

        await restaurantOwner.save();

        // Respond back with success
        res.status(200).json({ message: 'Password reset successful' });
    } catch (error) {
        console.error('Error in OTP verification and password change:', error);
        return res.status(500).json({ message: 'An error occurred during OTP verification and password reset' });
    }
};




