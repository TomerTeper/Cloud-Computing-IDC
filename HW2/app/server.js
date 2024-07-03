const bodyParser = require("body-parser");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const AWS = require("aws-sdk");
const express = require("express");
const port = process.env.PORT || 80;
const HOST = "0.0.0.0";
const app = express();
const dynamoDb = new AWS.DynamoDB.DocumentClient({ region: "us-east-1" });

const usersTableName = "<usersTableName>";
const messagesTableName = "<messagesTableName>";
const groupsTableName = "<groupsTableName>";
const groupMessagesTableName = "<groupMessagesTableName>";

app.use(express.json());
// app.use(bodyParser.json(),cors())

app.get("/", (req, res) => {
  res.send("Hello World from Pulumi");
});

app.post("/registerUser", async (req, res) => {
  const userId = req.body.id;

  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }

  const params = {
    TableName: usersTableName,
    Item: { userId, blockedUsers: [], groups: [] },
  };

  try {
    await dynamoDb.put(params).promise();
    res.status(201).json({ userId });
  } catch (error) {
    res.status(500).json({ error: `Could not add user ${error}` });
  }
});

app.post("/sendMessage", async (req, res) => {
  const { senderId, receiverId, content } = req.body;

  if (!senderId || !receiverId || !content) {
    return res
      .status(400)
      .json({ error: "Sender ID, Receiver ID, and Content are required" });
  }

  // Check if the receiver has blocked the sender
  const checkBlockedParams = {
    TableName: usersTableName,
    Key: {
      userId: receiverId,
    },
  };

  try {
    const receiver = await dynamoDb.get(checkBlockedParams).promise();

    if (
      receiver.Item.blockedUsers &&
      receiver.Item.blockedUsers.includes(senderId)
    ) {
      return res
        .status(403)
        .json({ error: "You are blocked from sending messages to this user" });
    }

    //   const messageId = uuidv4();
    const timestamp = new Date().toISOString();

    const messageParams = {
      TableName: messagesTableName,
      Item: { senderId, receiverId, content, timestamp },
    };

    await dynamoDb.put(messageParams).promise();
    res.status(201).json({ receiverId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: `Could not send message ${error}` });
  }
});

app.post("/blockUser", async (req, res) => {
  const { userId, blockUserId } = req.body;

  if (!userId || !blockUserId) {
    return res
      .status(400)
      .json({ error: "User ID and Block User ID are required" });
  }

  const params = {
    TableName: usersTableName,
    Key: { userId },
    UpdateExpression: `SET blockedUsers = list_append(blockedUsers, :blockUserId)`,
    ExpressionAttributeValues: {
      ":blockUserId": [blockUserId],
    },
    ReturnValues: "UPDATED_NEW",
  };

  try {
    await dynamoDb.update(params).promise();
    res.status(200).json({ message: "User blocked successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: `Could not block user ${error}` });
  }
});

app.post("/createGroup", async (req, res) => {
  const { groupName, members } = req.body;

  if (!groupName || !Array.isArray(members) || members.length === 0) {
    return res
      .status(400)
      .json({ error: "Group name and members are required" });
  }

  const groupsId = uuidv4();

  const groupParams = {
    TableName: groupsTableName,
    Item: {
      groupsId,
      groupName,
      members,
    },
  };

  try {
    // Add the group to the Groups table
    await dynamoDb.put(groupParams).promise();

    // Update each user in the Users table to add the GroupID to their list of groups
    const updateUserPromises = members.map(async (userId) => {
      const updateParams = {
        TableName: usersTableName,
        Key: { userId },
        UpdateExpression: "SET groups = list_append(groups, :groupsId)",
        ExpressionAttributeValues: {
          ":groupsId": [groupsId],
        },
        ReturnValues: "UPDATED_NEW",
      };
      return dynamoDb.update(updateParams).promise();
    });

    // Wait for all update operations to complete
    await Promise.all(updateUserPromises);

    res.status(201).json({ groupsId, groupName, members });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: `Could not create group ${error}` });
  }
});

// todo: need to fix bug in DELETE UpdateExpression
// app.post("/removeUserFromGroup", async (req, res) => {
//   const { groupsId, userId } = req.body;

//   if (!groupsId || !userId) {
//     return res.status(400).json({ error: "Group ID and User ID are required" });
//   }

//   // Remove the user from the group's member list
//   const removeGroupParams = {
//     TableName: groupsTableName,
//     Key: { groupsId },
//     UpdateExpression: "DELETE members :userId",
//     ExpressionAttributeValues: {
//       ":userId": dynamoDb.createSet([userId]),
//     },
//     ReturnValues: "UPDATED_NEW",
//   };

//   // Remove the group from the user's list of groups
//   const removeUserParams = {
//     TableName: usersTableName,
//     Key: { userId },
//     UpdateExpression: "DELETE groups :groupsId",
//     ExpressionAttributeValues: {
//       ":groupsId": dynamoDb.createSet([groupsId]),
//     },
//     ReturnValues: "UPDATED_NEW",
//   };

//   try {
//     await dynamoDb.update(removeGroupParams).promise();
//     await dynamoDb.update(removeUserParams).promise();
//     res.status(200).json({ message: "User removed from group successfully" });
//   } catch (error) {
//     console.error(error);
//     res
//       .status(500)
//       .json({ error: `Could not remove user from group ${error}` });
//   }
// });

app.post("/removeUserFromGroup", async (req, res) => {
  const { groupsId, userId } = req.body;

  if (!groupsId || !userId) {
    return res.status(400).json({ error: "Group ID and User ID are required" });
  }

  try {
    // Get the current members list of the group
    const groupResult = await dynamoDb
      .get({
        TableName: groupsTableName,
        Key: { groupsId },
      })
      .promise();

    const members = groupResult.Item?.members || [];
    const updatedMembers = members.filter((member) => member !== userId);

    // Update the group's member list
    const updateGroupParams = {
      TableName: groupsTableName,
      Key: { groupsId },
      UpdateExpression: "SET members = :updatedMembers",
      ExpressionAttributeValues: {
        ":updatedMembers": updatedMembers,
      },
      ReturnValues: "UPDATED_NEW",
    };

    await dynamoDb.update(updateGroupParams).promise();

    // Get the current groups list of the user
    const userResult = await dynamoDb
      .get({
        TableName: usersTableName,
        Key: { userId },
      })
      .promise();

    const groups = userResult.Item?.groups || [];
    const updatedGroups = groups.filter((group) => group !== groupsId);

    // Update the user's groups list
    const updateUserParams = {
      TableName: usersTableName,
      Key: { userId },
      UpdateExpression: "SET groups = :updatedGroups",
      ExpressionAttributeValues: {
        ":updatedGroups": updatedGroups,
      },
      ReturnValues: "UPDATED_NEW",
    };

    await dynamoDb.update(updateUserParams).promise();

    res.status(200).json({ message: "User removed from group successfully" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: `Could not remove user from group: ${error}` });
  }
});

app.post("/addUserToGroup", async (req, res) => {
  const { groupsId, userId } = req.body;

  if (!groupsId || !userId) {
    return res.status(400).json({ error: "Group ID and User ID are required" });
  }

  // Add the user to the group's member list
  const addGroupParams = {
    TableName: groupsTableName,
    Key: { groupsId },
    UpdateExpression: "SET members = list_append(members, :userId)",
    ExpressionAttributeValues: {
      ":userId": [userId],
    },
    ReturnValues: "UPDATED_NEW",
  };

  // Add the group to the user's list of groups
  const addUserParams = {
    TableName: usersTableName,
    Key: { userId },
    UpdateExpression: "SET groups = list_append(groups, :groupsId)",
    ExpressionAttributeValues: {
      ":groupsId": [groupsId],
    },
    ReturnValues: "UPDATED_NEW",
  };

  try {
    await dynamoDb.update(addGroupParams).promise();
    await dynamoDb.update(addUserParams).promise();
    res.status(200).json({ message: "User added to group successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: `Could not add user to group ${error}` });
  }
});

app.post("/sendMessageToGroup", async (req, res) => {
  const { groupsId, senderId, content } = req.body;

  if (!groupsId || !senderId || !content) {
    return res
      .status(400)
      .json({ error: "Group ID, Sender ID, and Content are required" });
  }

  // Fetch group members
  const groupParams = {
    TableName: groupsTableName,
    Key: { groupsId },
  };

  try {
    const groupData = await dynamoDb.get(groupParams).promise();
    if (!groupData.Item) {
      return res.status(404).json({ error: "Group not found" });
    }

    const members = groupData.Item.members;
    const messageId = uuidv4();
    const timestamp = new Date().toISOString();

    // Create a batch write request to insert the message for each member
    // const writeRequests = uniqueMembers.map((receiverId) => ({
    //   PutRequest: {
    //     Item: {
    //       messageId,
    //       groupsId,
    //       senderId,
    //       receiverId,
    //       content,
    //       timestamp,
    //     },
    //   },
    // }));
    const messageParams = {
      TableName: groupMessagesTableName,
      Item: {
        messageId,
        members,
        groupsId,
        senderId,
        // receiverId,
        content,
        timestamp,
      },
    };

    // // Batch write to the groupMessages table
    // const batchWriteParams = {
    //   RequestItems: {
    //     [groupMessagesTableName]: writeRequests,
    //   },
    // };

    await dynamoDb.put(messageParams).promise();

    res.status(201).json({ message: "Message sent to group successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: `Could not send message to group ${error}` });
  }
});

app.get("/checkMessages", async (req, res) => {
  const userId = req.query.userId;
  const lastEvaluatedKey = req.query.lastEvaluatedKey
    ? JSON.parse(req.query.lastEvaluatedKey)
    : null;

  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }

  try {
    // Query individual messages
    const individualMessagesParams = {
      TableName: messagesTableName,
      KeyConditionExpression: "receiverId = :receiverId",
      ExpressionAttributeValues: {
        ":receiverId": userId,
      },
      Limit: 50, // Limit the number of messages to 50
      ExclusiveStartKey: lastEvaluatedKey, // Start from the last evaluated key, if provided
    };

    const individualMessages = await dynamoDb
      .query(individualMessagesParams)
      .promise();

    // Query group memberships for the user
    const userParams = {
      TableName: usersTableName,
      Key: { userId },
    };

    const userData = await dynamoDb.get(userParams).promise();
    if (!userData.Item || !userData.Item.groups) {
      return res.status(200).json(individualMessages.Items); // Return only individual messages if no groups
    }

    const groupIds = userData.Item.groups;

    // Query group messages for each group the user is part of
    const groupMessagesPromises = groupIds.map((groupsId) => {
      const groupMessagesParams = {
        TableName: groupMessagesTableName,
        KeyConditionExpression: "groupsId = :groupsId",
        ExpressionAttributeValues: {
          ":groupsId": groupsId,
        },
        Limit: 50, // Limit the number of messages to 50
        ExclusiveStartKey: lastEvaluatedKey, // Start from the last evaluated key, if provided
      };

      return dynamoDb.query(groupMessagesParams).promise();
    });

    const groupMessagesResults = await Promise.all(groupMessagesPromises);

    // Combine individual messages and group messages
    const groupMessages = groupMessagesResults.flatMap(
      (result) => result.Items
    );
    const allMessages = individualMessages.Items.concat(groupMessages);

    res.status(200).json({
      messages: allMessages,
      individualLastEvaluatedKey: individualMessages.LastEvaluatedKey,
      groupLastEvaluatedKey: groupMessagesResults.LastEvaluatedKey
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: `Could not retrieve messages ${error}` });
  }
});

// app.listen(port, () => console.log(`server is runing in ${port}`));

app.listen(port, HOST);
// const userId = req.query.id;
//   const message = req.body.message;
