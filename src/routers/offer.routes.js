import express from 'express';
import { addOffer, updateOffer, deleteOffer,getOffers } from '../controllers/offer.controller.js'; // Adjust the path as necessary
import { verifyJWT, isRestaurantOwner, csrfProtectionMiddleware } from '../middleware/auth.middleware.js';
const router = express.Router();

router.post('/:restaurantId/', verifyJWT, isRestaurantOwner,addOffer);
router.get('/:restaurantId/', verifyJWT, isRestaurantOwner,getOffers);
router.put('/:restaurantId/:offerId', verifyJWT, isRestaurantOwner,updateOffer);
router.delete('/:restaurantId/:offerId',verifyJWT, isRestaurantOwner, deleteOffer);

export default router;
