import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

const FOOD_API_URL = "https://backend-obet.onrender.com/api/food";
const TABLE_API_URL = "https://backend-obet.onrender.com/api/table";
const OFFER_API_URL = "https://backend-obet.onrender.com/api/offer";

// Scan endpoint to fetch food, table, and offer data
router.get('/', async (req, res) => {
  const { restaurantId, tableId } = req.query; // Extract restaurantId and tableId from query parameters

  if (!restaurantId || !tableId) {
    return res.status(400).json({ message: 'Restaurant ID and Table ID are required' });
  }

  try {
    // Fetch food items for the restaurant
    const foodResponse = await fetch(`${FOOD_API_URL}/${restaurantId}/list-food`);
    const foodData = await foodResponse.json();

    // Fetch table information for the restaurant and tableId
    const tableResponse = await fetch(`${TABLE_API_URL}/${restaurantId}/${tableId}`);
    const tableData = await tableResponse.json();

    // Fetch active offers for the restaurant
    const offerResponse = await fetch(`${OFFER_API_URL}/${restaurantId}/get-active`);
    const offerData = await offerResponse.json();

    // Return combined data
    res.json({
      food: foodData,
      table: tableData,
      offers: offerData,
      tableId,
    });
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ message: 'Error fetching data' });
  }
});

export default router;
