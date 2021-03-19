import express, { Application, Request, Response, NextFunction } from "express";
import fetch from "node-fetch";
import cheerio from "cheerio";
import fs from 'fs'


import {DocType, ArticalType, DocDataType} from "./types";

// import { main } from "./mongoDB";

const app = express();
const port = 3000;

app.use(writeDatabase)

const _fileName = `artical.json`
const _scrapeWebsiteLink = 'https://www.dust2.dk' 

let isScraping = true;

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

  const heading = $(".headline").text()
  const subTitle = $(".headtext").text()
  const author = $(".author").text()
  const date = $(".date").text().trim()
  $(".text p").each((index, element: cheerio.TagElement | any) => {
    if (element.name === "p" && element.children.length === 1) {
      if (element.children[0].data === undefined || element.children[0].data === ' ') return
      bodyList.push(element.children[0].data)
    }
  });

  return {
    id: getArticalId(url),
    heading,
    subTitle,
    author,
    date,
    body: bodyList,
  }
}

function writeJSON(fileName = "data.json", data: ArticalType) {

  const rawFileData = fs.readFileSync(fileName)
  return new Promise((resolve, reject) => {
    // CREATE: new JSON file object
    if (rawFileData.length < 2) {
      console.log('First artical', data.id)
      const json = JSON.stringify([data])
      fs.writeFile(fileName, json, 'utf8', (err) => {
      console.warn('Initial File WRITE: ', err)
      reject(err)
    })
      resolve("Success!")
    } 
  
    // Else check data don't exist in file
    const fileJson: ArticalType[] = JSON.parse(rawFileData.toString())
    console.log('fileJson isArray: ', Array.isArray(fileJson));
    const hasArticalData = fileJson.some((fileJson) => fileJson.id === data.id )
      
    if (!hasArticalData) {
      console.log('Next artical', data.id)
        fileJson.push(data)
        const json = JSON.stringify(fileJson)
        fs.writeFile(fileName, json, 'utf8', function(err){
        if(err) return console.warn('file could not be written', err)
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

async function writeDatabase(req: Request, res: Response, next: NextFunction) {
  const database: ArticalType[]  = [];
  const links = await articalLinks(_scrapeWebsiteLink)
  const failedLinks: string[] = []
  if (links.length > 0) {
    links.forEach(async link => {
      const artical = await scrapeArtical(link)
      if (artical) {
        database.push(artical)
        await writeJSON(_fileName, artical).catch((e) => {
          console.error(e)
          failedLinks.push(link)
        })
      }
      
    })
    isScraping = false
  }
  console.log('failedLinks: ', failedLinks)
  isScraping = false
  next()
}

app.get("/", async (req, res, next) => {

  const rawFileData = fs.readFileSync(_fileName)
  const fileJson: ArticalType[] = JSON.parse(rawFileData.toString())
    console.log('fileJson: ', fileJson)
    
    res.type('application/json')
    res.send(fileJson)

});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
