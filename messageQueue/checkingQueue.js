const rabbit = require('amqplib');

async function checkQueueStatus() {
    try {
        const connection = await rabbit.connect('amqp://localhost');
        const channel = await connection.createChannel();
        const queue = 'booking_requests';

        const queueStatus = await channel.checkQueue(queue);
        console.log(`Queue ${queue} has ${queueStatus.messageCount} messages waiting.`);
        
        await channel.close();
        await connection.close();
    } catch (error) {
        console.error('Error checking queue status:', error);
    }
}

checkQueueStatus();
