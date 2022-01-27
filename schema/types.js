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
        _id: { type: GraphQLString },
        name: { 
            type: GraphQLString,
            resolve(parent, args) {
                return `${parent.firstName} ${parent.lastName}`
            }
        },
        phone: { type: GraphQLString},
        auth_token: { type: GraphQLString},
        vehicles: {
            type: new GraphQLList(Vehicle),
            args: {
                limit: { type: GraphQLInt },
                page: { type: GraphQLInt }
            },
            resolve(parent, args) {
                return methods.ListRecords("vehicles", {"fleetOwner": parent._id.toString() }, args.limit, args.page)
            }
        }
    })
})

const Vehicle = new GraphQLObjectType({
    name: 'Vehicle',
    description: 'This holds all properties / fields related schema for Vehicle Object.',
    fields:() => ({
        _id: { type: GraphQLString },
        vehicleNumber: { type: GraphQLString },
        vehicleType: { type: GraphQLString },
        vehicleModel: { type: GraphQLString },
        regExpiryDate: { type: GraphQLString },
        insuranceRegDate: { type: GraphQLString },
        insuranceExpDate: { type: GraphQLString },
        pollutionCert: { type: GraphQLString },
        permitCert: { type: GraphQLString },
        fleetOwner: {
            type: User,
            resolve(parent, args){
                return methods.FindSingleRecord("users", "_id", parent.fleetOwner)
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
                return parent.BidWinner ? methods.FindSingleRecord("users", "_id", parent.BidWinner) : null
            }
        },
    })
})

const OutPutMsg = new GraphQLObjectType({
    name: 'OutPutMsg',
    description: 'This is desc',
    fields:() => ({
        status: { type: GraphQLString },
        message: { type: GraphQLString }
    })
})

module.exports = {
    User, Vehicle, Loads, OutPutMsg,
}