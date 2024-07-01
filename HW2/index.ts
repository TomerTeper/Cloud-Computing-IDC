import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";

const usersTable = new aws.dynamodb.Table("users", {
    attributes: [
        { name: "userId", type: "S" },
    ],
    hashKey: "userId",
    billingMode: "PAY_PER_REQUEST",
});

const messagesTable = new aws.dynamodb.Table("messages", {
    attributes: [
        { name: "receiverId", type: "S" },
    ],
    hashKey: "receiverId",
    readCapacity: 5,
    writeCapacity: 5,
});

const groupsTable = new aws.dynamodb.Table("groups", {
    attributes: [
        { name: "groupsId", type: "S" },
    ],
    hashKey: "groupsId",
    readCapacity: 5,
    writeCapacity: 5,
});

const groupMessagesTable = new aws.dynamodb.Table("groupMessages", {
    attributes: [
        { name: "groupsId", type: "S" },
    ],
    hashKey: "groupsId",
    readCapacity: 5,
    writeCapacity: 5,
});



// Create an ECS Fargate cluster.
const cluster = new awsx.classic.ecs.Cluster("cluster");

// Define the Networking for our service.
const alb = new awsx.classic.lb.ApplicationLoadBalancer(
    "net-lb", { external: true, securityGroups: cluster.securityGroups });
const web = alb.createListener("web", { port: 80, external: true });

// Create a repository for container images.
const repo = new awsx.ecr.Repository("repo", {
    forceDelete: true,
});

// Build and publish a Docker image to a private ECR registry.
const img = new awsx.ecr.Image("app-img", { repositoryUrl: repo.url, context: "./app", platform: "linux/amd64", });

// Create a Fargate service task that can scale out.
const appService = new awsx.classic.ecs.FargateService("app-svc", {
    cluster,
    taskDefinitionArgs: {
        container: {
            image: img.imageUri,
            cpu: 102 /*10% of 1024*/,
            memory: 50 /*MB*/,
            essential: true,
            portMappings: [ web ],
        },
    },
    desiredCount: 5,
});

export const url = web.endpoint.hostname;

