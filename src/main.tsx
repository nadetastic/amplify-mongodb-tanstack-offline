import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { Amplify } from 'aws-amplify'
import outputs from '../amplify_outputs.json'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import { generateClient } from "aws-amplify/data";
import type { Schema } from "../amplify/data/resource";
import { useMutation, useQuery } from '@tanstack/react-query'
import { Authenticator } from '@aws-amplify/ui-react';

Amplify.configure(outputs)

export const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <ReactQueryDevtools initialIsOpen={true} />
    </QueryClientProvider>
  </React.StrictMode>,
)

const client = generateClient<Schema>();

function App() {

  type Todo = Schema["addTodo"]['arguments'];

  const query = useQuery({
    queryKey: ["listTodo"],
    staleTime: 60*1000,
    // networkMode: "offlineFirst",
    // initialData: [{_id:"666", content: "Initial value"}],
    queryFn: async () => {
      const response = await client.queries.listTodo();

      const allTodos = response.data;

      if (!allTodos) return null;

      return allTodos.todoList;
    },
  });


  const createMutation = useMutation({
    mutationFn: async (input: { content: string}) => {
      const { data } = await client.mutations.addTodo(input);
      return data;
    },
    // When mutate is called:
    onMutate: async (newTodo) => {
      // Cancel any outgoing refetches
      // (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ["listTodo"] });
  
      // Snapshot the previous value
      const previousTodoList = queryClient.getQueryData([
        "listTodo",
      ]);
  
      // Optimistically update to the new value
      if (previousTodoList) {
        queryClient.setQueryData(["listTodo"], (old: Todo[]) => [
          ...old,
          newTodo,
        ]);
      }
  
      // Return a context object with the snapshotted value
      return { previousTodoList };
    },
    // If the mutation fails,
    // use the context returned from onMutate to rollback
    onError: (err, newTodo, context) => {
      console.error("Error saving record:", err, newTodo);
      if (context?.previousTodoList) {
        queryClient.setQueryData(
          ["listTodo"],
          context.previousTodoList
        );
      }
    },
    // Always refetch after error or success:
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["listTodo"] });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listTodo"] });
    },
  });

  const createTodo = async() => {
    const itemContent = window.prompt("Todo content");
    if (!itemContent) return;
      createMutation.mutate({
          content: itemContent
      });
  }
  
  const updateTodo = async(todo: Todo) => {
    if (!todo) return;
  
    const itemContent = window.prompt("Todo content", todo?.content);
    if (!itemContent) return;
  
    const updatedTodo:Todo = {...todo, content: itemContent };

    updateMutation.mutate({...updatedTodo});
  
  }
  
  const updateMutation = useMutation({
      mutationFn: async (todo: {_id:string, content: string}) => {
          const { data } = await client.mutations.updateTodo(todo);;

          return data!.todo;
      },
      // When mutate is called:
      onMutate: async (updatedTodo: { _id: string, content: string }) => {
          // Cancel any outgoing refetches
          // (so they don't overwrite our optimistic update)

          await queryClient.cancelQueries({
              queryKey: ["listTodo"],
          });


          const previousTodoList = queryClient.getQueryData([
            "listTodo",
          ]);
      
          // filter out the old Todo to list
          const newList = (previousTodoList as Todo[]).filter((todo: Todo) => todo._id !== updatedTodo._id);
          newList.push(updatedTodo);
          // Optimistically update to the new value
          if (previousTodoList) {
            queryClient.setQueryData(["listTodo"], () => newList);
          }

          // Return a context with the new Todo
          return { updatedTodo };
      },
      // If the mutation fails, use the context we returned above
      onError: (err, updatedTodo, context) => {
          console.error("Error updating record:", err, updatedTodo);
      },
      // Always refetch after error or success:
      onSettled: (updatedTodo) => {
          if (updatedTodo) {
              queryClient.invalidateQueries({
                  queryKey: ["listTodo", updatedTodo._id],
              });
            }
            queryClient.invalidateQueries({
                queryKey: ["listTodo"],
            });
      },
  });

  async function deleteTodo(e: React.MouseEvent<HTMLButtonElement, MouseEvent>, id: string) {
    e.stopPropagation();
    deleteMutation.mutate({_id: id});
  }

  const deleteMutation = useMutation({
          mutationFn: async (input: { _id: string }) => {
              const { data } = await client.mutations.deleteTodo(input);
              return data;
          },
          // When mutate is called:
          onMutate: async (deletedTodo) => {
              // Cancel any outgoing refetches
              // (so they don't overwrite our optimistic update)
              await queryClient.cancelQueries({
                  queryKey: ["listTodo", deletedTodo._id],
              });

              await queryClient.cancelQueries({
                  queryKey: ["listTodo"],
              });

              // retrieved the cached list
              const previousTodoList = queryClient.getQueryData([
                "listTodo",
              ]);
          
              // Optimistically remove to the deleted Todo
              if (previousTodoList) {
                // filter out deleted todo 
                const newList = (previousTodoList as Todo[]).filter((todo: Todo) => todo._id !== deletedTodo._id);
                queryClient.setQueryData(["listTodo"], () => newList);
              }

              // Return a context with the previous and new Todo
              return { deletedTodo };
          },
          // If the mutation fails, use the context we returned above
          onError: (err, deletedTodo, context) => {
              console.error("Error deleting record:", err, deletedTodo);
          },
          // Always refetch after error or success:
          onSettled: (deletedTodo) => {
                queryClient.invalidateQueries({
                    queryKey: ["listTodo"],
                });
          },
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["listTodo"] });
          },
      });

  return (
    <Authenticator>
    {({ signOut, user }) => (
      <main>
        <h1>Hello {user?.username}</h1>
        <button onClick={signOut}>Sign out</button>
        <h1>My todos</h1>
        {query.isError && <div>{"Problem loading Todos"}</div>}
        {query.isLoading && (
                    <div style={styles.loadingIndicator}>
                        {"Loading Todos..."}
                    </div>
        )}
        {createMutation.isPending && (
                    <div style={styles.loadingIndicator}>
                        {"Creating New Todo..."}
                    </div>
        )}
         {createMutation.isError && (
                    <div style={styles.loadingIndicator}>
                        {"Error Creating New Todo..."}
                    </div>
        )}
        {query.isSuccess && (
          <div>
              <p>Success!</p>
                      <button onClick={createTodo}>+ new</button>
          <ul>
            {query.data!.map((todo) => {
              if (!todo) return null;
              return (
                <li onClick={() => updateTodo(todo)} key={todo._id}>
                  <button onClick={(event) => deleteTodo(event, todo._id)}>x</button> {todo.content}
                </li>
              )
            })}
          </ul>
          </div>
      )}

        <div>
          🥳 App successfully hosted. Try creating a new todo.
          <br />
          <a href="https://docs.amplify.aws/react/start/quickstart/#make-frontend-updates">
            Review next step of this tutorial.
          </a>
        </div>
      </main>
    )}
  </Authenticator>
  );
}

export default App;

const styles = {

  loadingIndicator: {
      border: "1px solid black",
      padding: "1rem",
      margin: "1rem",
  },

} as const;