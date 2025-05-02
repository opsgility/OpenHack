let mongodb = require('mongodb');

let client = null;

module.exports = (context, req) => {
    context.log('JavaScript HTTP trigger function processed a request.');
    if (client === null) {
        let mongoUri = `mongodb://${process.env.MONGO_USERNAME}:${encodeURIComponent(process.env.MONGO_KEY)}@${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/?ssl=true&replicaSet=globaldb`;
        context.log('initializing mongo client...', mongoUri);
        mongodb.MongoClient.connect(mongoUri, (err, _client) => {
            client = _client;
            if (!err) {
                context.log('client intialized. fetching teams...')
                fetchAllOpenHackTeams(context);
            }
        });
    } else {
        fetchAllOpenHackTeams(context);
    }
};

const fetchAllOpenHackTeams = (context) => {
    // return all teams
    client.db('serverlessopenhack').collection(process.env.REGION).find().toArray((error, docs) => {
        context.res = {
            body: JSON.parse(JSON.stringify(docs))
        };
        context.done();
    })
}