const cluster = require('cluster');
const os = require('os');
const express = require("express");
const connect = require("./dbConnection/connectMongo");
const bookingService = require('./routes/bookingService');
const inventoryService = require('./routes/inventoryService');
const sendToQueue = require('./messageQueue/publish');
const client = require('./redis/Client');
const consumeQueue = require('./messageQueue/worker');
require("dotenv").config();


const totalCPUs = os.cpus().length;

if (cluster.isPrimary) {

    for (let i = 0; i < totalCPUs; i++) {
        cluster.fork();
    }

}

else {
    const app = express();
    const PORT = process.env.PORT || 5000;
    app.use(express.json());



    connect();
    app.use('/api/inventory-service', inventoryService);
    app.use('/api/booking-service', bookingService);

    app.get('/', (req, res) => {
        res.send({ message: 'Likhne me maja bahut aata hai' });
    })
    // Periodic Job to Release Expired Holds
    consumeQueue()

    setInterval(async () => {
        const expiredHolds = await client.keys('hold:*');
        for (const holdKey of expiredHolds) {
            const status = await client.get(holdKey);
            if (status === 'hold') {
                await client.del(holdKey);  // Remove hold
                await client.incr('inventory:iphone:count');  // Replenish inventory
                const userRequest = await client.rpop('virtual_queue');  // Process the next request from the queue
                if (userRequest) {
                    await sendToQueue(JSON.parse(userRequest));
                }
            }
        }
    }, 60000);


    app.listen(PORT, () => {
        console.log(`Server is running at port ${PORT} and ${process.pid}`);
    })


}



