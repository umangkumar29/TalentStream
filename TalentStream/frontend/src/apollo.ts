import { ApolloClient, InMemoryCache, HttpLink, split } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { getMainDefinition } from '@apollo/client/utilities';

// We'll pass the token to this function when creating the client
export const createApolloClient = (token: string | null) => {
  const HASURA_ENDPOINT = import.meta.env.VITE_HASURA_ENDPOINT || 'http://localhost:8080/v1/graphql';
  const HASURA_WS_ENDPOINT = import.meta.env.VITE_HASURA_WS_ENDPOINT || 'ws://localhost:8080/v1/graphql';
  const HASURA_ADMIN_SECRET = import.meta.env.VITE_HASURA_ADMIN_SECRET || '';

  const headers: Record<string, string> = {};
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else if (HASURA_ADMIN_SECRET) {
    // Fallback to admin secret for development if no token
    headers['x-hasura-admin-secret'] = HASURA_ADMIN_SECRET;
  }

  const httpLink = new HttpLink({
    uri: HASURA_ENDPOINT,
    headers,
  });

  const wsLink = new GraphQLWsLink(
    createClient({
      url: HASURA_WS_ENDPOINT,
      connectionParams: {
        headers,
      },
    })
  );

  const splitLink = split(
    ({ query }) => {
      const definition = getMainDefinition(query);
      return definition.kind === 'OperationDefinition' && definition.operation === 'subscription';
    },
    wsLink,
    httpLink
  );

  return new ApolloClient({
    link: splitLink,
    cache: new InMemoryCache(),
  });
};
