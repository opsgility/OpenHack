let mongodb = require('mongodb');

let client = null;

module.exports = (context, req) => {
    context.log('JavaScript timer trigger function processed a request.');
    if (client === null) {
        let mongoUri = `mongodb://${process.env.MONGO_USERNAME}:${encodeURIComponent(process.env.MONGO_KEY)}@${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/?ssl=true&replicaSet=globaldb`;
        context.log('initializing mongo client...', mongoUri);
        mongodb.MongoClient.connect(mongoUri, (err, _client) => {
            client = _client;
            if (!err) {
                fetchAndReduceBoostedTeams(context);
            }
        });
    } else {
        fetchAndReduceBoostedTeams(context);
    }
};

const fetchAndReduceBoostedTeams = (context) => {
    client.db('serverlessopenhack').collection(process.env.REGION).find().toArray((error, docs) => {
        let tablesBoostedBeyondThreshold = [];
        docs.map((doc) => {
            if (doc.boostRegistered && doc.boostRegistered !== null && getHoursInPast(doc.boostRegistered) > 3) {
                // the team turned on boost mode is more than 3 hours in the past, add it to the array for re initialization
                tablesBoostedBeyondThreshold.push(doc.teamTableNumber);
            }
        });
        if (tablesBoostedBeyondThreshold.length === 0) {
            // no teams have boost registrations beyond the 3 hour threshold, end the function code
            context.log('No tables with old boost registrations')
            context.done();
        } else {
            let count = 0;
            // stop boost mode for each team beyond the threshold
            tablesBoostedBeyondThreshold.map((tableNumber) => {
                client.db('serverlessopenhack').collection(process.env.REGION).update({ teamTableNumber: tableNumber }, {
                    $set: {
                        eventHubBoost: false,
                        boostRegistered: null
                    }
                }).then((editResult) => {
                    context.log('reduced boost for table number', tableNumber);
                    count++;
                    if (count === tablesBoostedBeyondThreshold.length) {
                        context.done();
                    }
                }).catch((err) => {
                    context.log("ERR", err);
                    count++;
                    if (count === tablesBoostedBeyondThreshold.length) {
                        context.done();
                    }
                })
            });
        }
    })
}

const getHoursInPast = (startDate) => {
    const millisecondsPerHour = 60 * 60 * 1000;
    var timeInMilliseconds = startDate.getTime() - new Date().getTime();
    return Math.abs(Math.ceil(timeInMilliseconds / millisecondsPerHour));
}