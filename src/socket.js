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

            try {
                const { selectedTable, totalPrice, cart } = data.orderDetails;

                const newOrder = new Order({
                    customer: data.customerName, // Assuming you send customer details
                    phone: data.customerPhone, // Assuming phone number is provided
                    restaurantId: data.restaurantId,
                    diningTableId: selectedTable,
                    items: cart.map(item => ({
                        foodId: item.foodId,
                        quantity: item.quantity,
                        price: item.price
                    })),
                    totalPrice: totalPrice,
                    paymentStatus: 'Pending',
                    status: 'Pending',
                });

                await newOrder.save();

                // Emit the new order to all clients in the restaurant room
                io.to(data.restaurantId).emit('newOrder', data);

            } catch (error) {
                console.error('Error saving new order to database:', error);
            }
        });

        socket.on('disconnect', () => {
            console.log('User disconnected');
        });
    });
};
