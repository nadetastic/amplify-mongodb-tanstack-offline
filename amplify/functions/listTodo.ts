import type { AppSyncIdentityCognito } from "aws-lambda";
import { connectToMongodb } from "./mdbUtils";

import type { Schema } from "../data/resource";

// type TodoList = Schema["listTodo"]['functionHandler'];

export const handler: Schema["listTodo"]["functionHandler"] = async (event) => {
  // Connect to MongoDB
  const [client, , collection] = connectToMongodb();

  try {
    console.log("Connected to MongoDB");
    let user = null;
    if ((event.identity as AppSyncIdentityCognito).username)
      user = (event.identity as AppSyncIdentityCognito).username;

    // const response: any;

    const payload = { username: user };
    console.log("retrieving results");
    const response = await collection.find(payload).toArray();
    console.log(`results retrieved: ${JSON.stringify(response)}`);

    return {
      statusCode: 200,
      todoList: [],
    };
    // return response.body;
  } catch (e) {
    return {
      statusCode: 500,
      todoList: [],
    };
  } finally {
    if (client) {
      await client.close();
    }
  }
};
