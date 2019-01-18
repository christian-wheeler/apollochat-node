"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const apollo_server_1 = require("apollo-server");
const resolvers_1 = require("./resolvers");
// Apollo Server
const typeDefs = require('./schema');
const server = new apollo_server_1.ApolloServer({ typeDefs, resolvers: resolvers_1.resolvers, playground: true, introspection: true /* mocks: true, */ });
const port = process.env.PORT || 8080;
server.listen(port).then(({ url }) => {
    console.log(`🚀 Server ready at ${url}`);
});
//# sourceMappingURL=index.js.map