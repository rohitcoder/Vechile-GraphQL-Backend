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

const { Loads } = require('../types');

const queries = {
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
    }
}

const mutations = {
    AddLoads: {
        type: Loads,
        args: {
            description: { type: new GraphQLNonNull(GraphQLString) },
            origin: { type: new GraphQLNonNull(GraphQLString) },
            destination: { type: new GraphQLNonNull(GraphQLString) },
            estimated_weight: { type: new GraphQLNonNull(GraphQLInt) },
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
    }
}

module.exports = {
    queries,
    mutations
}