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
        // Process incoming order data
        socket.on('newOrder', async (data) => {
            if (!data.restaurantId || !data.orderDetails || !data.orderDetails.cart || !data.tableId) {
                console.error('Invalid order data:', data);
                return;
            }

            console.log(`New order received for Table ${data.tableId} at Restaurant ${data.restaurantId}`);
            console.log("Order Details:", data.orderDetails);

            try {
                const { selectedTable, totalPrice, cart } = data.orderDetails;

                // Map cart items correctly with foodId and price
                const items = cart.map(item => {
                    if (!item.fooditemId || !item.price) {
                        console.error('Missing required fields in cart item:', item);
                        return null;
                    }
                    return {
                        foodId: item.fooditemId,  // Ensure this maps correctly to 'foodId'
                        quantity: item.quantity,
                        price: item.price          // Ensure 'price' is included for each item
                    };
                }).filter(item => item !== null); // Remove invalid items from the list

                // If no valid items exist in the order, exit
                if (items.length === 0) {
                    console.error('No valid items found in order');
                    return;
                }

                // Create new order
                const newOrder = new Order({
                    customer: data.customer,   // Ensure 'customer' is passed
                    phone: data.phone,         // Ensure 'phone' is passed
                    restaurantId: data.restaurantId,
                    diningTableId: selectedTable,
                    items: items,              // Use the mapped items array
                    totalPrice: totalPrice,
                    paymentStatus: 'Pending',
                    status: 'Pending',
                });

                // Save the new order to the database
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
