import { MasterUser } from '../models/masterUser.model.js'; // Adjust path as needed
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';  // Ensure bcrypt is installed and used if needed

// Function to login a master user
export const loginMaster = async (req, res) => {
    const { username, password } = req.body;

    try {
        const masterUser = await MasterUser.findOne({ username });

        if (!masterUser || !(await masterUser.isPasswordCorrect(password))) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: masterUser._id, role: 'master' },  // Include role if needed
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({ token });
    } catch (err) {
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
};

// Middleware to authenticate and verify JWT
export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.status(401).json({ message: 'Token required' });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Forbidden' });

        req.user = user;
        next();
    });
};

// Example of a protected route
export const getMasterData = (req, res) => {
    // Access user from the request
    const user = req.user;

    // Perform actions based on user role and permissions
    res.json({ message: 'Protected data accessed', user });
};

// Function to handle logout (optional)
// This is a basic implementation and may need to be adapted if using a token blacklist
export const logout = (req, res) => {
    // In a real-world scenario, you might want to implement token blacklisting
    res.json({ message: 'Logged out successfully' });
};
