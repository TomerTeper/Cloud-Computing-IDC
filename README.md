
# Cloud Computing Projects

## Projects Overview

### HW1: Parking Lot Management System

A cloud-based system to manage a parking lot, built with Pulumi, AWS Lambda, API Gateway, and DynamoDB. It provides endpoints for recording vehicle entries and exits, calculating parking durations, and charging fees.

**Key Technologies**:
- Pulumi
- AWS Lambda
- API Gateway
- DynamoDB

**Endpoints**:
- `/entry` - Record vehicle entry.
- `/exit` - Record vehicle exit.

### HW2: Messaging System Backend

A backend for a messaging system built using AWS Serverless technologies. It supports user registration, sending messages, group management, and user blocking.

**Key Technologies**:
- Pulumi
- Amazon ECS Fargate
- DynamoDB
- IAM
- Docker
- Node.js
- Express.js

**Endpoints**:
- `/registerUser` - Register a new user.
- `/sendMessage` - Send a message to another user.
- `/createGroup` - Create a new group.
- `/sendMessageToGroup` - Send a message to a group.
- `/blockUser` - Block a user.
- `/removeUserFromGroup` - Remove a user from a group.
- `/addUserToGroup` - Add a user to a group.
- `/checkMessages` - Check messages for a user.

### Final Project: Traffic Control and Ticketing System

This cloud-based traffic control and ticketing system processes data from traffic cameras to monitor vehicles, identify speed limit violations, and file tickets automatically. The system is built with a focus on scalability, long-term sustainability, and cost efficiency using AWS and third-party services.

**Key Technologies**:
- **DynamoDB**: Stores traffic data (vehicle details, camera locations).
- **S3**: Stores traffic camera images.
- **Lambda**: Handles data extraction and ticket processing workflows.
- **SQS**: Queue system for managing traffic data ingestion.
- **AWS Location Service**: For map rendering and location-based queries.
- **Carnet.ai**: A third-party car recognition service used for image processing.

**Features**:
- **Traffic Monitoring:** Aggregates data from traffic cameras and identifies vehicles.
- **Automatic Ticket Filing:** Detects speed limit violations using camera data and files tickets.
- **Alerts System:** Tracks vehicle locations and issues notifications for specific conditions.
- **Query Service:** Provides APIs for querying traffic data based on various criteria (e.g., vehicle, location, time).

