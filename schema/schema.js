const graphql = require('graphql'); 
const UserSchema = require('./schemas/user')
const DriverSchema = require('./schemas/driver')
const VehicleSchema = require('./schemas/vehicle')
const LoadsSchema = require('./schemas/loads')

const {
    GraphQLObjectType,
    GraphQLSchema
} = graphql

const RootQuery = new GraphQLObjectType({
    name: 'RootQuery',
    description: "Some Resource requires user's authentication, you can generate authentication code using LoginUser GraphQL endpoint, and pass it to authorization header for more see this https://prnt.sc/1o33ofj",
    fields:() => ({
        ...UserSchema.queries,
        ...DriverSchema.queries,
        ...VehicleSchema.queries,
        ...LoadsSchema.queries
    })
})

const mutation = new GraphQLObjectType({
    name: 'Mutation',
    description: "Some Resource requires user's authentication, you can generate authentication code using LoginUser GraphQL endpoint, and pass it to authorization header for more see this https://prnt.sc/1o33ofj",
    fields:() => ({
        ...UserSchema.mutations,
        ...DriverSchema.mutations,
        ...VehicleSchema.mutations,
        ...LoadsSchema.mutations
    })
})

const subscription = new GraphQLObjectType({
    name: 'Subscription',
    fields:() => ({
        ...UserSchema.subscriptions,
    })
});

module.exports = new GraphQLSchema({
    query: RootQuery,
    mutation: mutation,
    subscription: subscription
})