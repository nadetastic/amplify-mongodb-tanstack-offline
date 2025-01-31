import type {AppSyncIdentityCognito} from 'aws-lambda';

import type {Schema} from './resource'
import {connectToMongodb} from "./mdbUtils";
import {ObjectId} from "mongodb";


function successResponse(body: any, id: string): object {
    return {
        statusCode: 200,
        count: body,
        deletedId: id, 
    };
}
function errorResponse(err: Error): object {
    const errorMessage = err.message;
    return {
        statusCode: 400,
        body: errorMessage,
        headers: {
            'Content-Type': 'application/json',
        },
    };
}

export const handler: Schema["addTodo"]['functionHandler'] = async (event, context) => {

    // Connect to MongoDB
    const [client, , collection] = connectToMongodb();
    try {
        console.log('Connected to MongoDB');
        let user = null;
        if ((event.identity as AppSyncIdentityCognito).username)
            user = (event.identity as AppSyncIdentityCognito).username;
        
        const id = event.arguments._id!;


        // delete where object id and user match 
        const deleteResult = await collection.deleteOne({ _id: new ObjectId(id), username: user });
        // response = { deleted_count: deleteResult.deletedCount };

        return successResponse(deleteResult, id);
    } catch (e) {
        return errorResponse(e as Error);
    } finally {
        if (client) {
            await client.close();
        }
    }
};