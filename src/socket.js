export const setupSocketIO = (io) => {
    io.on('connection', (socket) => {
        console.log('A user connected , SOCKET ID :', socket.id);
  
        socket.on('orderUpdate', (data) => {
            if (!data.tableId || !data.status) {
                console.error('Invalid order update data:', data);
                return;
            }
            console.log(`Order update received for Table ${data.tableId}: ${data.status}`);
            socket.broadcast.emit('orderUpdate', data);
        });
  
        socket.on('paymentProcessed', (data) => {
            console.log(`Payment processed for Order ID ${data.orderId} with Transaction ID ${data.transactionId}`);
            socket.broadcast.emit('paymentProcessed', { tableId: data.tableId, transactionId: data.transactionId });
        });
  
        socket.on('disconnect', () => {
            console.log('User disconnected');
        });
    });
};
