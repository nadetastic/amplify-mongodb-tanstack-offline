import { defineFunction } from "@aws-amplify/backend";
import "dotenv/config";

const envValues = {
  ATLAS_CONNECTION_STRING: process.env.ATLAS_CONNECTION_STRING!,
  COLLECTION_NAME: process.env.COLLECTION_NAME!,
  DB_NAME: process.env.DB_NAME!,
};
export const listTodoHandler = defineFunction({
  entry: "./listTodo.ts",
  name: "listTodoHandler",
  environment: {
    ...envValues,
  },
});

export const addTodoHandler = defineFunction({
  entry: "./addTodo.ts",
  environment: {
    ...envValues,
  },
});

export const deleteTodoHandler = defineFunction({
  entry: "./deleteTodo.ts",
  environment: {
    ...envValues,
  },
});

export const updateTodoHandler = defineFunction({
  entry: "./updateTodo.ts",
  environment: {
    ...envValues,
  },
});
