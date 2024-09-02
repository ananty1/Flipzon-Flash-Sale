# Flash Sale System

## Introduction
This document provides a detailed overview of the Flash Sale System implemented to handle high-concurrency scenarios, where a limited number of items are available for purchase, and a large number of users are attempting to buy them simultaneously.

## Assumptions
1. **Inventory Size:** The inventory size is limited, e.g., 1000 items.
2. **Traffic Load:** The system should handle up to 1 million concurrent users attempting to purchase items.
3. **Inventory Consistency:** The system must ensure that inventory is neither oversold nor undersold.
4. **Client Behavior:** Users may refresh the page frequently or attempt to book items using scripts.
5. **User Authentication:** All users are authenticated, and each user is allowed to purchase only one item.
6. **Request Queue:** Incoming requests are managed via a message queue (RabbitMQ).

## System Design

### Architecture Overview
The system consists of several key components:
1. **Message Queue (RabbitMQ):** To handle and buffer incoming requests, ensuring that the backend processes them at a controlled pace.
2. **Redis:** Used for managing inventory counters and holding reservations.
3. **Backend Service:** Node.js-based service responsible for processing requests, updating inventory, and managing bookings.
4. **Database:** A persistent store (e.g., MongoDB) for storing booking records and tracking user transactions.

### Workflow
1. **Request Handling:**
   - User requests are pushed to a RabbitMQ queue.
   - The backend service consumes requests from the queue in a FIFO order.
   
2. **Inventory Management:**
   - Redis is used for atomic inventory operations (`decr`, `incr`).
   - Inventory counts are decremented as requests are processed.
   
3. **Booking Process:**
   - If inventory is available, the system creates a booking with a `hold` status in the database.
   - The booking remains in the `hold` state for a fixed period (e.g., 5 minutes) until the user confirms the purchase.
   - If the user fails to confirm within the timeframe, the booking is canceled, and the inventory is incremented back.
   
4. **Concurrency Handling:**
   - The use of Redis ensures atomic operations on inventory counters.
   - RabbitMQ manages request processing speed to avoid overwhelming the backend.

5. **Cheating Prevention:**
   - Each user is limited to one booking per sale.
   - The system can track IP addresses and user agents to detect and prevent bot activity.

### Components
- **RabbitMQ:**
  - Manages the incoming booking requests.
  - Provides a buffer to handle spikes in user traffic.
  
- **Redis:**
  - Manages the inventory count.
  - Stores temporary holds on bookings.
  
- **MongoDB:**
  - Persists booking records with user and transaction details.
  
- **Node.js Backend:**
  - Handles business logic for the flash sale.
  - Communicates with RabbitMQ, Redis, and MongoDB.

## Implementation

### 1. RabbitMQ Setup
   - RabbitMQ is used to manage booking requests. The queue `booking_requests` is created and configured for durability.
   
### 2. Redis Configuration
   - Redis keys are structured as `inventory:<sale_id>:count` for inventory management and `hold:<booking_id>` for tracking holds.

### 3. Booking Process
   - **Booking Creation:** If inventory is available, a booking record is created in MongoDB with a status of `hold`.
   - **Status Update:** A PUT API updates the booking status to `booked` when the user confirms the purchase.
   - **Cancellation:** A DELETE API cancels a booking if the user fails to complete the purchase in time.

### 4. Error Handling
   - **Inventory Undersell/Oversell:** Atomic operations in Redis prevent inventory mismatches.
   - **Queue Overflow:** RabbitMQ manages the load to ensure that requests are processed at a manageable rate.

## APIs

### 1. PUT: `/booking-service/book-item/{sale-id}/{booking-id}`
   - **Description:** Updates the status of a booking from `on hold` to `booked`.
   - **Request Body:**
     ```json
     {
       "status": "booked"
     }
     ```

### 2. DELETE: `/booking-service/book-item/{sale-id}/{booking-id}`
   - **Description:** Cancels a booking if it's not confirmed in time.
   - **Request Body:**
     ```json
     {
       "status": "deleted"
     }
     ```

## Considerations

### 1. Scalability:
   - The system is designed to scale horizontally. Redis and RabbitMQ can be clustered to handle increased load.

### 2. Resilience:
   - RabbitMQ provides durability and ensures that messages are not lost even if the service crashes.

### 3. Performance Optimization:
   - Caching strategies can be employed to reduce database load, e.g., caching item details.

## Conclusion
This flash sale system is designed to handle high-concurrency scenarios efficiently, ensuring that inventory is managed accurately and that the system remains responsive under heavy load.

## Future Improvements
- **Use of Redis Pub/Sub:** To notify users in real-time when their booking status changes.
- **Advanced Monitoring:** Implement monitoring tools to track system performance and detect bottlenecks.
- **Machine Learning:** Predict user behavior and optimize inventory distribution.
