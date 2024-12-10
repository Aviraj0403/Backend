import Order from './models/order.model.js'; // Import the Order model

export const setupSocketIO = (io) => {
    io.on('connection', (socket) => {
        console.log('A user connected, SOCKET ID:', socket.id);

        // Join restaurant room
        socket.on('joinRestaurant', (restaurantId) => {
            socket.join(restaurantId);
            console.log(`Socket ${socket.id} joined restaurant ${restaurantId}`);
        });

        // Listen for new orders
        socket.on('newOrder', async (data) => {
            if (!data.restaurantId || !data.orderDetails || !data.orderDetails.cart || !data.tableId) {
                console.error('Invalid order data:', data);
                return;
            }

            console.log(`New order received for Table ${data.tableId} at Restaurant ${data.restaurantId}`);
            console.log("Order Details through Socket socke:", data.orderDetails);

            // Create a new order and save it to the database
            try {
                const { selectedTable, totalPrice, cart } = data.orderDetails;
                // Ensure cart items include both foodId and price
                const items = cart.map(item => ({
                    foodId: item.fooditemId, // Make sure you're using the correct field for foodId
                    quantity: item.quantity,
                    price: item.price || 0, // Ensure the price exists; use 0 as a fallback if not available
                }));
                const newOrder = new Order({
                    customer: data.orderDetails.customer, // Assuming you send customer details
                    phone: data.orderDetails.phone, // Assuming phone number is provided
                    restaurantId: data.restaurantId,
                    diningTableId: selectedTable,
                    items: items,
                    totalPrice: totalPrice,
                    paymentStatus: 'Pending',
                    status: 'Pending',
                });
                console.log("new  Order", newOrder);

                await newOrder.save();

                // Emit the new order to all clients in the restaurant room
                io.to(data.restaurantId).emit('newOrder', data);

            } catch (error) {
                console.error('Error saving new order to database:', error);
            }
        });

        // Other socket event handlers (paymentProcessed, orderUpdate, etc.)

        socket.on('disconnect', () => {
            console.log('User disconnected');
        });
    });
};
