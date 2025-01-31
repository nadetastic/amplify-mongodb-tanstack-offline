import type { AppSyncIdentityCognito } from 'aws-lambda';
import {connectToMongodb} from "./mdbUtils";

import type { Schema } from './resource'

// type TodoList = Schema["listTodo"]['functionHandler'];



function successResponse(body: any): object {
    return {
        statusCode: 200,
        todoList: body,
    };
}
function errorResponse(err: Error): object {
    const errorMessage = err.message;
    return {
        statusCode: 400,
        body: errorMessage,
    };
}
export const handler: Schema["listTodo"]['functionHandler'] = async (event, context) => {

    // Connect to MongoDB
    const [client, , collection] = connectToMongodb();
    
    try {
        console.log('Connected to MongoDB');
        let user = null;
        if ((event.identity as AppSyncIdentityCognito).username) 
            user = (event.identity as AppSyncIdentityCognito).username;

        let response: any;

        const payload = {"username":user};
        console.log("retrieving results")
        response = await collection.find(payload).toArray();
        console.log(`results retrieved: ${JSON.stringify(response)}`)

        return successResponse(response);
        // return response.body;
    } catch (e) {
        console.log("got error: " + e);
        return errorResponse(e as Error);
    } finally {
        if (client) {
            await client.close();
        }
    }
};