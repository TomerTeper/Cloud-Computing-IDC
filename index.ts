// import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";
import * as AWS from "aws-sdk";

const table = new aws.dynamodb.Table("parkingTable", {
    attributes: [
        { name: "ticketId", type: "S" },
    ],
    hashKey: "ticketId",
    billingMode: "PAY_PER_REQUEST",
});

const entryFunction = new aws.lambda.CallbackFunction("entryFunction", {
    callback: async (event:any) => {
        const plate = event.queryStringParameters?.plate;
        const parkingLot = event.queryStringParameters?.parkingLot;

        if (!plate || !parkingLot) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Missing plate or parkingLot parameter" }),
            };
        }

        const ticketId = `${Date.now()}p${parkingLot}`;

        

        const client = new AWS.DynamoDB.DocumentClient();
        await client.put({
            TableName: table.name.get(),
            Item: { plate, parkingLot, ticketId },
        }).promise();

        console.log(`Entry recorded: ${plate} at ${parkingLot} with ticket ID ${ticketId}`);

        return {
            statusCode: 200,
            body: JSON.stringify({ ticketId }),
        };
    },
});

const exitFunction = new aws.lambda.CallbackFunction("exitFunction", {
    callback: async (event:any) => {
        const ticketId:string = event.queryStringParameters?.ticketId;

        if (!ticketId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Missing ticketId parameter" }),
            };
        }

        const client = new AWS.DynamoDB.DocumentClient();
        const result = await client.get({
            TableName: table.name.get(),
            Key: { ticketId },
        }).promise();

        const carParams = result.Item;

        if (!carParams) {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: `Ticket not found ${ticketId} ${carParams}` }),
            };
        }

        const plate = carParams?.plate;
        const parkingLot = carParams?.parkingLot;
        const totalTime = Math.floor((Date.now() - +ticketId.split('p')[0]) / 1000 / 60); // in minutes
        const charge = Math.floor(totalTime/15) * 2.5;

        return {
            statusCode: 200,
            body: JSON.stringify({
                plate,
                totalTime,
                parkingLot,
                charge,
            }),
        };
    },
});

const api = new awsx.classic.apigateway.API("parkingLotApi", {
    routes: [
        {
            path: "/entry",
            method: "POST",
            eventHandler: entryFunction,
        },
        {
            path: "/exit",
            method: "POST",
            eventHandler: exitFunction,
        },
    ],
});

export const url = api.url;