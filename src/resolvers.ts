import * as admin from 'firebase-admin'
import { firestore } from 'firebase-admin';
import { ApolloError, ValidationError, PubSub } from 'apollo-server'

// Initialise Firebase

const serviceAccount = require('../service-account.json')
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
admin.firestore().settings({ timestampsInSnapshots: true })

// Apollo Resolvers

const pubsub = new PubSub()
const MESSAGE_ADDED = 'MESSAGE_ADDED'
const USER_ADDED = 'USER_ADDED'

const { GraphQLScalarType } = require('graphql')
const { Kind } = require('graphql/language')

export const resolvers = {
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
      async sendMessage(root: any, args: any, context: any) {
        const id = admin.firestore().collection('messages').doc().id
        const message: Message = {
            id: id,
            created: new Date(),
            updated: new Date(),
            author: args.author,
            text: args.text,
            chat: args.chat
        }

        await admin.firestore().collection('messages').doc(id).set(message)
        const author = await admin.firestore().doc(`users/${message.author}`).get()
        const added = { ...message, author: author }

        pubsub.publish(MESSAGE_ADDED, { messageAdded: added })
        return message
      },
      async addUser(root: any, args: any, context: any) {
        const id = admin.firestore().collection('users').doc().id
        const user: User = {
            id: id,
            created: new Date(),
            updated: new Date(),
            name: args.name,
            handle: args.handle,
            avatar: ''
        }
        await admin.firestore().collection('users').doc(id).set(user)
        pubsub.publish(USER_ADDED, { userAdded: user })
        return user
      }
    },
    Query: {
      async chats() {
        const chats = await admin.firestore().collection('chats').get()
        return chats.docs.map(chat => chat.data()) as Chat[]
      },
      async user(_: null, args: { id: string }) {
        try {
          const userDoc = await admin.firestore().doc(`users/${args.id}`).get()
          const user = userDoc.data() as User | undefined
          return user || new ValidationError('User not found')
        } 
        catch (error) {
          throw new ApolloError(error)
        }
      }
    },
    Chat: {
      async messages(chat) {
        try {
          const messages = await admin.firestore().collection('messages').where('chat', '==', chat.id).get()
          const raw = messages.docs.map(message => message.data())
          return raw.map(data => {
            return {
              ...data,
              // created: (data.created as firestore.Timestamp).toDate().getTime()
            }
          })
        } 
        catch (error) {
          throw new ApolloError(error)
        }
      }
    },
    Message: {
      async author(message) {
        try {
          const author = await admin.firestore().doc(`users/${message.author}`).get()
          return author.data() as User
        }
        catch (error) {
          throw new ApolloError(error)
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
        return (value as firestore.Timestamp).toDate().getTime(); // value sent to the client
      },
      parseLiteral(ast) {
        if (ast.kind === Kind.INT) {
          return parseInt(ast.value, 10); // ast value is always in string format
        }
        return null;
      },
    })
  }

// Firebase Type Definitions

interface Entity {
    id: string
    created: Date
    updated: Date
}

interface User extends Entity {
    name: string
    handle: string
    avatar: string
}

interface Chat extends Entity {
    title: string
    description: string
}

interface Message extends Entity {
    text: string
    author: string
    chat: string
}