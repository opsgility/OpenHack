let mongodb = require('mongodb');

let client = null;

module.exports = (context, req) => {
    context.log('JavaScript HTTP trigger function processed a request.');
    let submission = req.body;
    if (submission && submission.teamTableNumber && submission.contentUrl) {
        if (client === null) {
            let mongoUri = `mongodb://${process.env.MONGO_USERNAME}:${encodeURIComponent(process.env.MONGO_KEY)}@${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/?ssl=true&replicaSet=globaldb`;
            context.log('initializing mongo client...', mongoUri);
            mongodb.MongoClient.connect(mongoUri, (err, _client) => {
                client = _client;
                if (!err) {
                    submitContent(submission, context);
                }
            });
        } else {
            submitContent(submission, context);
        }
    }
    else {
        context.res = {
            status: 400,
            body: "Invalid Parameters"
        };
        context.done();
    }
};

const submitContent = (submission, context) => {
    client.db('serverlessopenhack').collection(process.env.REGION).findOne({ teamTableNumber: submission.teamTableNumber }, mongodb.ReadPreference.NEAREST)
        .then((result) => {
            if (result) {
                // save content url and reinitialize dateRegistered
                client.db('serverlessopenhack').collection(process.env.REGION).update({ teamTableNumber: result.teamTableNumber }, {
                    $set: {
                        contentUrl: submission.contentUrl,
                        dateRegistered: new Date()
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