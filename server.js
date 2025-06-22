import { buildSchema } from 'graphql';
import { createHandler } from 'graphql-http/lib/use/express';
import express from 'express';
import { ruruHTML } from 'ruru/server';
import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLInterfaceType,
} from 'graphql';
 
const ContentItemInterface = new GraphQLInterfaceType({
  name: 'ContentItem',
  fields: {
    id: { type: new GraphQLNonNull(GraphQLString) },
    title: { type: GraphQLString },
    publishedAt: { type: GraphQLString },
  },
  resolveType(value) {
    if (value.audioUrl) {
      return 'PodcastEpisode';
    }
    if (value.bodyText) {
      return 'Article';
    }
    return null;
  },
});
 
const ArticleType = new GraphQLObjectType({
  name: 'Article',
  interfaces: [ContentItemInterface],
  fields: {
    id: { type: new GraphQLNonNull(GraphQLString) },
    title: { type: GraphQLString },
    publishedAt: { type: GraphQLString },
    bodyText: { type: GraphQLString },
  },
  isTypeOf: (value) => value.bodyText !== undefined,
});
 
const PodcastEpisodeType = new GraphQLObjectType({
  name: 'PodcastEpisode',
  interfaces: [ContentItemInterface],
  fields: {
    id: { type: new GraphQLNonNull(GraphQLString) },
    title: { type: GraphQLString },
    publishedAt: { type: GraphQLString },
    audioUrl: { type: GraphQLString },
  },
  // isTypeOf is a fallback for the resolveType function from the interface and is optional
  isTypeOf: (value) => value.audioUrl !== undefined,
});




const UserType = new GraphQLObjectType({
  name: 'User',
  fields: {
    id: { type: new GraphQLNonNull(GraphQLString) },
  },
});
 
const UserQueryType = new GraphQLObjectType({
  name: 'Query',
  fields: {
    user: {
      type: UserType,
      resolve: () => ({ id: null }),
    },
  },
});

const ProductType = new GraphQLObjectType({
  name: 'Product',
  fields: {
    name: { type: new GraphQLNonNull(GraphQLString) },
  },
});
 
const ProductQueryType = new GraphQLObjectType({
  name: 'Query',
  fields: {
    product: {
      type: ProductType,
      resolve: () => ({ name: null }),
    },
  },
});

const schemaWithUserError = new GraphQLSchema({ query: UserQueryType });

const schemaWithProductError = new GraphQLSchema({ query: ProductQueryType });

// Construct a schema, using GraphQL schema language
const schema = buildSchema(`
  type Query {
    hello: String
    quoteOfTheDay: String
    random: Float!
    rollThreeDice: [Int]
    rollDice(numDice: Int!, numSides: Int): [Int]
    getDie(numSides: Int): RandomDie
    getMessage(id: ID!): Message
    getMessages: [Message]
  }
  type RandomDie {
    numSides: Int!
    rollOnce: Int!
    roll(numRolls: Int!): [Int]
  }
  type Mutation {
    createMessage(input: MessageInput): Message
    updateMessage(id: ID!, input: MessageInput): Message
  }
  input MessageInput {
    content: String
    author: String
  }
  type Message {
    id: ID!
    content: String
    author: String
  }
`);

// This class implements the RandomDie GraphQL type
class RandomDie {
  constructor(numSides) {
    this.numSides = numSides;
  }
 
  rollOnce() {
    return 1 + Math.floor(Math.random() * this.numSides);
  }
 
  roll({ numRolls }) {
    const output = [];
    for (let i = 0; i < numRolls; i++) {
      output.push(this.rollOnce());
    }
    return output;
  }
}

// If Message had any complex fields, we'd put them on this object.
class Message {
  constructor(id, { content, author }) {
    this.id = id;
    this.content = content;
    this.author = author;
  }
}
 
const fakeDatabase = {};

// The root provides a resolver function for each API endpoint
const root = {
  hello() {
    return 'Hello world!';
  },
  quoteOfTheDay() {
    return Math.random() < 0.5 ? 'Take it easy' : 'Salvation lies within';
  },
  random() {
    return Math.random();
  },
  rollThreeDice() {
    return [1, 2, 3].map((_) => 1 + Math.floor(Math.random() * 6));
  },
  // rollDice(args) {
  //   const output = [];
  //   for (let i = 0; i < args.numDice; i++) {
  //     output.push(1 + Math.floor(Math.random() * (args.numSides || 6)));
  //   }
  //   return output;
  // },
  rollDice({ numDice, numSides }) {
    const output = [];
    for (let i = 0; i < numDice; i++) {
      output.push(1 + Math.floor(Math.random() * (numSides || 6)));
    }
    return output;
  },
  getDie({ numSides }) {
    return new RandomDie(numSides || 6);
  },
  // setMessage({ message }) {
  //   fakeDatabase.message = message;
  //   return message;
  // },
  // getMessage() {
  //   return fakeDatabase.message;
  // },
  getMessage: ({ id }) => {
		return fakeDatabase[id]
	},
	getMessages: () => {
		return Object.values(fakeDatabase)
	},
	createMessage: ({ input }) => {
		const id = String(Object.keys(fakeDatabase).length + 1)
		const message = new Message(id, input)
		fakeDatabase[id] = message
		return message
	},
	updateMessage: ({ id, input }) => {
		const message = fakeDatabase[id]
		Object.assign(message, input)
		return message
	}
};

const app = express();
 
// Create and use the GraphQL handler.
app.all(
  '/graphql',
  createHandler({
    // schema: schemaWithUserError,
    // schema: schemaWithProductError,
    schema: schema,
    rootValue: root,
  }),
);

// Serve the GraphiQL IDE.
app.get('/', (_req, res) => {
  res.type('html');
  res.end(ruruHTML({ endpoint: '/graphql' }));
});
 
// Start the server at port
app.listen(4000);
console.log('Running a GraphQL API server at http://localhost:4000/graphql');





fetch('http://localhost:4000/graphql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  body: JSON.stringify({ query: '{ quoteOfTheDay }' }),
})
  .then((r) => r.json())
  .then((data) => console.log('data returned:', data));






const dice = 3;
const sides = 6;
let query = /* GraphQL */ `
  query RollDice($dice: Int!, $sides: Int) {
    rollDice(numDice: $dice, numSides: $sides)
  }
`;
 
fetch('http://localhost:4000/graphql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  body: JSON.stringify({
    query,
    variables: { dice, sides },
  }),
})
  .then((r) => r.json())
  .then((data) => console.log('data returned:', data));






const author = 'andy';
const content = 'hope is a good thing';
query = /* GraphQL */ `
  mutation CreateMessage($input: MessageInput) {
    createMessage(input: $input) {
      id
    }
  }
`;
 
fetch('http://localhost:4000/graphql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  body: JSON.stringify({
    query,
    variables: {
      input: {
        author,
        content,
      },
    },
  }),
})
  .then((r) => r.json())
  .then((data) => console.log('data returned:', data));





// example error using schemaWithUserError
fetch('http://localhost:4000/graphql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  body: JSON.stringify({ query: '{ user { id } }' }),
})
  .then((r) => r.json())
  .then((data) => console.log('data returned:', data));





// example error using schemaWithProductError
fetch('http://localhost:4000/graphql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  body: JSON.stringify({ query: '{ product { name } }' }),
})
  .then((r) => r.json())
  .then((data) => console.log('data returned:', data));






