

const findDocuments = function(db, callback) {
    // Get the documents collection
    const collection = db.collection("customers");
    // Find some documents
    collection.find({}).toArray(function(err, docs) {
    //   assert.equal(err, null);
      console.log("Found the following records");
      console.log(docs)
    //   callback(docs);
    });
  }

// -------- MONGODB -------
const MongoClient = require('mongodb').MongoClient;
const uri = "mongodb+srv://loggi30:4pons3iq@cluster0.37ogv.mongodb.net/sample_airbnb?retryWrites=true&w=majority"
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

module.exports = {client, findDocuments}