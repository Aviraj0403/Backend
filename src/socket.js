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
              const { selectedTable, totalPrice, cart, selectedOffer, customer, phone, priority } = data.orderDetails;
          
              // Validation
              if (!customer || !phone) {
                console.error('Missing customer or phone details');
                return;
              }
          
              if (!Array.isArray(cart) || cart.length === 0) {
                console.error('Cart is empty');
                return;
              }
          
              // Map cart items to orderItems
              const orderItems = cart.map(item => ({
                foodId: item.fooditemId,  // Assuming you use fooditemId from the cart
                quantity: item.quantity || 1,  // Default quantity if not provided
                price: item.price || 0,  // You should calculate the price if not present
              }));
          
              // Calculate the total price (consider offers or discounts if any)
              let finalTotalPrice = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
              if (selectedOffer) {
                const discountPercentage = selectedOffer.discountPercentage || 0;
                finalTotalPrice -= (finalTotalPrice * discountPercentage) / 100; // Apply discount
              }
          
              // Create new order
              const newOrder = new Order({
                customer,
                phone,
                diningTableId: selectedTable,
                restaurantId: data.restaurantId,
                offerId: selectedOffer ? selectedOffer._id : null,
                items: orderItems,
                totalPrice: finalTotalPrice,
                paymentStatus: 'Pending',
                status: 'Pending',
                discount: selectedOffer ? selectedOffer.discountPercentage : 0,
                priority,
              });
          
              await newOrder.save();
          
              // Emit new order to all clients in the restaurant room
              io.to(data.restaurantId).emit('newOrder', newOrder);
          
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