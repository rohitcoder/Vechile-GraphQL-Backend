const db = require('./db').db
const { ObjectId } = require('mongodb');
const env = require('dotenv')

exports.methods = {
    CreateIndex: function(collection, obj){
        db.then(function(db){
            db.collection(collection).createIndex(obj, { unique: true } );
        })
    },
    InsertRecord: async function(collection, obj){ 
        return new Promise((resolve, reject) => {
            db.then(function(db){
                db.collection(collection).insertOne(obj, function(err, response){
                    if(err){
                        reject(err)
                    }else{
                        obj._id = response.insertedId
                        resolve(obj)
                    }
                })
            })
        })
    },
    BulkInsertRecord: async function(collection, obj){ 
        return new Promise((resolve, reject) => {
            db.then(function(db){
                db.collection(collection).insertMany(obj, function(err, response){
                    if(err){
                        reject(err)
                    }else{
                        const insertedIds = response.insertedIds
                        for(var i = 0; i < insertedIds.length; i++){
                            obj[i]._id = insertedIds[i]
                        }
                        resolve(obj)
                    }
                })
            })
        })
    },
    FindSingleRecord: function(collection, identifier, value, ignoreCache=false){ 
        const startTime = new Date().getTime()
        return new Promise((resolve, reject) => {
            var obj = {}
            if(typeof value === "undefined"){
                reject(new Error("FindSingleRecord function error, Value is required!"))
            }
            if(identifier=="_id"){
                obj = { _id: ObjectId(value)}
            }else{
                obj[identifier] = value;
            }
            db.then(function(db){
                db.collection(collection).findOne(obj, function(err, response) { 
                    if(err) resolve(err)
                    resolve(response)
                })
            });
        })
    },
    FindRecordByMultipleFields: function(collection, obj){ 
        return new Promise((resolve, reject) => {
            db.then(function(db){
                db.collection(collection).findOne(obj, function(err, response) {  
                    if(err) resolve(err)
                    resolve(response)
                })
            })
        })
    },
    FindDistinctRecords: function(collection, field, obj){ 
        return new Promise((resolve, reject) => {
            db.then(function(db){
                db.collection(collection).distinct(field, obj, function(err, response) {  
                    if(err) resolve(err)
                    resolve(response)
                })
            })
        })
    },
    FindMultipleRecord: function(collection, identifier, value){
        return new Promise((resolve, reject) => {
            var obj = {}
            var NewValue = []
            if(value.constructor === Array){
                value.forEach(function(val){ 
                    NewValue.push(ObjectId(val))
                })
            }else{
                NewValue.push(ObjectId(value))
            }
            obj[identifier] = {"$in": NewValue }
            db.then(function(db){
                db.collection(collection).find(obj).toArray(function(err, response) {
                    if(err) resolve(err)
                    resolve(response)
                })
            })
        })
    },
    ListRecords: function(collection, searchObj, limit=10, page=0, sortLogic = null){
        return new Promise((resolve, reject) => {
            const offsetValue = limit*page
            if(sortLogic!={} && sortLogic!=null){
                sortLogic = { $natural: -1 }
            }
            db.then(function(db){
                db.collection(collection).find(searchObj).sort(sortLogic).limit(limit).skip(offsetValue).toArray(function(err, response) {
                    if(err) resolve(err)
                    resolve(response)
                })
            })
        })
    },
    ListAggregateRecords: function(collection, searchObj, limit=10, page=0, sortLogic = null, random = false){ 
        return new Promise((resolve, reject) => {
            const offsetValue = limit*page
            db.then(function(db){
                const query = [
                    { $match: searchObj },
                    { $skip: offsetValue },
                    { $limit: limit },
                ]
                if(random){
                    query.push({ $sample: { size: limit } })
                }
                if(sortLogic!==null){
                    query.push({ $sort: sortLogic })
                }
                db.collection(collection).aggregate(query).toArray(function(err, response) {
                    if(err) resolve(err)
                    resolve(response)
                })
            })
        })
    },
    AggregateRecords: function(collection, searchObj, limit=10, page=0){ 
        return new Promise((resolve, reject) => {
            const offsetValue = limit*page
            db.then(function(db){
                db.collection(collection).aggregate(searchObj).limit(limit).skip(offsetValue).toArray(function(err, response) {
                    if(err) resolve(err)
                    resolve(response)
                })
            })
        })
    },
    IncrementRecord: function(collection, searchObj, field, value){
        return new Promise((resolve, reject) => {
            db.then(function(db){
                db.collection(collection).updateOne(searchObj, { $inc: { [field]: value } }, function(err, response) {
                    if(err) resolve(err)
                    resolve(response)
                })
            })
        })
    },
    UpdateRecord: function(collection, SearchObj, ValueObj){ 
        return new Promise((resolve, reject) => { 
            var obj = {}, CacheKey = null
            if(SearchObj.hasOwnProperty("_id")){
                obj = { _id: ObjectId(SearchObj["_id"])}
                CacheKey = `${collection}_id${SearchObj["_id"].toString()}`
            }else{
                obj = SearchObj
            }
            console.log("Deleting: "+CacheKey)
            db.then(function(db){
                db.collection(collection).updateMany(obj, {$set: ValueObj}, function(err, response) {
                    if(err){
                        resolve(err)
                    }else{
                        db.collection(collection).findOne(obj, function(err, response) {
                            if(err) resolve(err)
                            resolve(response)
                        })
                    }
                })
            })
        })
    },
    FindOrCreateRecord: function(collection, SearchObj, ValueObj){ 
        return new Promise((resolve, reject) => { 
            var obj = {}
            if(SearchObj.hasOwnProperty("_id")){
                obj = { _id: ObjectId(SearchObj["_id"])}
            }else{
                obj = SearchObj
            } 
            db.then(function(db){
                db.collection(collection).updateOne(obj, {$set: ValueObj}, {upsert: true}, function(err, response) {
                    if(err){
                        resolve(err)
                    }else{
                        db.collection(collection).findOne(obj, function(err, response) {
                            if(err) resolve(err)
                            resolve(response)
                        })
                    }
                })
            })
        })
    },
    DeleteRecord: function(collection, SearchObj){ 
        return new Promise((resolve, reject) => { 
            var obj = {}
            if(SearchObj.hasOwnProperty("_id")){ 
                obj = { _id: ObjectId(SearchObj["_id"])}
            }else{
                obj = SearchObj
            }  
            db.then(function(db){
                db.collection(collection).deleteOne(obj, function(err, response) {
                    if(err) resolve(err)
                    resolve(response)
                })
            })
        })
    },
    isRecordExist: function(collection, identifier, value){
        return new Promise((resolve, reject) => {
            var obj = {}
            if(identifier=="_id"){
                obj = { _id: ObjectId(value)}
            }else{
                obj[identifier] = value
            } 
            db.then(function(db){
                    db.collection(collection).count(obj, function(err, count){
                    if(count > 0){
                        resolve(true)
                    }else{
                        resolve(false)
                    }
                })
            })
        })
    },
    countRecord: function(collection, identifier, value){
        return new Promise((resolve, reject) => {
            var obj = {}
            if(identifier=="_id"){
                obj = { _id: ObjectId(value)}
            }else{
                obj[identifier] = value
            }
            db.then(function(db){
                db.collection(collection).count(obj, function(err, count){
                    if(count > 0){
                        resolve(count)
                    }else{
                        resolve(0)
                    }
                })
            })
        })
    },
    countDocuments: function(collection, query={}){
        return new Promise((resolve, reject) => {
            db.then(function(db){
                db.collection(collection).countDocuments(query, function(err, count){
                    if(err) resolve(err)
                    resolve(count)
                })
            })
        })
    },
}

exports.ValidateUser = function(context){
    context.req = context.req || context.request
    const authorization = context.req.headers.authorization
    if(authorization && authorization.split(' ')[0] == 'Bearer' && authorization.split(' ')[1]){
        return new Promise((resolve, reject) => {
            return exports.methods.FindSingleRecord("AuthTokens", "token", authorization.split(' ')[1]).then(response => {
                if(response){ 
                    resolve(response)
                }else{ 
                    reject(new Error("User Session Expired or Invalid!"))
                }
            })
        })
    }else{
        return new Promise((resolve, reject) => {
            reject(new Error("You need to provide Bearer Token in authorization header."))
        })
    }
}

exports.GenerateRandomString = function(length){
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}