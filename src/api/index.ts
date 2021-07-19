import express, { Application, Request, Response, NextFunction } from "express";
import fetch from "node-fetch";
import cors from 'cors'
import cheerio from "cheerio";
// import jade from 'jade' 


import {DocType, ArticalType} from "../types";

import { main, getCollectionData,getCollectionConnection, insertDocument, dbConfig} from "./mongoDB";
import { MongoClient } from "mongodb";
import path from "path";

const app = express();
const port = 3000;

app.use(cors());
// app.set('view', path.join(__dirname, '../public/views'))
app.set('view engine', 'jade')
app.use('/static', express.static(path.join(__dirname, '../public')))
// app.use(updateDatabase)


const _scrapeWebsiteLink = 'https://www.dust2.dk' 


async function scrape(url: string) {
  const res = await fetch(url, {
    method: "get",
    headers: { 'Content-Type': 'text/html' },
  })
  
  return {
    data: res.text(),
    status: res.status,
    statusText: res.statusText
  } 
}

async function articalLinks(url: string): Promise<string[]> {
  const doc = await scrape(url)

  if (doc.status !== 200) return []

  const $ = cheerio.load(await doc.data)
  const hrefs = $('.mediumNewsCon a').map((index, element: cheerio.TagElement | any) => {
    if (element.name === 'a' && element.attribs) {
      return url + element.attribs.href
    }
  })
  return hrefs.toArray() as unknown as string[]
}

function getArticalId(url: string) {
  // @ts-ignore
  return url.match(/\/(\w+)-/)[1]
}

async function scrapeArtical(url: string): Promise<ArticalType | null> {
  const doc: DocType = await scrape(url);
  if (doc.status !== 200) return null
  const $ = cheerio.load(await doc.data as any)

  const bodyList: string[] = []
  const images: string[] = []

  const heading = $(".headline").text()
  const subTitle = $(".headtext").text()
  const author = $(".author").text()

  $(".text img").each((index, element: any) => {
    if (element.name === "img" && /img-cdn/.test(element.attribs.src)) {
      images.push(element.attribs.src)
    }
    
  })
  const date = $(".date").text().trim()
  $(".text p").each((index, element: cheerio.TagElement | any) => {
    if (element.name === "p" && element.children.length === 1) {
      if (element.children[0].data === undefined || element.children[0].data === ' ') return
      bodyList.push(element.children[0].data)
    }
  });

  const articalId = getArticalId(url)

  return {
    _id: articalId,
    url,
    heading,
    subTitle,
    author,
    images,
    date,
    body: bodyList,
  }
}



async function writeDatabase(client: MongoClient) {
  const dbPromises = [];
  const links = await articalLinks(_scrapeWebsiteLink)
  console.log('links: ', links);
  if (links.length > 0) {

    for (const link of links) {
      // - Check if articale have been scraped before
          // If not scrape the articale and put it in DB
          // Else skip scraping
          // Contenue loop

      const artical = await scrapeArtical(link)
        if (artical) {
          const dbResult = insertDocument(
            await getCollectionConnection(client), 
            artical
            )
            dbPromises.push(dbResult)
            }
          }
        }
        
  // @ts-ignore
  const databaseWriteStatus = await Promise.allSettled(dbPromises)
  console.log('databaseWriteStatus: ', databaseWriteStatus);

}

async function updateDatabase() {
  const client = await main()
  await writeDatabase(client)
}

// Fetch articals on first start
updateDatabase()
// 12 hours update time - 43_200_000
setInterval(updateDatabase, 43_200_000)


app.get('/', async function(req, res) {

  const client = await main()
  const collectionData = await getCollectionData( client, dbConfig)
  
  res.type('text/html')
  res.set('Content-Type', 'text/html')
  res.render(path.join(__dirname, '../public/views/index'), { title: 'Jade is awesome', collectionData })
  await client.close();
});

app.get("/api/articals", async (req, res, next) => {
  const client = await main()
  
    const collectionData = await getCollectionData( client, dbConfig)
    
    res.type('application/json')
    await client.close();
    res.status(200).send(collectionData)
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});

export {
  scrape,
  articalLinks,
  getArticalId,
  scrapeArtical
}

