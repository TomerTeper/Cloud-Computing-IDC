# Cloud-Computing-IDC

# Parking Lot Management System

This project is a cloud-based system to manage a parking lot, built using Pulumi, AWS Lambda, API Gateway, and DynamoDB. The system provides endpoints for recording entry and exit of vehicles, calculating the total parked time, and charging fees based on 15-minute increments.

## Project Structure

- `index.ts`: The main file containing the Pulumi infrastructure code.
- `package.json`: The Node.js project configuration file.
- `Pulumi.yaml`: The Pulumi project configuration file.

## Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/)
- [Pulumi](https://www.pulumi.com/docs/get-started/install/)
- [AWS CLI](https://aws.amazon.com/cli/) and configured with your credentials

## Setup

1. **Clone the repository:**

    ```sh
    git clone <repository-url>
    cd pulumi/HW1
    ```

2. **Install dependencies:**

    ```sh
    npm install
    ```

3. **Configure Pulumi:**

    If this is your first time using Pulumi, you'll need to log in:

    ```sh
    pulumi login
    ```

    Initialize the Pulumi project:

    ```sh
    pulumi new aws-typescript
    ```

## Deploying the Project

To deploy the project to AWS, run:

```sh
pulumi up
```
## API Endpoints

## Exit Endpoint

- URL: /entry
- Method: POST
- Parameters:
    - plate: The license plate of the vehicle.
    - parkingLot: The ID of the parking lot.
- Example:
    ```sh
    curl -Method POST -Uri "<API_URL>/entry?plate=123-123-123&parkingLot=382"
    ```

## Exit Endpoint

- URL: /exit
- Method: POST
- Parameters:
    - ticketId: The ticket ID received during entry.
- Example:
    ```sh
    curl -Method POST -Uri "<API_URL>/exit?ticketId=1234567890p382"
    ```

## Code Overview

index.ts file contains the Pulumi code to set up the infrastructure:

- DynamoDB Table: Used to store parking lot entry and exit records.
- Lambda Functions: Handle the entry and exit logic, interacting with DynamoDB to store and retrieve records.
- API Gateway: Exposes the /entry and /exit endpoints, connecting them to the respective Lambda functions.

## DynamoDB Schema

- Table Name: parkingLotTable
- Attributes:
    - ticketId: String (Primary Key)
    - plate: String
    - parkingLot: String
    - entryTime: Number
 
