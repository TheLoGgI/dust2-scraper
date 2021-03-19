import {MongoClient} from 'mongodb'

// const findDocuments = function(db, callback) {
//     // Get the documents collection
//     const collection = db.collection("customers");
//     // Find some documents
//     collection.find({}).toArray(function(err, docs) {
//     //   assert.equal(err, null);
//       console.log("Found the following records");
//       console.log(docs)
//     //   callback(docs);
//     });
//   }

// -------- MONGODB -------
async function listDatabases(client: MongoClient) {
    // const databasesList = await client.db().admin().listDatabases();
    // console.log('databasesList: ', databasesList);
    const data = await client.db('sample_airbnb').collection('listingsAndReviews').find().toArray((err, docs) => {
        console.log('docs: ', docs);
        return docs
    })
    console.log('data: ', data);

    
    // console.log("Databases:");
    // databasesList.databases.forEach((db: any) => console.log(` - ${db.name}`));
}

// const uri = "mongodb+srv://loggi30:4pons3iq@cluster0.37ogv.mongodb.net/sample_airbnb?retryWrites=true&w=majority"
// const client = new MongoClient(uri);

// const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function main(){
    /**
     * Connection URI. Update <username>, <password>, and <your-cluster-url> to reflect your cluster.
     * See https://docs.mongodb.com/ecosystem/drivers/node/ for more details
     */
     const uri = "mongodb+srv://loggi30:4pons3iq@cluster0.37ogv.mongodb.net/sample_airbnb?retryWrites=true&w=majority"
 

    const client = new MongoClient(uri);
 
    try {
        // Connect to the MongoDB cluster
        await client.connect();
 
        // Make the appropriate DB calls
        await  listDatabases(client);
 
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}

main().catch(console.error);


export {
    main
}

// module.exports = {client, findDocuments}