let mongodb = require('mongodb');

let client = null;

module.exports = function (context, req) {
    context.log('JavaScript HTTP trigger function RegisterRatingEndpoint processed a request.');
    let registration = req.body;
    if (registration && registration.teamTableNumber && registration.ratingEndpoint) {
        if (client === null) {
            let mongoUri = `mongodb://${process.env.MONGO_USERNAME}:${encodeURIComponent(process.env.MONGO_KEY)}@${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/?ssl=true&replicaSet=globaldb`;
            context.log('initializing mongo client...', mongoUri);
            mongodb.MongoClient.connect(mongoUri, (err, _client) => {
                client = _client;
                if (!err) {
                    registerRatingEndpoint(registration, context);
                }
            });
        } else {
            registerRatingEndpoint(registration, context);
        }

    } else {
        context.res = {
            status: 400,
            body: "Invalid Parameters"
        };
        context.done();
    }
};

const registerRatingEndpoint = (registration, context) => {
    client.db('serverlessopenhack').collection(process.env.REGION).findOne({ teamTableNumber: registration.teamTableNumber }, mongodb.ReadPreference.NEAREST)
        .then((result) => {
            if (result) {
                // indicate the team has registered their rating endpoint, save the rating endpoint, and reinitialize dateRegistered
                context.log('Updating rating endpoint information');
                client.db('serverlessopenhack').collection(process.env.REGION).update({ teamTableNumber: result.teamTableNumber }, {
                    $set: {
                        ratingEndpoint: registration.ratingEndpoint,
                        dateRegistered: new Date(),
                        registeredStorageAccount: true,
                        registeredEventHub: true,
                        registeredRatings: true,
                        eventHubBoost: false,
                        boostRegistered: null
                    }
                }).then((editResult) => {
                    context.res = {
                        body: editResult.result
                    };
                    context.done();
                }).catch((err) => {
                    context.log('ERR', err)
                })
            } else {
                context.res = {
                    body: "Couldn't find a table with that number"
                };
                context.done();
            }
        })
        .catch((err) => {
            context.log("ERR", err)
            context.done();
        });
}