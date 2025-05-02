let mongodb = require('mongodb');
let storage = require('azure-storage');

let client = null;

module.exports = (context, req) => {
    context.log('JavaScript HTTP trigger function RegisterStorageAccount processed a request.');
    let registration = req.body;
    if (validateTeamTableNumber(context, registration.teamTableNumber) === false) {
        context.res = {
            status: 400,
            body: "teamTableNumber should follow the structure <city>-table-<number>"
        };
        context.done();
    } else {
        //createBlobService() call depends on the connection string stored in an environment variable
        process.env.AZURE_STORAGE_CONNECTION_STRING = registration.storageAccountConnectionString;
        if (registration && registration.teamTableNumber && registration.storageAccountConnectionString && registration.blobContainerName) {
            try {
                // validate that the storage account has been created prior to the request
                context.log('validating storage account');
                const blobService = storage.createBlobService();
                blobService.createContainerIfNotExists(registration.blobContainerName, { publicAccessLevel: 'blob' }, () => { });
                if (client === null) {
                    let mongoUri = `mongodb://${process.env.MONGO_USERNAME}:${encodeURIComponent(process.env.MONGO_KEY)}@${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/?ssl=true&replicaSet=globaldb`;
                    context.log('valid storage account, initializing mongo client...', mongoUri);
                    mongodb.MongoClient.connect(mongoUri, (err, _client) => {
                        client = _client;
                        if (!err) {
                            registerStorageAccount(registration, context);
                        }
                    });
                } else {
                    registerStorageAccount(registration, context);
                }
            } catch (ex) {
                context.res = {
                    status: 400,
                    body: "Invalid Connection String or Blob Container Name"
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
    }
};

const validateTeamTableNumber = (context, teamTableNumber) => {
    // the teamTableNumber property should follow the syntax <city>-table-<number>
    context.log('validating teamTableNumber');
    // validate the string has two dashes
    if (!teamTableNumber.match || (teamTableNumber.match(/-/g) || []).length !== 2) {
        return false;
    };
    // split the string and validate each segment
    let segments = teamTableNumber.split('-');
    let citySegment = segments[0];
    let tableSegment = segments[1];
    let numberSegment = segments[2];
    var stringRegExp = new RegExp('^[a-zA-Z ]+$');
    var intRegExp = new RegExp('^[0-9]*$');
    if (stringRegExp.test(citySegment) === false) {
        return false;
    }
    if (tableSegment !== 'table') {
        return false;
    }
    if (intRegExp.test(numberSegment) === false) {
        return false;
    }
    context.log('valid teamTableNumber');
    return true;
}

const registerStorageAccount = (registration, context) => {
    client.db('serverlessopenhack').collection(process.env.REGION).findOne({ teamTableNumber: registration.teamTableNumber }, mongodb.ReadPreference.NEAREST)
        .then((result) => {
            if (result) {
                // update the team's storage account information and reinitialize dateRegistered
                context.log('Updating storage account registration information');
                client.db('serverlessopenhack').collection(process.env.REGION).update({ teamTableNumber: result.teamTableNumber }, {
                    $set: {
                        storageAccountConnectionString: registration.storageAccountConnectionString,
                        blobContainerName: registration.blobContainerName,
                        dateRegistered: new Date(),
                        registeredStorageAccount: true,
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
                // new team registration. Initialize the team 's storage account registration, save the storage account information, and initialize dateRegistered
                context.log('Saving new team');
                client.db('serverlessopenhack').collection(process.env.REGION).save({
                    teamTableNumber: registration.teamTableNumber,
                    storageAccountConnectionString: registration.storageAccountConnectionString,
                    blobContainerName: registration.blobContainerName,
                    eventHubConnectionString: '',
                    eventHubName: '',
                    ratingEndpoint: '',
                    registeredStorageAccount: true,
                    registeredEventHub: false,
                    registeredRatings: false,
                    eventHubBoost: false,
                    dateRegistered: new Date(),
                    boostRegistered: null,
                    contentUrl: ''
                }).then((createResult) => {
                    context.res = {
                        body: createResult.result
                    };
                    context.done();
                }).catch((err) => {
                    context.log('ERR', err)
                })
            }
        })
        .catch((err) => {
            context.log("ERR", err)
        });
}