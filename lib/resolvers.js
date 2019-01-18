"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const admin = require("firebase-admin");
const apollo_server_1 = require("apollo-server");
// Initialise Firebase
const serviceAccount = require('../service-account.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
admin.firestore().settings({ timestampsInSnapshots: true });
// Apollo Resolvers
const pubsub = new apollo_server_1.PubSub();
const MESSAGE_ADDED = 'MESSAGE_ADDED';
const USER_ADDED = 'USER_ADDED';
const { GraphQLScalarType } = require('graphql');
const { Kind } = require('graphql/language');
exports.resolvers = {
    Subscription: {
        messageAdded: {
            // Additional event labels can be passed to asyncIterator creation
            subscribe: () => pubsub.asyncIterator([MESSAGE_ADDED]),
        },
        userAdded: {
            // Additional event labels can be passed to asyncIterator creation
            subscribe: () => pubsub.asyncIterator([USER_ADDED]),
        },
    },
    Mutation: {
        async sendMessage(root, args, context) {
            const id = admin.firestore().collection('messages').doc().id;
            const message = {
                id: id,
                created: new Date(),
                updated: new Date(),
                author: args.author,
                text: args.text,
                chat: args.chat
            };
            await admin.firestore().collection('messages').doc(id).set(message);
            const author = await admin.firestore().doc(`users/${message.author}`).get();
            const added = Object.assign({}, message, { author: author });
            pubsub.publish(MESSAGE_ADDED, { messageAdded: added });
            return message;
        },
        async addUser(root, args, context) {
            const id = admin.firestore().collection('users').doc().id;
            const user = {
                id: id,
                created: new Date(),
                updated: new Date(),
                name: args.name,
                handle: args.handle,
                avatar: ''
            };
            await admin.firestore().collection('users').doc(id).set(user);
            pubsub.publish(USER_ADDED, { userAdded: user });
            return user;
        }
    },
    Query: {
        async chats() {
            const chats = await admin.firestore().collection('chats').get();
            return chats.docs.map(chat => chat.data());
        },
        async user(_, args) {
            try {
                const userDoc = await admin.firestore().doc(`users/${args.id}`).get();
                const user = userDoc.data();
                return user || new apollo_server_1.ValidationError('User not found');
            }
            catch (error) {
                throw new apollo_server_1.ApolloError(error);
            }
        }
    },
    Chat: {
        async messages(chat) {
            try {
                const messages = await admin.firestore().collection('messages').where('chat', '==', chat.id).get();
                const raw = messages.docs.map(message => message.data());
                return raw.map(data => {
                    return Object.assign({}, data);
                });
            }
            catch (error) {
                throw new apollo_server_1.ApolloError(error);
            }
        }
    },
    Message: {
        async author(message) {
            try {
                const author = await admin.firestore().doc(`users/${message.author}`).get();
                return author.data();
            }
            catch (error) {
                throw new apollo_server_1.ApolloError(error);
            }
        }
    },
    Date: new GraphQLScalarType({
        name: 'Date',
        description: 'Date custom scalar type',
        parseValue(value) {
            return new Date(value); // value from the client
        },
        serialize(value) {
            return value.toDate().getTime(); // value sent to the client
        },
        parseLiteral(ast) {
            if (ast.kind === Kind.INT) {
                return parseInt(ast.value, 10); // ast value is always in string format
            }
            return null;
        },
    })
};
//# sourceMappingURL=resolvers.js.map