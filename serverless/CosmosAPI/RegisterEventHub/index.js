let mongodb = require('mongodb');
let azureEventHubs = require('azure-event-hubs');

let client = null;

module.exports = (context, req) => {
    context.log('JavaScript HTTP trigger function RegisterEventHub processed a request.');
    let registration = req.body;
    // quickly handle common errors, returning more specific error messages for the user
    if (!isValidEventHubName(registration.eventHubName)) {
        context.res = {
            status: 400,
            body: "Invalid event hub name. Check that the 'eventHubName' field matches the event hub name on your namespace."
        };
        context.done();
    } else if (registration.eventHubConnectionString.includes("EntityPath")) {
        context.res = {
            status: 400,
            body: "Invalid event hub connection string. Please use a connection string for the event hub namespace, not the event hub itself."
        }
        context.done();
    }
    if (registration && registration.teamTableNumber && registration.eventHubConnectionString && registration.eventHubName) {
        try {
            // validate that the event hub has been created prior to the request
            context.log('validating event hub');
            const eventHubClient = azureEventHubs.EventHubClient.createFromConnectionString(registration.eventHubConnectionString, registration.eventHubName);
            eventHubClient.getHubRuntimeInformation()
                .then((res) => {
                    if (client === null) {
                        let mongoUri = `mongodb://${process.env.MONGO_USERNAME}:${encodeURIComponent(process.env.MONGO_KEY)}@${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/?ssl=true&replicaSet=globaldb`;
                        context.log('valid event hub, initializing mongo client...', mongoUri);
                        mongodb.MongoClient.connect(mongoUri, (err, _client) => {
                            client = _client;
                            if (!err) {
                                registerEventHub(registration, context);
                            }
                        });
                    } else {
                        registerEventHub(registration, context);
                    }
                }).catch((error) => {
                    context.res = {
                        status: 400,
                        body: "Invalid Connection String or Event Hub Name"
                    };
                    context.done();
                })
        } catch (ex) {
            context.res = {
                status: 400,
                body: "Invalid connection string or event hub name - pilot connection failed."
            };
            context.done();
        }
    } else {
        context.res = {
            status: 400,
            body: "Invalid Parameters"
        };
        context.done();
    }
};

const registerEventHub = (registration, context) => {
    client.db('serverlessopenhack').collection(process.env.REGION).findOne({ teamTableNumber: registration.teamTableNumber }, mongodb.ReadPreference.NEAREST)
        .then((result) => {
            if (result) {
                // indicate the team has registered their Event Hub information, save the event hub information, and reinitialize dateRegistered
                context.log('Updating Event HUb registration information');
                client.db('serverlessopenhack').collection(process.env.REGION).update({ teamTableNumber: result.teamTableNumber }, {
                    $set: {
                        eventHubConnectionString: registration.eventHubConnectionString,
                        eventHubName: registration.eventHubName,
                        dateRegistered: new Date(),
                        registeredStorageAccount: true,
                        registeredEventHub: true,
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
        }).catch((err) => {
            context.log("ERR", err)
        });
}

const isValidEventHubName = (eventHubName) => {
    // test - first and last chars must be alphanumeric
    return /^[a-z0-9]+$/i.test(eventHubName[0]) && /^[a-z0-9]+$/i.test(eventHubName.slice(-1));
}