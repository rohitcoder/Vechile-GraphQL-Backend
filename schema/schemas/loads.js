const graphql = require('graphql')
const { ObjectId } = require('mongodb')
const { methods, GenerateRandomString, ValidateUser } = require('../../core/functions')
const bcrypt = require('bcrypt')
const env = require('dotenv');
env.config({ path: '.env' });  

const {
    GraphQLNonNull,
    GraphQLString,
    GraphQLError,
    GraphQLList,
    GraphQLInt
} = graphql

const { Loads, OutPutMsg, User, BidResult, bidRequests } = require('../types');

const queries = {
    BidWinnings: {
        type: new GraphQLList(BidResult),
        args: {
            limit: { type: GraphQLInt },
            page: { type: GraphQLInt },
        },
        resolve(parent, args, context){
            return ValidateUser(context).then(user => {
                return methods.ListRecords("loads", {}, args.limit, args.page)
            })
        }
    },
    ListLoads: {
        type: new GraphQLList(Loads),
        args: {
            limit: { type: GraphQLInt },
            page: { type: GraphQLInt },
        },
        resolve(parent, args, context) {
            return ValidateUser(context).then(user => {
                return methods.ListRecords('loads', {}, args.limit, args.page)
            })
        }
    },
    BiddersList: {
        type: new GraphQLList(bidRequests),
        args: {
            load_id: { type: new GraphQLNonNull(GraphQLString) },
            limit: { type: GraphQLInt },
            page: { type: GraphQLInt }
        },
        resolve(parent, args, context){
            return ValidateUser(context).then(user => {
                return methods.ListRecords("bidRequests", {
                    load_id: ObjectId(args.load_id)
                }, args.limit, args.page).then(response => {
                    let userIds = []
                    response.map(bid => {
                        userIds.push(bid.bidderId)
                    })
                    return methods.ListRecords("users", {
                        _id: { $in: userIds }
                    }, args.limit, args.page).then(users => {
                        response.map(bid => {
                            users.map(user => {
                                if(user._id.toString() === bid.bidderId.toString()){
                                    bid.bidder = user
                                    bid.bidder.vechicleId = bid.vechicleId
                                    bid.bidder._id = bid.bidderId
                                }
                            })
                            bid._id = bid.bidderId
                        })
                        return response
                    })
                })
            })
        }
    }
}

const mutations = {
    AddLoads: {
        type: Loads,
        args: {
            description: { type: new GraphQLNonNull(GraphQLString) },
            origin: { type: new GraphQLNonNull(GraphQLString) },
            destination: { type: new GraphQLNonNull(GraphQLString) },
            estimated_weight: { type: new GraphQLNonNull(GraphQLString) },
            BidOpeningTime: { type: new GraphQLNonNull(GraphQLString) },
            BidClosingTime: { type: new GraphQLNonNull(GraphQLString) },
        },
        resolve(parent, args, context) {
            return ValidateUser(context).then(user => {
                const user_id = user.user_id;
                const load_number = GenerateRandomString(4);
                return methods.InsertRecord("loads", {
                    load_number,
                    description: args.description,
                    origin: args.origin,
                    destination: args.destination,
                    estimated_weight: args.estimated_weight,
                    BidOpeningTime: args.BidOpeningTime,
                    BidClosingTime: args.BidClosingTime,
                    user_id
                });
            }).catch(err => {
                throw new Error(err)
            })
        }
    },
    AssignLoad: {
        type: OutPutMsg,
        args: {
            load_id: { type: new GraphQLNonNull(GraphQLString) },
            fleetOwner_id: { type: new GraphQLNonNull(GraphQLString) },
            vechicleId: { type: new GraphQLNonNull(GraphQLString) },
        },
        async resolve(parent, args, context) {
            const user = await ValidateUser(context)
            const bidderInfo = await methods.FindRecordByMultipleFields("bidRequests", {
                load_id: ObjectId(args.load_id),
                bidderId: ObjectId(args.fleetOwner_id)
            })
            if(!bidderInfo){
                // This biddin wasn't found, lets bid on this automatically
                await methods.InsertRecord("bidRequests", {
                    load_id: ObjectId(args.load_id),
                    bidderId: ObjectId(args.fleetOwner_id),
                    vechicleId: ObjectId(args.vechicleId)
                })
            }
            const resp = await methods.UpdateRecord("loads", {
                _id: args.load_id,
            },
            {
                fleetOwner_id: ObjectId(args.fleetOwner_id),
                vechicleId: bidderInfo.vechicleId ? ObjectId(bidderInfo.vechicleId) : null
            }).then(res=>{
                if(res){
                    await methods.DeleteRecord("MasterQueue", {
                        vechicleId: ObjectId(bidderInfo.vechicleId),
                    }).then(res => {
                        await methods.InsertRecord("MasterQueue", {
                            user_id: ObjectId(args.fleetOwner_id),
                            load_id: ObjectId(args.load_id),
                            vechicleId: bidderInfo.vechicleId ? ObjectId(bidderInfo.vechicleId) : null
                        })
                    })
                    return {
                        message: "Assigned Load Successfully",
                        status: "success"
                    }
                }else{
                    return {
                        message: "Unable to assign Load Successfully",
                        status: "error"
                    }
                }
            })
            return resp
        }
    },
    BidOnLoad: {
        type: OutPutMsg,
        args: {
            load_id: { type: new GraphQLNonNull(GraphQLString)  },
            vechicleId: { type: GraphQLString },
        },
        resolve(parent, args, context){
            return ValidateUser(context).then(user => {
                if(args.vechicleId.trim() === ""){
                    throw new Error("Vechicle Id is required")
                }
                return methods.FindRecordByMultipleFields("bidRequests", {
                    load_id: ObjectId(args.load_id),
                    bidderId: ObjectId(user.user_id)
                }).then(resp => {
                    if(resp){
                        throw new Error("You already bidded for this load")
                    }else{
                         return methods.InsertRecord("bidRequests", {
                            load_id: ObjectId(args.load_id),
                            bidderId: ObjectId(user.user_id),
                            vechicleId: ObjectId(args.vechicleId)
                         }).then(response=>{
                            if(response){
                                return {
                                    message: "Bid was Successful!",
                                    status: true
                                }
                            }else{
                                return {
                                    message: "Unable to Bid!",
                                    status: false
                                }
                            }
                         })
                    }
                })
            })
        }
    }
}

module.exports = {
    queries,
    mutations
}