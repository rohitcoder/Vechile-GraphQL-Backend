const graphql = require('graphql')
const { GraphQLJSON } = require('graphql-type-json')
const { methods, ValidateUser } = require('../core/functions')
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

const BidResult = new GraphQLObjectType({
    name: 'BidResult',
    fields:() => ({
        _id: { type: GraphQLString },
        bidRequests: { 
            type: new GraphQLList(User),
            args: {
                limit: { type: GraphQLInt },
                page: { type: GraphQLInt },
            },
            resolve(parent, args){
                return methods.ListRecords("bidRequests", {
                    load_id: ObjectId(parent._id)
                }, args.limit, args.page).then(response => {
                    let userIds = []
                    response.map(bid => {
                        userIds.push(bid.bidderId)
                    })
                    return methods.FindMultipleRecord('users', "_id", userIds)
                })
            }
        },
        BidWinner: {
            type: User,
            resolve(parent, args){
                return parent.fleetOwner_id ? methods.FindSingleRecord("users", "_id", parent.fleetOwner_id) : null
            }
        },
        loadDetails: {
            type: Loads,
            resolve(parent, args){
                return methods.FindSingleRecord("loads", "_id", parent._id)
            }
        }
    })
})

const bidRequests = new GraphQLObjectType({
    name: 'bidRequests',
    description: 'This holds all properties / fields related schema for bidRequests object',
    fields:() => ({
        _id: { type: GraphQLString },
        name: { 
            type: GraphQLString,
            resolve(parent, args) {
                return `${parent.bidder.firstName} ${parent.bidder.lastName}`
            }
        },
        phone: {
            type: GraphQLString,
            resolve(parent, args) {
                return parent.bidder.phone
            }
        },
        biddedVehicle: {
            type: Vehicle,
            async resolve(parent, args, context){
                parent.vechicleId = parent.vechicleId ? parent.vechicleId : 0
                let data = await methods.FindSingleRecord("vehicles", "_id", parent.vechicleId)
                return data
            }
        },
    })
})

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
        },
        type: { type: GraphQLString },
        lastVechileInfo: {
            type: Vehicle,
            resolve(parent, args){
                return methods.ListRecords("loads", {
                    "fleetOwner_id": parent._id,
                }, 1, 0, {}).then(response => {
                    return response[0] ? methods.FindSingleRecord("vehicles", "_id", response[0].vechicleId) : {}
                })
            }
        },
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
        },
        MasterQueuePosition: {
            type: GraphQLInt,
            async resolve(parent, args){
                let MasterQueue = await methods.ListRecords("MasterQueue", {}, 100000, 0)
                // iterate through the master queue and find the position of the vehicle
                let position = 0
                MasterQueue.map((record, index) => {
                    const vechicleId = record.vechicleId ? record.vechicleId.toString() : undefined
                    const parentVechicleId = parent._id.toString()
                    if(vechicleId == parentVechicleId){
                        position = index + 1
                    }
                })
                return position
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
        orderType: {
            type: GraphQLString,
            async resolve(parent, args, context){
                const auth = await ValidateUser(context)
                const bidRequests = await methods.FindRecordByMultipleFields("bidRequests", {
                    "load_id": ObjectId(parent._id),
                    "bidderId": ObjectId(auth.user_id)
                })
                if(!bidRequests){
                    return "YET_TO_BID"
                }else if(bidRequests && !parent.fleetOwner_id){
                    return "RESULT_YET_TO_DECLARED"
                }else if(parent.fleetOwner_id && auth.user_id == parent.fleetOwner_id.toString()){
                    return "I_AM_WINNER"
                }else if(parent.fleetOwner_id){
                    return "I_AM_NOT_WINNER"
                }
            }
        },
        BidWinner: {
            type: User,
            resolve(parent, args){
                return parent.fleetOwner_id ? methods.FindSingleRecord("users", "_id", parent.fleetOwner_id) : null
            }
        },
        BidWinnerVehicle: {
            type: Vehicle,
            resolve(parent, args){
                return parent.vechicleId ? methods.FindSingleRecord("vehicles", "_id", parent.vechicleId) : null
            }
        },
        isBiddedByMe: {
            type: GraphQLBoolean,
            resolve(parent, args, context){
                return ValidateUser(context).then(user => {
                    return methods.FindRecordByMultipleFields("bidRequests", {
                        load_id: ObjectId(parent._id),
                        bidderId: ObjectId(user.user_id)
                    }).then(resp => {
                        if(resp){
                            return true
                        }
                        return false
                    })
                })
            }       
        }
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
    User, Vehicle, Loads, OutPutMsg, BidResult, bidRequests,
}