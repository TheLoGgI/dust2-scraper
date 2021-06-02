import express, { Application, Request, Response, NextFunction } from "express";
import fetch from "node-fetch";
import cheerio from "cheerio";



import {DocType, ArticalType} from "./types";

import { main, getCollectionData,getCollectionConnection, insertDocument, dbConfig} from "./mongoDB";
import { MongoClient } from "mongodb";

const app = express();
const port = 3000;


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
    id: articalId,
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
  console.log('client: ', client);
  // const database: ArticalType[]  = [];
  const dbPromises = [];
  const links = await articalLinks(_scrapeWebsiteLink)
  // const failedLinks: string[] = []
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

// 12 hours update time - 43_200_000
setInterval(updateDatabase, 43_200_000)


app.get("/", async (req, res, next) => {
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

