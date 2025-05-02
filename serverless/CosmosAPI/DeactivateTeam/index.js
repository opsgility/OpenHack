let mongodb = require('mongodb');

let client = null;

module.exports = (context, req) => {
    context.log('JavaScript HTTP trigger function processed a request.');

    let teamTableNumber = context.bindingData.teamTableNumber;
    if (teamTableNumber) {
        if (client === null) {
            let mongoUri = `mongodb://${process.env.MONGO_USERNAME}:${encodeURIComponent(process.env.MONGO_KEY)}@${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/?ssl=true&replicaSet=globaldb`;
            context.log('initializing mongo client...', mongoUri);
            mongodb.MongoClient.connect(mongoUri, (err, _client) => {
                client = _client;
                if (!err) {
                    deactivateOpenHackTeam(teamTableNumber, context);
                }
            });
        } else {
            deactivateOpenHackTeam(teamTableNumber, context);
        }
    }
    else {
        context.res = {
            status: 400,
            body: "Please pass a teamTableNumber on the query string"
        };
        context.done();
    }
};

const deactivateOpenHackTeam = (teamTableNumber, context) => {
    client.db('serverlessopenhack').collection(process.env.REGION).findOne({ teamTableNumber: teamTableNumber }, mongodb.ReadPreference.NEAREST)
        .then((result) => {
            if (result) {
                // reset challenge boolean values to stop back end services for the team
                client.db('serverlessopenhack').collection(process.env.REGION).update({ teamTableNumber: result.teamTableNumber }, {
                    $set: {
                        registeredStorageAccount: false,
                        registeredEventHub: false,
                        registeredRatings: false,
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
        });
}
