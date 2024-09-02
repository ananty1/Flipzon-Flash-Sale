const express = require('express');
const router = express.Router();
const Booking = require('../models/booking'); // Your Booking model
const client = require('../redis/Client');

async function initializeInventory() {
  await Booking.deleteMany({});

    const items = [];
    for (let i = 0; i < 1000; i++) {
        items.push({
            booking_id: `booking_${i + 1}`,
            status: 'available',
            booking_info: { item_id: 1 },
        });
    }

    try {
        await Booking.insertMany(items);
        console.log('Inventory initialized successfully.');
    } catch (error) {
        console.error('Failed to initialize inventory:', error.message);
    }
}


// Initialize inventory with items
router.post('/init', async (req, res) => {

  try {
    client.set('inventory:iphone:count', 1000);
    await Booking.deleteMany({});
    await client.del('virtual_queue');
    await client.del('hold_queue');
    await client.del('user_bookings', (err, response) => {
      if (err) {
        console.error('Error deleting key:', err);
      } else {
        console.log('Delete response:', response);
      }
    });
    // await initializeInventory();
    return res.status(200).json({ message: 'Inventory initialized successfully.' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to initialize inventory', error: error.message });
  }
});

// Check inventory status
router.get('/status', async (req, res) => {
  try {
    const availableCount = await Booking.countDocuments({ status: 'available' });
    return res.status(200).json({ message: `Items available: ${availableCount}` });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to check inventory status', error: error.message });
  }
});

module.exports = router;
