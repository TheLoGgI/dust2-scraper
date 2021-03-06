import {
    Collection,
    MongoClient
} from 'mongodb'
import env from 'dotenv'
import {
    ArticalType
} from '../types';
env.config()


const dbConfig = {
    databaseName: 'DUST2',
    collectionName: 'artical'
}

// -------- MONGODB -------
async function listDatabases(client: MongoClient) {
    return await client.db().admin().listDatabases();
}

async function getCollectionData(client: MongoClient, config: {
    databaseName: string,
    collectionName: string
}) {
    return await client.db(dbConfig.databaseName).collection(dbConfig.collectionName).find().toArray()
}

async function insertDocument(collection: Collection, document: ArticalType) {

    return await collection.insertOne(document).catch(error => {
        if (error.code === 11000) console.log(`Document with duplicate key { _id: ${error.keyValue._id} }`)
        else console.log(error.code, error.reason, error.status)

    })

}

async function getCollectionConnection(client: MongoClient) {
    return await client.db(dbConfig.databaseName).collection(dbConfig.collectionName)
}

async function main() {
    /**
     * Connection URI. Update <username>, <password>, and <your-cluster-url> to reflect your cluster.
     * See https://docs.mongodb.com/ecosystem/drivers/node/ for more details
     */
    const uri = `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@cluster0.37ogv.mongodb.net`

    const client = new MongoClient(uri, {
        useUnifiedTopology: true
    });


    try {
        // Connect to the MongoDB cluster
        await client.connect();

    } catch (e) {
        console.error(e);
    } finally {
        return client
        // await client.close();
    }

}


export {
    main,
    insertDocument,
    listDatabases,
    getCollectionData,
    getCollectionConnection,
    dbConfig
}