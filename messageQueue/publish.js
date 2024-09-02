const amqp = require('amqplib/callback_api');

async function sendToQueue(request){
    amqp.connect('amqp://localhost',(err,connection)=>{
        if(err){
            throw err;
        }
    
        connection.createChannel((err,channel)=>{
            if(err){
                throw err;
            }
    
            let queue_name = 'booking_requests';
            let message = JSON.stringify(request);
    
            channel.assertQueue(queue_name,{
                durable:true
            });
    
            channel.sendToQueue(queue_name,Buffer.from(message));
            // console.log(`Message : ${message}`);
            setTimeout(()=>{
                connection.close();
    
            },100);
        })
    
    })
}


module.exports = sendToQueue;