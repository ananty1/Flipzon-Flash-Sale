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


router.put('/booking-service/book-item/:sale_id/:booking_id', async (req, res) => {
  const { sale_id, booking_id } = req.params;

  const booking = await Booking.findById(booking_id);

  if (!booking || booking.status !== 'hold') {
    return res.status(400).json({ error: 'Booking not found or not eligible for confirmation' });
  }

  booking.status = 'booked';
  booking.updatedtime = new Date();
  await booking.save();

  // Remove the user from the Redis active_users set
  await redisClient.srem('active_users', booking.userInfo.user_authentication_token);

  res.json({ message: 'Booking confirmed successfully', booking });
});


router.delete('/booking-service/book-item/:sale_id/:booking_id', async (req, res) => {
  const { sale_id, booking_id } = req.params;

  const booking = await Booking.findById(booking_id);

  if (!booking || booking.status !== 'hold') {
    return res.status(400).json({ error: 'Booking not found or not eligible for cancellation' });
  }

  booking.status = 'deleted';
  booking.updatedtime = new Date();
  await booking.save();

  // Return the item to the queue
  await redisClient.lpush('inventory_queue', booking.booking_info.item_id);

  // Remove the user from the Redis active_users set
  await redisClient.srem('active_users', booking.userInfo.user_authentication_token);

  res.json({ message: 'Booking cancelled successfully', booking });
});



































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
