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

const { Vehicle } = require('../types');

const queries = {
    getVehicle:{
        type: Vehicle,
        args: {
            id: { type: new GraphQLNonNull(GraphQLString) }
        },
        resolve: async (parent, args, context) => {
            return ValidateUser(context).then(async (auth) => {
                if (!auth) {
                    throw new Error('You are not authorized to perform this action')
                }
                return methods.FindSingleRecord("vehicles", "_id", ObjectId(args.id))
            })
        }
    },
    VehiclesList: {
        type: new GraphQLList(Vehicle),
        args: {
            limit: { type: GraphQLInt },
            page: { type: GraphQLInt }
        },
        resolve: async (parent, args, context) => {
            return ValidateUser(context).then(async (auth) => {
                if (!auth) {
                    throw new Error('You are not authorized to perform this action')
                }
                return methods.ListRecords("vehicles", {}, args.limit, args.page).then(vehicles => {
                    return vehicles
                })
            })
        }
    }
}

const mutations = {
    AddVehicle: {
        type: Vehicle,
        args: {
            vehicleNumber: { type: new GraphQLNonNull(GraphQLString) },
            vehicleType: { type: new GraphQLNonNull(GraphQLString) },
            vehicleModel: { type: new GraphQLNonNull(GraphQLString) },
            regExpiryDate: { type: new GraphQLNonNull(GraphQLString) },
            insuranceRegDate: { type: new GraphQLNonNull(GraphQLString) },
            insuranceExpDate: { type: new GraphQLNonNull(GraphQLString) },
            pollutionCert: { type: new GraphQLNonNull(GraphQLString) },
            permitCert: { type: new GraphQLNonNull(GraphQLString) },
            fleetOwner: { type: new GraphQLNonNull(GraphQLString) },
        },
        resolve: async (parent, args, context) => {
            return ValidateUser(context).then(async (auth) => {
                if (!auth) {
                    throw new GraphQLError('You are not authorized to perform this action')
                }
                return new Promise((resolve, reject) => {
                    return methods.FindSingleRecord("vehicles", "vehicleNumber", args.vehicleNumber).then(async (vehicle) => {
                        if (vehicle) {
                            reject('Vehicle already exists')
                        }else{
                            const joinedTime = new Date().getTime()
                            const otherData = { "JoinedTime": joinedTime }
                            return methods.InsertRecord("vehicles", Object.assign(args, otherData)).then(() => {
                                return methods.FindSingleRecord("vehicles", "vehicleNumber", args.vehicleNumber).then(async (vehicle) => {
                                    resolve(vehicle)
                                })
                            })
                        }
                    })
                }).catch(err => {
                    throw new Error(err)
                })
            })
        }
    },
    EditVehicle: {
        type: Vehicle,
        args: {
            _id: { type: new GraphQLNonNull(GraphQLString) },
            vehicleNumber: { type: new GraphQLNonNull(GraphQLString) },
            vehicleType: { type: new GraphQLNonNull(GraphQLString) },
            vehicleModel: { type: new GraphQLNonNull(GraphQLString) },
            regExpiryDate: { type: new GraphQLNonNull(GraphQLString) },
            insuranceRegDate: { type: new GraphQLNonNull(GraphQLString) },
            insuranceExpDate: { type: new GraphQLNonNull(GraphQLString) },
            pollutionCert: { type: new GraphQLNonNull(GraphQLString) },
            permitCert: { type: new GraphQLNonNull(GraphQLString) },
            fleetOwner: { type: new GraphQLNonNull(GraphQLString) },
        },
        resolve: async (parent, args, context) => {
            return ValidateUser(context).then(async (auth) => {
                if (!auth) {
                    throw new GraphQLError('You are not authorized to perform this action')
                }
                return new Promise((resolve, reject) => {
                    return methods.FindSingleRecord("vehicles", "_id", args._id).then(async (vehicle) => {
                        if (!vehicle) {
                            reject('Vehicle does not exist')
                        }else{
                            const joinedTime = new Date().getTime()
                            return methods.UpdateRecord("vehicles", {"_id": args._id}, args).then(() => {
                                return methods.FindSingleRecord("vehicles", "_id", args._id).then(async (vehicle) => {
                                    resolve(vehicle)
                                })
                            })
                        }
                    })
                }).catch(err => {
                    throw new Error(err)
                })
            })
        }
    }
}

module.exports = {
    queries,
    mutations
}