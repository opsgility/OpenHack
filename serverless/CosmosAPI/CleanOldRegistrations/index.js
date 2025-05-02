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
                fetchAndDeleteInactiveTeams(context);
            }
        });
    } else {
        fetchAndDeleteInactiveTeams(context);
    }
};

const fetchAndDeleteInactiveTeams = (context) => {
    client.db('serverlessopenhack').collection(process.env.REGION).find().toArray((error, docs) => {
        let tablesRegisteredBeyondThreshold = [];
        docs.map((doc) => {
            if (getDaysInPast(doc.dateRegistered) > 3) {
                // the team's registration is more than 3 days in the past, add it to the array for deletion
                tablesRegisteredBeyondThreshold.push(doc.teamTableNumber)
            }
        });
        if (tablesRegisteredBeyondThreshold.length === 0) {
            // no teams have registrations beyond the 3 day threshold, end the function code
            context.log('No tables with old registrations')
            context.done();
        } else {
            let count = 0;
            // delete each team with old registrations
            tablesRegisteredBeyondThreshold.map((tableNumber) => {
                client.db('serverlessopenhack').collection(process.env.REGION).deleteOne({ teamTableNumber: tableNumber })
                    .then((result) => {
                        context.log('deleted registration for table number', tableNumber);
                        count++;
                        if (count === tablesRegisteredBeyondThreshold.length) {
                            context.done();
                        }
                    })
                    .catch((err) => {
                        context.log("ERR", err);
                        count++;
                        if (count === tablesRegisteredBeyondThreshold.length) {
                            context.done();
                        }
                    });
            });
        }
    })
}

const getDaysInPast = (startDate) => {
    const millisecondsPerDay = 24 * 60 * 60 * 1000;
    var timeInMilliseconds = startDate.getTime() - new Date().getTime();
    return Math.abs(Math.ceil(timeInMilliseconds / millisecondsPerDay));
}