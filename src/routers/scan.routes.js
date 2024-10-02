import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

const FOOD_API_URL = "http://localhost:4000/api/food";
const TABLE_API_URL = "http://localhost:4000/api/table";

// Scan endpoint to fetch food and table data
router.get('/', async (req, res) => {
  const { restaurantId, tableId } = req.query;

  try {
    // Fetch food items for the restaurant
    const foodResponse = await fetch(`${FOOD_API_URL}/${restaurantId}/list-food`);
    const foodData = await foodResponse.json();

    // Fetch table information
    const tableResponse = await fetch(`${TABLE_API_URL}/${restaurantId}/${tableId}`);
    const tableData = await tableResponse.json();

    // Return combined data
    res.json({
      food: foodData,
      table: tableData,
      tableId,
    });
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ message: 'Error fetching data' });
  }
});

export default router;
