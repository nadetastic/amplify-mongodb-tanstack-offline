import type { AppSyncIdentityCognito } from "aws-lambda";

import type { Schema } from "../data/resource";
import { connectToMongodb } from "./mdbUtils";
import { ObjectId } from "mongodb";

export const handler: Schema["addTodo"]["functionHandler"] = async (event) => {
  // Connect to MongoDB
  const [client, , collection] = connectToMongodb();
  try {
    console.log("Connected to MongoDB");
    let user = null;
    if ((event.identity as AppSyncIdentityCognito).username)
      user = (event.identity as AppSyncIdentityCognito).username;

    const id = event.arguments._id!;

    // delete where object id and user match
    const deleteResult = await collection.deleteOne({
      _id: new ObjectId(id),
      username: user,
    });
    // response = { deleted_count: deleteResult.deletedCount };

    return {
      statusCode: 200,
      todos: {
        _id: id,
        username: user,
        deleted_count: deleteResult.deletedCount,
      },
    };
  } catch (e) {
    return {
      statusCode: 500,
      todos: {
        _id: event.arguments._id!,
        username: (event.identity as AppSyncIdentityCognito).username,
        deleted_count: 0,
      },
    };
  } finally {
    if (client) {
      await client.close();
    }
  }
};
