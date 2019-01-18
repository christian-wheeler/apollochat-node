const { gql } = require('apollo-server');
const typeDefs = gql `

  scalar Date

  type User {
    id: ID!
    name: String!
    handle: String!
    avatar: String!
  }

  type Chat {
    id: ID!
    title: String!
    description: String!
    messages: [Message]!
  }

  type Message {
    id: ID!
    created: Date!
    text: String!
    author: User!
  }
  
  type Query {
    chats: [Chat]
    user(id: String!): User
  }

  type Mutation {
    sendMessage(author: String, text: String, chat: String): Message
    addUser(name: String, handle: String): User
  }

  type Subscription {
    messageAdded: Message
    userAdded: User
  }

`;
module.exports = typeDefs;
//# sourceMappingURL=schema.js.map