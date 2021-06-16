import fs from 'fs'
import { scrape,
    articalLinks,
    getArticalId,
    scrapeArtical
} from ".";
import { ArticalType} from "../types";
import express, { Application, Request, Response, NextFunction } from "express";

const app = express();

const _fileName = `artical.json`
const _scrapeWebsiteLink = 'https://www.dust2.dk' 

function writeJSON(fileName = "data.json", data: ArticalType) {

  const rawFileData = fs.readFileSync(fileName)
  return new Promise((resolve, reject) => {
    // CREATE: new JSON file object
    if (rawFileData.length < 2) {
      console.log('First artical', data.id)
      const json = JSON.stringify([data])
      console.log('json: ', json);
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
  
      for (const link of links) {
        // - Check if articale have been scraped before
            // If not scrape the articale and put it in DB
            // Else skip scraping
            // Contenue loop
  
        const artical = await scrapeArtical(link)
          if (artical) {
              database.push(artical)
              await writeJSON(_fileName, artical).catch((error) => {
                  console.log('Failed at writing data to JSON, ', error);
                  failedLinks.push(link)
                })
              }
            }
          }
          
    // @ts-ignore
    const databaseWriteStatus = await Promise.allSettled(dbPromises)
    console.log('databaseWriteStatus: ', databaseWriteStatus);
  
  }

  app.get("/file", async (req, res, next) => {
    
    const rawFileData = fs.readFileSync(_fileName)
    const fileJson: ArticalType[] = JSON.parse(rawFileData.toString())
  
      res.type('application/json')
      res.status(200).send(fileJson)
  });