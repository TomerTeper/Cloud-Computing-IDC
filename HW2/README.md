
# A Messaging System Backend in the Cloud!

## Overview
This project is a cloud-based messaging system backend built using AWS Serverless technologies and Pulumi for infrastructure as code. It includes features for user registration, sending messages, group management, user blocking capabilities, etc.

## Table of Contents
- [Overview](#overview)
- [Architecture](#architecture)
- [Technologies Used](#technologies-used)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [API Endpoints and Test Examples](#api-endpoints-and-test-examples)
- [DynamoDB Schema](#dynamodb-schema)

## Architecture
The project uses the following AWS services:
- **Amazon DynamoDB:** NoSQL database to store user, messages, and group data.
- **AWS API Gateway:** Entry point for all API requests.
- **Amazon ECS Fargate:** To run containers without managing servers.
- **AWS IAM:** To manage access and permissions for the application components.

## Technologies Used
- **Node.js:** JavaScript runtime for the server.
- **Express.js:** Web framework for Node.js.
- **Pulumi:** Infrastructure as Code tool for managing AWS resources.
- **AWS SDK:** For interacting with AWS services.

## Prerequisites
- [Node.js](https://nodejs.org/) (version 14.x or higher)
- [Pulumi](https://www.pulumi.com/) (version 3.x or higher)
- AWS account and configured AWS CLI

## Installation
1. Clone the repository:
    ```sh
    git clone https://github.com/TomerTeper/Cloud-Computing-IDC.git
    cd Cloud-Computing-IDC/HW2
    ```

2. Install dependencies:
    ```sh
    npm install
    ```

3. Set up Pulumi:
    ```sh
    pulumi login
    pulumi stack init dev
    pulumi config set aws:region us-east-1
    export AWS_ACCESS_KEY_ID=<YOUR_ACCESS_KEY_ID>
    export AWS_SECRET_ACCESS_KEY=<YOUR_SECRET_ACCESS_KEY>
    ```

4. Deploy the infrastructure:
    ```sh
    pulumi up
    ```

5. Add table output names to table names in `server.js` at the start:
    ```js
    const usersTableName = "<usersTableName>";
    const messagesTableName = "<messagesTableName>";
    const groupsTableName = "<groupsTableName>";
    const groupMessagesTableName = "<groupMessagesTableName>";
    ```

6. Deploy the infrastructure again:
    ```sh
    pulumi up
    ```

## API Endpoints and Test Examples

### GET /
Returns a welcome message.

**Example:**
```sh
curl http://<pulumi url output>/
```

### POST /registerUser
Registers a new user.

**Example:**
```sh
curl -X POST http://<pulumi url output>/registerUser -H "Content-Type: application/json" -d '{"id": "user123"}'
```

### POST /sendMessage
Sends a message between users.

**Example:**
```sh
curl -X POST http://<pulumi url output>/sendMessage -H "Content-Type: application/json" -d '{"senderId": "user123", "receiverId": "user456", "content": "Hello!"}'
```

### POST /blockUser
Blocks a user.

**Example:**
```sh
curl -X POST http://<pulumi url output>/blockUser -H "Content-Type: application/json" -d '{"userId": "user123", "blockUserId": "user456"}'
```

### POST /createGroup
Creates a new group.

**Example:**
```sh
curl -X POST http://<pulumi url output>/createGroup -H "Content-Type: application/json" -d '{"groupName": "Group1", "members": ["user123", "user456"]}'
```

### POST /removeUserFromGroup
Removes a user from a group.

**Example:**
```sh
curl -X POST http://<pulumi url output>/removeUserFromGroup -H "Content-Type: application/json" -d '{"groupsId": "group123", "userId": "user456"}'
```

### POST /addUserToGroup
Adds a user to a group.

**Example:**
```sh
curl -X POST http://<pulumi url output>/addUserToGroup -H "Content-Type: application/json" -d '{"groupsId": "group123", "userId": "user789"}'
```

### POST /sendMessageToGroup
Sends a message to a group.

**Example:**
```sh
curl -X POST http://<pulumi url output>/sendMessageToGroup -H "Content-Type: application/json" -d '{"groupsId": "group123", "senderId": "user123", "content": "Hello Group!"}'
```

### GET /checkMessages
Checks messages for a user.

**Example:**
```sh
curl http://<pulumi url output>/checkMessages?userId=user123
```

## DynamoDB Schema

### Users Table
- **TableName:** `<usersTableName>`
- **Attributes:**
  - `userId` (String) - Partition key
  - `blockedUsers` (List) - List of userIds that this user has blocked
  - `groups` (List) - List of groupIds this user is a member of

### Messages Table
- **TableName:** `<messagesTableName>`
- **Attributes:**
  - `receiverId` (String) - Partition key
  - `senderId` (String) - ID of the user who sent the message
  - `content` (String) - Message content
  - `timestamp` (String) - Time the message was sent

### Groups Table
- **TableName:** `<groupsTableName>`
- **Attributes:**
  - `groupsId` (String) - Partition key
  - `groupName` (String) - Name of the group
  - `members` (List) - List of userIds who are members of the group

### GroupMessages Table
- **TableName:** `<groupMessagesTableName>`
- **Attributes:**
  - `groupsId` (String) - Partition key
  - `messageId` (String) - ID of the message
  - `senderId` (String) - ID of the user who sent the message
  - `content` (String) - Message content
  - `timestamp` (String) - Time the message was sent
  - `members` (List) - List of userIds who are members of the group
