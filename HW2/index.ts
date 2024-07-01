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

// const config = new pulumi.Config();
// const containerPort = config.getNumber("containerPort") || 80;
// const cpu = config.getNumber("cpu") || 512;
// const memory = config.getNumber("memory") || 128;

// const service = new awsx.ecs.FargateService("service", {
//     cluster,
//     assignPublicIp: true,
//     taskDefinitionArgs: {
//         container: {
//             name: "app",
//             image: img.imageUri,
//             cpu: cpu,
//             memory: memory,
//             essential: true,
//             portMappings: [{
//                 containerPort: containerPort,
//                 targetGroup: alb.defaultTargetGroup,
//             }],
//         },
//     },
// });
// Export the Internet address for the service.
export const url = web.endpoint.hostname;

// const config = new pulumi.Config();
// const containerPort = config.getNumber("containerPort") || 80;
// const cpu = config.getNumber("cpu") || 512;
// const memory = config.getNumber("memory") || 128;

// // An ECS cluster to deploy into
// const cluster = new aws.ecs.Cluster("cluster", {});

// // An ALB to serve the container endpoint to the internet
// const loadbalancer = new awsx.lb.ApplicationLoadBalancer("loadbalancer", {});

// // An ECR repository to store our application's container image
// const repo = new awsx.ecr.Repository("repo", {
//     forceDelete: true,
// });

// // Build and publish our application's container image from ./app to the ECR repository
// const image = new awsx.ecr.Image("image", {
//     repositoryUrl: repo.url,
//     context: "./app",
//     platform: "linux/amd64",
// });

// // Deploy an ECS Service on Fargate to host the application container
// const service = new awsx.ecs.FargateService("service", {
//     cluster: cluster.arn,
//     assignPublicIp: true,
//     taskDefinitionArgs: {
//         container: {
//             name: "app",
//             image: image.imageUri,
//             cpu: cpu,
//             memory: memory,
//             essential: true,
//             portMappings: [{
//                 containerPort: containerPort,
//                 targetGroup: loadbalancer.defaultTargetGroup,
//             }],
//         },
//     },
// });

// // const ip = loadbalancer.loadBalancer.
// // The URL at which the container's HTTP endpoint will be available
// export const url = pulumi.interpolate`http://${loadbalancer.loadBalancer.dnsName}`;
