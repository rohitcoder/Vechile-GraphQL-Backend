const graphql = require('graphql')
const { methods, GenerateRandomString } = require('../../core/functions')
const bcrypt = require('bcrypt')
const env = require('dotenv');
env.config({ path: '.env' });  

const {
    GraphQLNonNull,
    GraphQLString,
    GraphQLError,
    GraphQLList,
    GraphQLString,
    GraphQLInt
} = graphql

const { User } = require('../types');

const queries = {
    user: {
        type: User,
        args: {
            id: { type: GraphQLString }
        },
        resolve: async (parent, args, context) => {
            const user = await methods.FindSingleRecord("users", "_id", args.id)
            if (!user) {
                throw new GraphQLError('User not found')
            }
            return user
        }
    },
    LoginUser: {
        type: User,
        args: {
            phone: { type: new GraphQLNonNull(GraphQLString) },
            password: { type: new GraphQLNonNull(GraphQLString) }
        },
        resolve: async (parent, args, context) => {
            return new Promise((resolve, reject) => {
                return methods.FindSingleRecord("users", "phone", args.phone).then(async (user) => {
                    const AuthToken = GenerateRandomString(20)
                    if (!user) {
                        throw new GraphQLError('User not found')
                    }
                    const valid = await bcrypt.compare(args.password, user.password)
                    if (!valid) {
                        reject('Invalid Username or password')
                    }else{
                        return methods.InsertRecord("AuthTokens", {"token": AuthToken, "user_id": user._id, "time": new Date().getTime()}).then(() => {
                            user.auth_token = AuthToken
                            resolve(user)
                        })
                    }
                })
            }).catch(err => {
                throw new GraphQLError(err)
            })
        }
    }
}

const mutations = {
    RegisterUser: {
        type: User,
        args: {
            phone: { type: new GraphQLNonNull(GraphQLString) },
            password: { type: new GraphQLNonNull(GraphQLString) },
            firstName: { type: new GraphQLNonNull(GraphQLString) },
            lastName: { type: new GraphQLNonNull(GraphQLString) },
            type: { type: new GraphQLNonNull(GraphQLString) }
        },
        resolve: async(parentValue, args) => { 
            return new Promise((resolve, reject) => {
                const time = new Date().getTime()
                const AuthToken = GenerateRandomString(32)
                args.username = (args.firstName.toLowerCase() + args.lastName.toLowerCase() + GenerateRandomString(4)).replace(/\s/g, "").replace("-","")
                return methods.FindRecordByMultipleFields("users", {$or: [{ "phone": args.phone }]}).then(result => {
                    if (result) {
                        reject(new Error("Unable to Signup, User already exists"))
                    }else{
                        bcrypt.hash(args.password, 10, function(err, hash) {
                            args.password = hash
                            args.JoinedTime = new Date().getTime()
                            return methods.InsertRecord("users", args).then(result => {
                                methods.InsertRecord("AuthTokens", {"token": AuthToken, "user_id": result._id, "time": time})
                                result.auth_token = AuthToken
                                resolve(result)
                            })
                        });
                    }
                })
            })
        }
    },
}

const subscriptions = {
    UserSubscription: {
        type: User,
        args: {
            user_id: { type: new GraphQLNonNull(GraphQLString) }
        },
        resolve: async(parentValue, args) => {
            return new Promise((resolve, reject) => {
                methods.FindRecordByMultipleFields("users", {_id: args.user_id}).then(result => {
                    resolve(result)
                })
            })
        }
    }
}

module.exports = {
    queries,
    mutations,
    subscriptions
}