import { Owner } from '../models/owner.model.js';
import { Restaurant } from '../models/restaurant.model.js';

export const createOwner = async (req, res) => {
    try {
        const { username, email, password, restaurantId } = req.body;
        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });

        const owner = new Owner({ username, email, password, restaurant: restaurantId });
        await owner.save();

        res.status(201).json(owner);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Implement other owner-related methods
