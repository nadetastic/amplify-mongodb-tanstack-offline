import { type ClientSchema, a, defineData, defineFunction } from "@aws-amplify/backend";

const envValues = {
    ATLAS_CONNECTION_STRING: process.env.ATLAS_CONNECTION_STRING!,
    COLLECTION_NAME: process.env.COLLECTION_NAME!,
    DB_NAME: process.env.DB_NAME!
};
const listTodoHandler = defineFunction({
  entry: './listTodo.ts',
  environment: {
      ...envValues,
  }
});

const addTodoHandler = defineFunction({
  entry: './addTodo.ts',
  environment: {
      ...envValues,
  }
});

const deleteTodoHandler = defineFunction({
  entry: './deleteTodo.ts',
  environment: {
      ...envValues,
  }
});

const updateTodoHandler = defineFunction({
  entry: './updateTodo.ts',
  environment: {
      ...envValues,
  }
});

const schema = a.schema({
  Todo: a.customType({
      _id: a.id().required(),
      content: a.string().required(),
    }),
  ListTodoResponse: a.customType({
    statusCode:a.string(),
    todoList:a.ref("Todo").array(),
  }),
  AddTodoResponse: a.customType({
    statusCode:a.string(),
    todo:a.ref("Todo"),
  }),
  DeleteTodoResponse: a.customType({
    statusCode:a.string(),
    count:a.string(),
    deletedId:a.string(),
  }),
  UpdatedTodoResponse: a.customType({
    statusCode:a.string(),
    count:a.string(),
    todo: a.ref("Todo"),
  }),
  addTodo: a
    .mutation()
    .arguments({
      _id: a.id(),
      content: a.string().required(),
    })
    .returns(a.ref("AddTodoResponse"))
    .authorization(allow => [allow.authenticated()])
    .handler(a.handler.function(addTodoHandler)),
  listTodo: a
    .query()
    .returns(a.ref("ListTodoResponse"))
    .authorization(allow => [allow.authenticated()])
    .handler(a.handler.function(listTodoHandler)),
  deleteTodo: a
    .mutation()
    .arguments({
      _id: a.string().required(),
    })
    .returns(a.ref("DeleteTodoResponse"))
    .authorization(allow => [allow.authenticated()])
    .handler(
      a.handler.function(deleteTodoHandler)
    ),
  updateTodo: a
    .mutation()
    .arguments({
      _id: a.string().required(),
      content: a.string().required(),
    })
    .returns(a.ref("UpdatedTodoResponse"))
    .authorization(allow => [allow.authenticated()])
    .handler(
      a.handler.function(updateTodoHandler)
    ),
    RealEstateProperty: a.model({
      name: a.string().required(),
      address: a.string(),
    }).authorization(allow => [allow.guest()]),

});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});