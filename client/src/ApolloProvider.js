import {
	ApolloClient,
	InMemoryCache,
	ApolloProvider as Provider,
	createHttpLink,
	split,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { getMainDefinition } from '@apollo/client/utilities';
import { WebSocketLink } from '@apollo/client/link/ws';

let httpLink = createHttpLink({
	// uri: '/graphql/',
	uri: 'http://localhost:4000/',
	// credentials: 'include',
});

const authLink = setContext((_, { headers }) => {
	// get the authentication token from local storage if it exists
	const token = localStorage.getItem('token');
	// return the headers to the context so httpLink can read them
	return {
		headers: {
			...headers,
			authorization: token ? `Bearer ${token}` : '',
		},
	};
});

httpLink = authLink.concat(httpLink);

// const host = window.location.host;
const host = 'localhost:4000';

const wsLink = new WebSocketLink({
	// uri: `ws://${host}/graphql/`,
	uri: `ws://localhost:4000/`,
	options: {
		reconnect: true,
		connectionParams: {
			Authorization: `Bearer ${localStorage.getItem('token')}`,
		},
	},
});

const splitLink = split(
	({ query }) => {
		const definition = getMainDefinition(query);
		return (
			definition.kind === 'OperationDefinition' &&
			definition.operation === 'subscription'
		);
	},
	wsLink,
	httpLink
);

console.log(splitLink);

const client = new ApolloClient({
	link: splitLink,
	cache: new InMemoryCache(),
});

export default function ApolloProvider(props) {
	return <Provider client={client} {...props} />;
}
