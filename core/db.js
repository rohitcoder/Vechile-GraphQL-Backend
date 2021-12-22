const mongodb = require('mongodb').MongoClient;
let env = require('dotenv');
env.config({ path: '.env' });  

const db = mongodb.connect(process.env.MONGO_DB_URL, { useNewUrlParser: true }).then(client => {
    console.log('Connected to MongoDB');
    return client.db('bsocial');
}).catch(err => {
    console.log(err);
});
module.exports = {
    db
}