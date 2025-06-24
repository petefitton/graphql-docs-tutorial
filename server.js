import { buildSchema } from 'graphql';
import { createHandler } from 'graphql-http/lib/use/express';
import express from 'express';
import { ruruHTML } from 'ruru/server';
import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLFloat,
  GraphQLList,
  GraphQLNonNull,
  GraphQLInterfaceType,
  GraphQLInputObjectType,
  GraphQLUnionType
} from 'graphql';
 
const fakeDatabase = {
  messages: [],
  articles: []
};


class ArticleClass {
  constructor(id, { title, bodyText }) {
    this.id = id;
    this.title = title;
    this.bodyText = bodyText;
  }
}



// const SearchResultType = new GraphQLUnionType({
//   name: 'SearchResult',
//   types: [BookType, AuthorType, PublisherType],
//   resolveType(value, context, info) {
//     console.log(value);
//     console.log(context);
//     console.log(info);
//     if (value.isbn) {
//       return 'Book';
//     }
//     if (value.bio) {
//       return 'Author';
//     }
//     if (value.catalogSize) {
//       return 'Publisher';
//     }
//     return null;
//   },
// });


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
 
const Article = new GraphQLObjectType({
  name: 'Article',
  interfaces: [ContentItemInterface],
  fields: {
    id: { type: new GraphQLNonNull(GraphQLString) },
    title: { type: GraphQLString },
    publishedAt: { type: GraphQLString },
    bodyText: { type: GraphQLString },
  },
  // isTypeOf is a fallback for the resolveType function from the interface and is optional
  isTypeOf: (value) => value.bodyText !== undefined,
});

const ArticleInput = new GraphQLInputObjectType({
  name: 'ArticleInput',
  // interfaces: [ContentItemInterface],
  fields: {
    title: { type: GraphQLString },
    publishedAt: { type: GraphQLString },
    bodyText: { type: GraphQLString },
  },
  // isTypeOf is a fallback for the resolveType function from the interface and is optional
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





const schemaJS = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'Query',
    fields: {
      quoteOfTheDay: { 
        type: GraphQLString,
        resolve: () => Math.random() < 0.5 ? 'Take it easy' : 'Salvation lies within'
      },
      random: { 
        type: GraphQLFloat,
        resolve: () => Math.random()
      },
      rollThreeDice: { 
        type: new GraphQLList(GraphQLFloat),
        resolve: () => [1, 2, 3].map((_) => 1 + Math.floor(Math.random() * 6))
      },
      rollDice: {
        type: new GraphQLList(GraphQLFloat),
        args: {
          numDice: {
            type: new GraphQLNonNull(GraphQLInt)
          },
          numSides: {
            type: new GraphQLNonNull(GraphQLInt)
          },
        },
        resolve: (_, { numDice, numSides }) => {
          const output = [];
          for (let i = 0; i < numDice; i++) {
            output.push(1 + Math.floor(Math.random() * (numSides || 6)));
          }
          return output;
        }
      },
      getArticle: {
        type: Article,
        args: {
          id: { type: new GraphQLNonNull(GraphQLString) },
        },
        resolve: (_, args) => {
          console.log("args", args)
          let stringId = String(args.id);
          if (!fakeDatabase.articles[stringId]) {
            throw new Error('no message exists with id ' + args.id);
          }
          return fakeDatabase.articles[stringId] ? {
            id: fakeDatabase.articles[id].id,
            title: fakeDatabase.articles[id].title,
            bodyText: fakeDatabase.articles[id].bodyText,
            // content: fakeDatabase.articles[id].content,
            // author: fakeDatabase.articles[id].author,
          } : null;
        }
      },
      getArticles: {
        type: new GraphQLList(Article),
        resolve: () => {
          console.log("starting resolver")
          console.log(fakeDatabase.articles.length)
          if (!fakeDatabase.articles.length) {
            console.log("fakeDatabase1:", fakeDatabase)
            throw new Error('no articles exist');
          }
          return fakeDatabase.articles
          // const output = [];
          // for (let i = 0; i < fakeDatabase.articles.length; i++) {
          //   console.log("iterating over list")
          //   output.push(fakeDatabase.articles[i]);
          // }
          // console.log("output:", output)
          // return output
        }
      }
    },
  }),
  mutation: new GraphQLObjectType({
    name: 'Mutation',
    fields: {
      createArticle: {
        type: Article,
        args: {
          input: { type: new GraphQLNonNull(ArticleInput) },
        },
        // resolve: (_, { title, bodyText }) => {
        //   const id = String(Object.keys(fakeDatabase.articles).length + 1)
        //   const article = new ArticleClass(id)
        //   fakeDatabase.articles[id] = article
        //   return article
        // }
        resolve: (_, args) => {
          // Create a random id for our "database".
          // import { randomBytes } from 'crypto';
          // const id = randomBytes(10).toString('hex');
          console.log("this is the input: ", args.input);
          const id = String(Object.keys(fakeDatabase.articles).length)
          let newArticle = args.input;
          newArticle.id = id;
          fakeDatabase.articles[id] = newArticle;
          console.log("this is the fakeDatabase2: ", fakeDatabase);
          return {
            id,
            title: args.input.title,
            bodyText: args.input.bodyText,
          };
        }
      }
    }
  }),
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
const schemaSDL = buildSchema(`
  type Query {
    hello: String
    quoteOfTheDay: String
    random: Float!
    rollThreeDice: [Int]
    rollDice(numDice: Int!, numSides: Int): [Int]
    getDie(numSides: Int): RandomDie
    getMessage(id: ID!): Message
    getMessages: [Message]
    getArticle(id: ID!): Article
  }
  type RandomDie {
    numSides: Int!
    rollOnce: Int!
    roll(numRolls: Int!): [Int]
  }
  type Mutation {
    createMessage(input: MessageInput): Message
    updateMessage(id: ID!, input: MessageInput): Message
    createArticle(input: ArticleInput): Article
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
  input ArticleInput {
    title: String
    bodyText: String
  }
  type Article {
    id: ID!
    title: String
    publishedAt: String
    bodyText: String
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
		return fakeDatabase.messages[id]
	},
	getMessages: () => {
		return Object.values(fakeDatabase.messages)
	},
	createMessage: ({ input }) => {
		const id = String(Object.keys(fakeDatabase.messages).length + 1)
		const message = new Message(id, input)
		fakeDatabase[id] = message
		return message
	},
	updateMessage: ({ id, input }) => {
		const message = fakeDatabase[id]
		Object.assign(message, input)
		return message
	},
  createArticle: ({ input }) => {
    const id = String(Object.keys(fakeDatabase.articles).length + 1)
		const article = new Article(id)
		fakeDatabase.articles[id] = article
		return article
  }
};

const app = express();
 
// Create and use the GraphQL handler.
app.all(
  '/graphql',
  createHandler({
    // schema: schemaWithUserError,
    // schema: schemaWithProductError,
    // schema: schema,
    schema: schemaJS,
    // root needed when using SDL and not JS version of schema
    // rootValue: root,
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
  query RollDice($dice: Int!, $sides: Int!) {
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








const title = 'Hope...';
const bodyText = '...is a good thing';
query = /* GraphQL */ `
  mutation CreateArticle($input: ArticleInput!) {
    createArticle(input: $input) {
      id
      title
      bodyText
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
        title,
        bodyText,
      },
    },
  }),
})
  .then((r) => r.json())
  .then((data) => console.log('data returned:', data));


const id = "0";
query = /* GraphQL */ `
  query GetArticle($id: String!) {
    getArticle(id: $id) {
      title
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
      // input: {
        id
      // },
    },
  }),
})
  .then((r) => r.json())
  .then((data) => console.log('data returned:', data));





query = /* GraphQL */ `
  query GetArticles() {
    getArticles
  }
`;
 
fetch('http://localhost:4000/graphql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  body: JSON.stringify({
    query: '{ getArticles { id, title, bodyText } }'
  }),
})
  .then((r) => r.json())
  .then((data) => {console.log('data returned:', data); console.log('data.data.getArticles', data.data.getArticles)});



  // TODO: Find out where this is supposed to go
//   query Search($term: String! = "deep learning") {
//   search(term: $term) {
//     # Inline fragments with type condition:
//     ... on Book {
//       title
//       isbn
//     }
//     ... on Author {
//       name
//       bio
//     }
//     # Named fragment:
//     ...publisherFrag
//   }
// }
 
// fragment publisherFrag on Publisher {
//   name
//   catalogSize
// }