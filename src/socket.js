export const setupSocketIO = (io) => {
    io.on('connection', (socket) => {
        console.log('A user connected, SOCKET ID:', socket.id);

        // Join restaurant room
        socket.on('joinRestaurant', (restaurantId) => {
            socket.join(restaurantId);
            console.log(`Socket ${socket.id} joined restaurant ${restaurantId}`);
        });

        // Listen for order updates
        socket.on('orderUpdate', (data) => {
            if (!data.restaurantId || !data.tableId || !data.status) {
                console.error('Invalid order update data:', data);
                return;
            }
            console.log(`Order update for Table ${data.tableId} at Restaurant ${data.restaurantId}: ${data.status}`);
            
            socket.to(data.restaurantId).emit('orderUpdate', data);
        });

        // Listen for new orders
        socket.on('newOrder', (data) => {
            if (!data.restaurantId || !data.orderId || !data.tableId) {
                console.error('Invalid order data:', data);
                return;
            }
            console.log(`New order received: ${data.orderId} for ${data.tableName} at Restaurant ${data.restaurantId}`);
            console.log("Order Details:", data.orderDetails);
            socket.to(data.restaurantId).emit('newOrder', data);
        });

        // Listen for processed payments
        socket.on('paymentProcessed', (data) => {
            if (!data.restaurantId || !data.orderId || !data.transactionId || !data.tableId) {
                console.error('Invalid payment data:', data);
                return;
            }
            console.log(`Payment processed for Order ID ${data.orderId} with Transaction ID ${data.transactionId} at Restaurant ${data.restaurantId}`);
            socket.to(data.restaurantId).emit('paymentProcessed', {
                restaurantId: data.restaurantId,
                tableId: data.tableId,
                transactionId: data.transactionId,
                tableName: data.tableName,
                orderId: data.orderId,
            });
        });

        socket.on('disconnect', () => {
            console.log('User disconnected');
        });
    });
};
