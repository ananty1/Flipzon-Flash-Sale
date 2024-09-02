const mongoose = require('mongoose');

const bookingSchema = mongoose.Schema({
    booking_id:String,
    status: String,
    userInfo:{
        user_authentication_token:String,
    },
    booking_info:{
        item_id:String,
    },
    orderTimestamp: { type: Date, default: Date.now },
})

const Booking = mongoose.model('Booking',bookingSchema);
module.exports = Booking;
