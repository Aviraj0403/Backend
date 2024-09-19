import mongoose from 'mongoose';
import { MasterUser } from '../src/models/masterUser.model.js'; // Adjust the path as necessary
import bcrypt from 'bcrypt';

const createUsers = async () => {
    try {
        await mongoose.connect('mongodb+srv://aviraj0403:abcd123456@restaurant.0slro.mongodb.net/Restaurant?retryWrites=true&w=majority&appName=Restaurant', { useNewUrlParser: true, useUnifiedTopology: true });

        const users = [
            {
                username: 'admin@12',
                email: 'admin@example.com',
                password: 'admin', // Plain password
                role: 'restaurantOwner'
            },
            {
                username: 'superadmin@12',
                email: 'superadmin@example.com',
                password: 'superadmin', // Plain password
                role: 'superAdmin'
            }
        ];

        for (const user of users) {
            const existingUser = await MasterUser.findOne({ username: user.username });
            if (existingUser) {
                console.log(`User already exists: ${user.username}`);
                continue;
            }

            const hashedPassword = await bcrypt.hash(user.password, 10);

            const newUser = new MasterUser({
                username: user.username,
                email: user.email,
                password: hashedPassword,
                role: user.role
            });

            await newUser.save();
            console.log(`User created successfully: ${newUser.username}`);
        }
    } catch (error) {
        console.error('Error creating users:', error);
    } finally {
        mongoose.connection.close();
    }
};

createUsers();
