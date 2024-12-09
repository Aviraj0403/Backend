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
            console.log("Order Details:", data.orderDetails);

            // Ensure that required fields are provided
            const { customerName, customerPhone, restaurantId, orderDetails } = data;
            const { selectedTable, totalPrice, cart } = orderDetails;

            if (!customerName || !customerPhone || !cart || cart.length === 0) {
                console.error('Missing required order details:', data);
                return;
            }

            try {
                const newOrder = new Order({
                    customer: customerName,  // Assuming customer name is provided
                    phone: customerPhone,    // Assuming phone number is provided
                    restaurantId: restaurantId,
                    diningTableId: selectedTable,
                    items: cart.map(item => ({
                        foodId: item.foodId,     // Ensure foodId is present
                        quantity: item.quantity, // Ensure quantity is present
                        price: item.price        // Ensure price is present
                    })),
                    totalPrice: totalPrice,
                    paymentStatus: 'Pending',
                    status: 'Pending',
                });

                await newOrder.save();

                // Emit the new order to all clients in the restaurant room
                io.to(restaurantId).emit('newOrder', data);

                console.log(`Order for Table ${selectedTable} saved successfully`);

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
