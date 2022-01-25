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

const { User } = require('../types');

const queries = {
    getFleetOwner:{
        type: User,
        args: {
            id: { type: new GraphQLNonNull(GraphQLString) }
        },
        resolve: async (parent, args, context) => {
            return ValidateUser(context).then(async (auth) => {
                if (!auth) {
                    throw new Error('You are not authorized to perform this action')
                }
                return methods.FindSingleRecord("users", "_id", ObjectId(args.id))
            })
        }
    },
    ListFleetOwners: {
        type: new GraphQLList(User),
        args: {
            limit: { type: GraphQLInt },
            page: { type: GraphQLInt }
        },
        resolve: async (parent, args, context) => {
            return ValidateUser(context).then(async (auth) => {
                if (!auth) {
                    throw new Error('You are not authorized to perform this action')
                }
                return methods.ListRecords("users", {"type": "fleetOwner"}, args.limit, args.page, {}).then(users => {
                    return users
                })
            })
        }
    },
    MasterQueue: {
        type: new GraphQLList(User),
        args: {
            limit: { type: GraphQLInt },
            page: { type: GraphQLInt }
        },
        resolve: async (parent, args, context) => {
            return ValidateUser(context).then(async (auth) => {
                if (!auth) {
                    throw new Error('You are not authorized to perform this action')
                }
                return methods.ListRecords("users", {"type": "fleetOwner"}, args.limit, args.page).then(users => {
                    return users
                })
            })
        }
    }
}

const mutations = {
    AddFleetOwner: {
        type: User,
        args: {
            firstName: { type: new GraphQLNonNull(GraphQLString) },
            lastName: { type: new GraphQLNonNull(GraphQLString) },
            phone: { type: new GraphQLNonNull(GraphQLString) },
            password: { type: new GraphQLNonNull(GraphQLString) },
        },
        resolve: async (parent, args, context) => {
            return ValidateUser(context).then(async (auth) => {
                if (!auth) {
                    throw new GraphQLError('You are not authorized to perform this action')
                }
                return new Promise((resolve, reject) => {
                    return methods.FindSingleRecord("users", "phone", args.phone).then(async (user) => {
                        if (user) {
                            reject('User already exists')
                        }else{
                            const AuthToken = GenerateRandomString(20)
                            const password = await bcrypt.hash(args.password, 10)
                            const joinedTime = new Date().getTime()
                            return methods.InsertRecord("users", {"firstName": args.firstName, "lastName": args.lastName, "phone": args.phone, "password": password, "type": "fleetOwner", "JoinedTime": joinedTime}).then(async (fleetOwner) => {
                                methods.InsertRecord("MasterQueue", { "fleetOwnerId": fleetOwner._id, "time": joinedTime})
                                return methods.FindSingleRecord("users", "phone", args.phone).then(async (user) => {
                                    resolve(user)
                                })
                            })
                        }
                    })
                }).catch(err => {
                    throw new GraphQLError(err)
                })
            })
        }
    }
}

module.exports = {
    queries,
    mutations
}