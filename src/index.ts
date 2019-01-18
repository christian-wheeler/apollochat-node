import { ApolloServer } from 'apollo-server'
import { resolvers } from './resolvers'

// Apollo Server

const typeDefs = require('./schema')

const server = new ApolloServer({ typeDefs, resolvers, playground: true, introspection: true /* mocks: true, */ })

const port = process.env.PORT || 8080
server.listen(port).then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`)
})