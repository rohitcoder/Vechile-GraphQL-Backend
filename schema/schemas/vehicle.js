const graphql = require('graphql')
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
            vehicle_number: { type: new GraphQLNonNull(GraphQLString) },
            vehicle_type: { type: new GraphQLNonNull(GraphQLString) },
            vehicle_model: { type: new GraphQLNonNull(GraphQLString) },
            driver: { type: new GraphQLNonNull(GraphQLString) },
        },
        resolve: async (parent, args, context) => {
            return ValidateUser(context).then(async (auth) => {
                if (!auth) {
                    throw new GraphQLError('You are not authorized to perform this action')
                }
                return new Promise((resolve, reject) => {
                    return methods.FindSingleRecord("vehicles", "vehicle_number", args.vehicle_number).then(async (vehicle) => {
                        if (vehicle) {
                            reject('Vehicle already exists')
                        }else{
                            const joinedTime = new Date().getTime()
                            return methods.InsertRecord("vehicles", {"vehicle_number": args.vehicle_number, "vehicle_type": args.vehicle_type, "vehicle_model": args.vehicle_model, "driver": args.driver, "JoinedTime": joinedTime}).then(() => {
                                return methods.FindSingleRecord("vehicles", "vehicle_number", args.vehicle_number).then(async (vehicle) => {
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
}

module.exports = {
    queries,
    mutations
}