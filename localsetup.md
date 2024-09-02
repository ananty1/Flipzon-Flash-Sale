# Flipzon Flash Sale - Local Setup Guide

## Prerequisites

Before starting, ensure you have the following installed on your machine:

- **Node.js** (v14.x or higher)
- **npm** (comes with Node.js) or **Yarn** (optional)
- **MongoDB** (can be installed locally or use MongoDB Atlas)
- **Redis** (can be installed locally)
- **RabbitMQ** (for message queuing)
- **Git** (for cloning the repository)

## Step 1: Clone the Repository

First, clone the GitHub repository to your local machine:

```bash
git clone https://github.com/ananty1/Flipzon-Flash-Sale.git
cd Flipzon-Flash-Sale


Step 2: Install Dependencies
Navigate to the project directory and install the required Node.js packages:
```
```bash
Copy code
npm install
Or if you prefer Yarn:

bash
Copy code
yarn install
Step 3: Set Up MongoDB
If you're using MongoDB locally, make sure it's running:

bash
Copy code
# Start MongoDB service (depends on your OS)
# For Linux:
sudo service mongod start

# For macOS using Homebrew:
brew services start mongodb/brew/mongodb-community

# For Windows:
net start MongoDB
If you're using MongoDB Atlas, update the connection string in your .env file with your credentials.

Step 4: Set Up Redis
Install and run Redis on your local machine:

bash
Copy code
# For Linux:
sudo apt-get install redis-server
sudo service redis-server start

# For macOS using Homebrew:
brew install redis
brew services start redis

# For Windows:
# Download Redis from https://github.com/microsoftarchive/redis/releases and install it.
redis-server
Step 5: Set Up RabbitMQ
Install and run RabbitMQ:

bash
Copy code
# For Linux:
sudo apt-get install rabbitmq-server
sudo service rabbitmq-server start

# For macOS using Homebrew:
brew install rabbitmq
brew services start rabbitmq

# For Windows:
# Download RabbitMQ from https://www.rabbitmq.com/install-windows.html and install it.
rabbitmq-server
Step 6: Configure Environment Variables
Create a .env file in the root directory of the project and configure the necessary environment variables. Here’s an example .env file:

plaintext
Copy code
PORT=3000
MONGODB_URI=mongodb://localhost:27017/flash_sale
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
RABBITMQ_URL=amqp://localhost
Ensure you replace MONGODB_URI with your actual MongoDB URI if using MongoDB Atlas.

Step 7: Set Up Database and Queues
If you haven't already, ensure that MongoDB, Redis, and RabbitMQ are running:

bash
Copy code
# Start MongoDB (if not already started):
sudo service mongod start

# Start Redis (if not already started):
redis-server

# Start RabbitMQ (if not already started):
rabbitmq-server
Step 8: Run the Server
Now, start the server:

bash
Copy code
npm start
Or if you prefer Yarn:

bash
Copy code
yarn start
The server should now be running on the port specified in the .env file (default is 3000). You can access the system via http://localhost:3000.

Step 9: Testing the System
You can use Postman or cURL to test the various API endpoints provided by the system. Here are some examples:

Booking an Item
bash
Copy code
curl -X POST http://localhost:3000/booking-service/book-item/{sale-id} \
     -H "Content-Type: application/json" \
     -d '{"user_authentication_token": "your_token_here"}'
Updating Booking Status
bash
Copy code
curl -X PUT http://localhost:3000/booking-service/book-item/{sale-id}/{booking-id} \
     -H "Content-Type: application/json" \
     -d '{"status": "booked"}'
Deleting a Booking
bash
Copy code
curl -X DELETE http://localhost:3000/booking-service/book-item/{sale-id}/{booking-id}
Step 10: Monitor Logs and Queues
You can monitor the logs using the terminal output or configure a logging service. Additionally, monitor RabbitMQ and Redis to ensure that the queues and in-memory storage are functioning correctly.

Step 11: Shutting Down the System
To gracefully shut down the system:

Stop the Node.js server: Use Ctrl+C in the terminal where the server is running.
Stop MongoDB: sudo service mongod stop (Linux) or brew services stop mongodb-community (macOS).
Stop Redis: redis-cli shutdown (all platforms).
Stop RabbitMQ: sudo service rabbitmq-server stop (Linux) or brew services stop rabbitmq (macOS).