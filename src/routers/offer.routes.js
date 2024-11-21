import express from 'express';
import { addOffer, updateOffer, deleteOffer, getOffers, getActiveOffers, getOfferById } from '../controllers/offer.controller.js'; // Adjust the path as necessary
import { verifyJWT, isRestaurantOwner, csrfProtectionMiddleware } from '../middleware/auth.middleware.js';
const router = express.Router();

// Add Offer
router.post('/:restaurantId/', verifyJWT, isRestaurantOwner, addOffer);

// Get all offers for a restaurant
router.get('/:restaurantId/', verifyJWT, isRestaurantOwner, getOffers);

// Get a specific offer by offerId
// Route for getting active offers for a restaurant
router.get('/:restaurantId/get-active', getActiveOffers);

// Route for getting a specific offer by offerId (ensure it's more specific)
router.get('/:restaurantId/:offerId', verifyJWT, isRestaurantOwner, getOfferById);

// Update an existing offer
router.put('/:restaurantId/:offerId', verifyJWT, isRestaurantOwner, updateOffer);

// Delete an offer
router.delete('/:restaurantId/:offerId', verifyJWT, isRestaurantOwner, deleteOffer);

export default router;
