const amqp = require('amqplib/callback_api');
const client = require('../redis/Client');
const uuid = require('uuid');
const Booking = require('../models/booking');


async function consumeQueue(){
    amqp.connect('amqp://localhost',async (err,connection)=>{
        if(err){
            throw err;
        }
    
        connection.createChannel(async (err,channel)=>{
            if(err){
                throw err;
            }
    
            let queue_name = 'booking_requests';
            
    
            channel.assertQueue(queue_name,{
                durable:true
            });
    
            channel.consume(queue_name,async (msg)=>{
                const request = JSON.parse(msg.content.toString());
                const {sale_id,user_authentication_token} = request;
                

                // Check if the user has already booked the item
                const existingBooking = await Booking.findOne({
                    'userInfo.user_authentication_token': user_authentication_token[1],
                    'booking_info.item_id': sale_id,
                    status: 'hold' // Or any other status you want to check for
                });

                if (existingBooking) {
                    // console.log(`User ${user_authentication_token} has already booked item ${sale_id}. Skipping...`);
                    channel.ack(msg); // Acknowledge the message to avoid reprocessing
                    return;
                }

                const remainingInventory = await client.decr(`inventory:iphone:count`);
                // console.log("The count is",await client.get(`inventory:iphone:count`));
                if(remainingInventory < 0 ){

                    await client.incr(`inventory:iphone:count`);
                    await client.lpush('virtual_queue',JSON.stringify(request));

                }
                else{
                    const bookingId = uuid.v4();
                    await client.setex(`hold:${bookingId}`,300,'hold'); // 5 minutes hold
                    // console.log("Trying to store the element");
                    await Booking.create({
                        booking_id:bookingId,
                        status: 'hold',
                        userInfo:{
                            user_authentication_token:user_authentication_token[1],
                        },
                        booking_info:{
                            item_id:sale_id,
                        },
                        createdTime: new Date()
                    })

                    // console.log(`Booking placed on hold for ${user_authentication_token} with booking ID: ${bookingId}`);

                }

                // console.log(`Recieved: ${sale_id}, ${user_authentication_token}`);
                
                channel.ack(msg);
            },
            // {
            //     noAck:true
            // }
        )
        })
    
    })
}




module.exports  = consumeQueue;
