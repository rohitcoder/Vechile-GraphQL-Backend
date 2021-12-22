const graphql = require('graphql')
const { GraphQLJSON } = require('graphql-type-json')
const { methods } = require('../core/functions')
const env = require('dotenv');
const { ObjectId } = require('mongodb')
env.config({ path: '.env' });  

const {
    GraphQLObjectType,
    GraphQLString, 
    GraphQLList,
    GraphQLInt,
    GraphQLNonNull,
    GraphQLBoolean
} = graphql

const User = new GraphQLObjectType({
    name: 'User',
    description: 'This holds all properties / fields related schema for User Object.',
    fields:() => ({
        _id: { type: GraphQLString},
        name: { 
            type: GraphQLString,
            resolve(parent, args) {
                return `${parent.firstName} ${parent.lastName}`
            }
        },
        phone: { type: GraphQLString},
        auth_token: { type: GraphQLString},
    })
})

const Vehicle = new GraphQLObjectType({
    name: 'Vehicle',
    description: 'This holds all properties / fields related schema for Vehicle Object.',
    fields:() => ({
        _id: { type: GraphQLString },
        vehicle_number: { type: GraphQLString },
        vehicle_type: { type: GraphQLString },
        vehicle_model: { type: GraphQLString },
        driver: {
            type: User,
            resolve(parent, args){
                return methods.FindSingleRecord("users", "_id", parent.driver)
            }
        }
    })
})



module.exports = {
    User, Vehicle,
}