import twilio from 'twilio';

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Function to generate OTP and send it via SMS
export const sendOtpToPhone = async (phoneNumber) => {
    // Generate OTP
    const otp = generateOtp();
    const otpExpiresAt = Date.now() + 300000; // OTP validity of 5 minutes (300000 ms)

    // Format the phone number into the correct international format
    const formattedPhoneNumber = formatPhoneNumber(phoneNumber);
    // console.log("Formatted Phone Number: ", formattedPhoneNumber);

    if (!formattedPhoneNumber) {
        throw new Error('Invalid phone number format');
    }

    // Store OTP and expiration time in your database (or memory store)
    const otpRecord = {
        otp,
        otpExpiresAt
    };

    try {
        // Send OTP via SMS using Twilio API
        await client.messages.create({
            body: `Your OTP for password reset is: ${otp}`,
            from: process.env.TWILIO_PHONE_NUMBER, // Ensure this number is set in your env vars
            to: formattedPhoneNumber // Ensure the phone number is formatted correctly
        });

        // Log OTP details for debugging (remove in production)
        // console.log("OTP Sent:", otpRecord);

        return otpRecord; // Return the OTP details (for validation later)
    } catch (error) {
        console.error('Error sending OTP:', error);
        throw new Error('Failed to send OTP');
    }
};

// Function to generate a random 6-digit OTP
const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString(); // Generate a 6-digit OTP
};

// Function to format phone number to international format (e.g., +91XXXXXXXXXX)
const formatPhoneNumber = (phoneNumber) => {
    // console.log("Raw Phone Number:", phoneNumber);

    // Check if phoneNumber is defined and is a string
    if (typeof phoneNumber !== 'string' || phoneNumber.trim() === '') {
        return null; // Invalid phone number format
    }

    // Clean up the phone number (remove any non-digit characters)
    const cleanedPhoneNumber = phoneNumber.replace(/\D/g, '');  // Remove non-digit characters

    // If the number starts with '+91', it's already in international format
    if (cleanedPhoneNumber.startsWith('91') && cleanedPhoneNumber.length === 12) {
        return `+${cleanedPhoneNumber}`;  // Prepend '+' if it's not there
    }

    // If the number is exactly 10 digits, assume it's an Indian phone number and add '+91'
    if (/^\d{10}$/.test(cleanedPhoneNumber)) {
        return `+91${cleanedPhoneNumber}`; // Add +91 for Indian numbers
    }

    // If the phone number has a valid country code but not +91, we can format it as a general international number
    if (/^\d{11,15}$/.test(cleanedPhoneNumber)) {
        return `+${cleanedPhoneNumber}`; // Prepend '+' for international numbers
    }

    return null;  // Return null if it doesn't match any valid format
};
