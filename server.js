const express = require("express")
const fetch = require("node-fetch")
const cheerio = require("cheerio")
const fs = require('fs')

// const {client, findDocuments} = require('./mongoDB')


const app = express();
const port = 3000;

app.use(writeDatabase)

// client.connect(err => {
//   const db = client.db("sample_analytics")
//   const collection = db.collection("customers");
//   collection.find({}).toArray(function(err, docs) {
//     //   assert.equal(err, null);
//       console.log("Found the following records");
//       console.log(docs)
//     //   callback(docs);
//     });

// // findDocuments(db)
// client.close();
// });


let isScraping = true



async function scrape(url) {
  const res = await fetch(url, {
    method: "get",
    headers: { 'Content-Type': 'text/html' },
    mode: "cors",
    cache: "default",
  })
  
  return {
    data: res.text(),
    status: res.status,
    statusText: res.statusText
  } 
  

}

async function articalLinks(url) {
  const doc = await scrape(url)

  if (doc.status !== 200) return []

  const $ = cheerio.load(await doc.data)
  const hrefs = $('.mediumNewsCon a').map((index, element) => {
    if (element.name === 'a' && element.attribs) {
      return url + element.attribs.href
    }
  })
  return hrefs.toArray()
}

function getArticalId(url) {
  return url.match(/\/(\w+)-/)[1]
}


async function scrapeArtical(url) {
  const doc = await scrape(url)
  if (doc.status !== 200) return null
  const $ = cheerio.load(await doc.data)

  const bodyList = []

  const heading = $('.headline').text()
  const subTitle = $('.headtext').text()
  const author = $('.author').text()
  const date = $('.date').text().trim()
  $('.text p').each((index, element) => {
    if (element.name === 'p' && element.children.length === 1) {
      if (element.children[0].data === undefined || element.children[0].data === ' ') return
      bodyList.push(element.children[0].data)
    }
    
  })
  
  return {
    id: getArticalId(url),
    heading,
    subTitle,
    author,
    date,
    body: bodyList,
  }
}

function readFile(fileName) {
  let fileData = []
  fs.readFile(fileName, 'utf8', (err, file) => {
    if (err) return err
    if (file) {
      fileData = JSON.parse(file)
    }
  })
  return fileData
}


function writeJSON(fileName = 'data.json', data) {  
  
  const rawFileData = fs.readFileSync(fileName)
  return new Promise((resolve, reject) => {
    // CREATE: new JSON file object
    if (rawFileData.length < 2) {
      
      const json = JSON.stringify([data])
      fs.writeFile(fileName, json, 'utf8', (err) => {
      console.warn(err)
      reject(err)
    })
      resolve("Success!")
    } 
  
    // Else check data don't exist in file
    // console.log('rawFileData: ', rawFileData.length)
    const fileJson = JSON.parse(rawFileData)
    // console.log('fileJson: ', fileJson);
    const hasArticalData = fileJson.some(fileJson => fileJson.id === data.id )
    console.log('hasArticalData: ', hasArticalData);
      
    if (!hasArticalData) {
        fileJson.push(data)
        const json = JSON.stringify(fileJson)
        fs.writeFile(fileName, json, 'utf8', function(err){
        if(err) return console.log(err)
        console.log('File updated')
        reject(err)
      })
    }  else {
          console.log('Data already exists in file', data.id)
          reject(`id: ${data.id} already exists in file`)
      }
      resolve("Success!")

  })
}

async function writeDatabase(req, res, next) {
  const database = []
  const links = await articalLinks('https://www.dust2.dk')
  if (links.length > 0) {
    links.forEach(async link => {
      const artical = await scrapeArtical(link)
      if (artical) {
        database.push(artical)
        await writeJSON('artical.json', artical).catch((e) => {
          console.error(e)
        })
      }
      
    })
    isScraping = false
  }
  
  isScraping = false
  next()
}


app.get("/", (req, res) => {

  const rawFileData = fs.readFileSync('artical.json')
  const fileJson = JSON.parse(rawFileData)
  
  console.log('isScraping: ', isScraping);
  if (fileJson.length > 0 && !isScraping) {
    res.send(
      fileJson
    )

  }

res.send(
    `<pre> ${JSON.stringify({
      status: 'No New data',
      database: []
    }, null, "\t")} <pre/>`
  )
  
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
