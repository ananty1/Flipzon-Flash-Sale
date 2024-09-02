const express = require('express');
const router = express.Router();
const client = require('../redis/Client');
const Booking = require('../models/booking'); // Your Booking model

const sendToQueue  = require('../messageQueue/publish');



router.post('/book-item/:sale_id', async (req,res)=>{
  const sale_id = req.params.sale_id;
  const user_authentication_token = req.headers['authorization'].split(' ');

  const request = {sale_id, user_authentication_token, timestamp: new Date()};

  await sendToQueue(request);

  res.status(200).json({message: 'Your request is being processed. Please wait for confirmation.'})
})
// router.post('/book-item/:sale_id', async (req, res) => {
//   const sale_id = req.params.sale_id;
//   const user_authentication_token = req.headers['authorization'].split(' ')[1];

//   try {
//     // Check the current inventory
//     const remainingInventory = await client.decr('inventory:iphone:count');

//     if (remainingInventory < 0) {
//       // Revert the decrement if inventory is exhausted
//       await client.incr('inventory:iphone:count');
//       // Add to virtual queue
//       await client.lpush('virtual_queue', JSON.stringify({
//         sale_id,
//         user_authentication_token,
//         timestamp: new Date()
//       }));
//       return res.status(404).json({ message: 'No items available for booking. You are in the waiting list.' });
//     }

//     // Process the booking
//     const booking = new Booking({
//       status: 'hold',
//       userInfo: { user_authentication_token },
//       booking_info: { item_id: sale_id },
//       orderTimestamp: new Date()
//     });
//     await booking.save();

//     // Add to hold queue
//     await client.lpush('hold_queue', JSON.stringify(booking));
    
//     return res.status(200).json({ message: 'Item booked successfully, complete the transaction to confirm.' });
//   } catch (error) {
//     return res.status(500).json({ message: 'Booking failed', error: error.message });
//   }
// });



































router.put('/booking-service/book-item/:sale_id/:booking_id', async (req, res) => {
  const { sale_id, booking_id } = req.params;
  
  try {
    // Find the booking in the database
    const booking = await Booking.findOne({ booking_id, 'booking_info.item_id': sale_id });
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    // Check if the booking is currently on hold
    if (booking.status !== 'hold') {
      return res.status(400).json({ message: 'Booking is not on hold.' });
    }

    // Update the status to 'booked'
    booking.status = 'booked';
    booking.orderTimestamp = new Date();
    await booking.save();
    
    // Remove the booking from the hold queue in Redis
    await client.lrem('hold_queue', 0, JSON.stringify({ sale_id, booking_id }));
    
    // Respond to the client
    return res.status(200).json({ message: 'Booking status updated to booked.' });

  } catch (error) {
    return res.status(500).json({ message: 'Failed to update booking status.', error: error.message });
  }
});



router.delete('/booking-service/book-item/:sale_id/:booking_id', async (req, res) => {
  const { sale_id, booking_id } = req.params;

  try {
    // Find the booking in the database
    const booking = await Booking.findOne({ booking_id, 'booking_info.item_id': sale_id });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    // Check if the booking is currently on hold
    if (booking.status !== 'hold') {
      return res.status(400).json({ message: 'Booking is not on hold or already processed.' });
    }

    // Update the status to 'deleted'
    booking.status = 'deleted';
    booking.orderTimestamp = new Date();
    await booking.save();
    
    // Remove the booking from the hold queue in Redis
    await client.lrem('hold_queue', 0, JSON.stringify({ sale_id, booking_id }));
    
    // Add the item back to the inventory if needed
    await client.incr('inventory:iphone:count');

    // Respond to the client
    return res.status(200).json({ message: 'Booking canceled and item returned to inventory.' });

  } catch (error) {
    return res.status(500).json({ message: 'Failed to cancel booking.', error: error.message });
  }
});



module.exports = router;
