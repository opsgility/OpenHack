let mongodb = require('mongodb');
let storage = require('azure-storage');
let azureEventHubs = require('azure-event-hubs');
let axios = require('axios');

let client = null;

module.exports = (context, req) => {
    context.log('JavaScript timer trigger function processed a request.');
    if (client === null) {
        let mongoUri = `mongodb://${process.env.MONGO_USERNAME}:${encodeURIComponent(process.env.MONGO_KEY)}@${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/?ssl=true&replicaSet=globaldb`;
        context.log('initializing mongo client...', mongoUri);
        mongodb.MongoClient.connect(mongoUri, (err, _client) => {
            client = _client;
            if (!err) {
                fetchAndDeleteInvalidTeams(context);
            }
        });
    } else {
        fetchAndDeleteInvalidTeams(context);
    }
};

const fetchAndDeleteInvalidTeams = (context) => {
    client.db('serverlessopenhack').collection(process.env.REGION).find().toArray((error, docs) => {
        let count = 0;
        let validationPromise = new Promise((resolve, reject) => {
            docs.map((doc) => {
                //createBlobService() call depends on the connection string stored in an environment variable
                process.env.AZURE_STORAGE_CONNECTION_STRING = doc.storageAccountConnectionString;
                try {
                    // all registrations have storage account properties initialized
                    // ensure storage account properties are still valid
                    context.log('testing blob service')
                    const blobService = storage.createBlobService();
                    blobService.createContainerIfNotExists(doc.blobContainerName, { publicAccessLevel: 'blob' }, () => { });
                    if (doc.eventHubConnectionString.length > 1 && doc.eventHubName.length > 1) {
                        // ensure event hub properties are still valid
                        context.log('testing event hub')
                        try {
                            const eventHubClient = azureEventHubs.EventHubClient.createFromConnectionString(doc.eventHubConnectionString, doc.eventHubName);
                            eventHubClient.getHubRuntimeInformation()
                                .then((res) => {
                                    if (doc.ratingEndpoint.length > 1) {
                                        context.log('testing rating endpoint')
                                        // ensure rating endpoint is still valid
                                        axios.post(doc.ratingEndpoint)
                                            .then((res) => {
                                                // tested successfully, increment count
                                                context.log('rating endpoint tested successfully for table', doc.teamTableNumber);
                                                incremementCountAndResolve(++count, docs.length, resolve);
                                            }).catch((postError) => {
                                                // invalid rating endpoint, delete registration
                                                context.log('Rating endpoint error');
                                                deleteDocument(context, client, doc, ++count, docs.length, resolve);
                                            })
                                    } else {
                                        // tested successfully, increment count
                                        context.log('event hub tested successfully, no rating endpoint for table', doc.teamTableNumber);
                                        incremementCountAndResolve(++count, docs.length, resolve);
                                    }
                                }).catch((eventHubRuntimeError) => {
                                    // invalid event hub properties, delete registration
                                    context.log('Event hub error', eventHubRuntimeError);
                                    deleteDocument(context, client, doc, ++count, docs.length, resolve);
                                })
                        } catch (eventHubClientError) {
                            // invalid event hub properties, delete registration
                            context.log('Event hub error', eventHubClientError);
                            deleteDocument(context, client, doc, ++count, docs.length, resolve);
                        }
                    } else {
                        // tested successfully, increment count
                        context.log('storage account tested successfully, no event hub for table', doc.teamTableNumber);
                        incremementCountAndResolve(++count, docs.length, resolve);
                    }
                } catch (storageAccountError) {
                    // invalid storage account properties, delete registration
                    context.log('Storage account error', storageAccountError);
                    deleteDocument(context, client, doc, ++count, docs.length, resolve);
                }
            })
        })
        validationPromise.then((res) => {
            context.log('done');
            context.done();
        })
        validationPromise.catch((ex) => {
            context.log('promise error', ex);
        });
    });
}

const deleteDocument = (context, client, doc, count, docCount, resolve) => {
    context.log('deleting registration for table number', doc.teamTableNumber);
    client.db('serverlessopenhack').collection(process.env.REGION).deleteOne({ teamTableNumber: doc.teamTableNumber })
        .then((res) => {
            // deleted successfully, increment count
            incremementCountAndResolve(count, docCount, resolve);
        }).catch((err) => {
            context.log("Delete error", err);
            // deleted unsuccessfully, increment count
            incremementCountAndResolve(count, docCount, resolve);
        });
}

const incremementCountAndResolve = (count, docCount, resolve) => {
    if (count === docCount) {
        resolve();
    }
}