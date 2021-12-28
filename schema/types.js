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
        reg_expiry_date: { type: GraphQLString },
        insurance_reg_date: { type: GraphQLString },
        insurance_exp_date: { type: GraphQLString },
        pollution_cert: { type: GraphQLString },
        permit_cert: { type: GraphQLString },
        driver: {
            type: User,
            resolve(parent, args){
                return methods.FindSingleRecord("users", "_id", parent.driver)
            }
        }
    })
})

const Loads = new GraphQLObjectType({
    name: 'Loads',
    description: 'This holds all properties / fields related schema for Loads Object.',
    fields:() => ({
        //description, origin, destination, estimated weight
        _id: { type: GraphQLString },
        load_number: { type: GraphQLString },
        description: { type: GraphQLString },
        origin: { type: GraphQLString },
        destination: { type: GraphQLString },
        estimated_weight: { type: GraphQLString },
        BidOpeningTime: { type: GraphQLString },
        BidClosingTime: { type: GraphQLString },
        BidWinner: {
            type: User,
            resolve(parent, args){
                return methods.FindSingleRecord("users", "_id", parent.BidWinner)
            }
        },
    })
})

module.exports = {
    User, Vehicle, Loads,
}