import express, { Application, Request, Response, NextFunction } from "express";
import fetch from "node-fetch";
import cheerio from "cheerio";
// import mongoDB from 'mongodb'
import fs from 'fs'


import {DocType, ArticalType, DocDataType} from "./types";

// import { client } from "./mongoDB";

const app = express();
const port = 3000;

// client.connect((err: any) => {
//   const db = client.db("sample_analytics");
//   const collection = db.collection("customers");
//   collection.find({}).toArray(function (err: any, docs: any) {
//     //   assert.equal(err, null);
//     console.log("Found the following records");
//     console.log(docs);
//     //   callback(docs);
//   });

//   // findDocuments(db)
//   client.close();
// });

let isScraping = true;

async function scrape(url: string) {
  const res = await fetch(url, {
      method: "get",
      headers: { "Content-Type": "text/html" },
    });
    
    return {
        data: res.status === 200 ? res.text() : undefined,
        status: res.status,
        error: res.statusText
      }


}

async function articalLinks(url: string): Promise<string[] | undefined> {
  const doc: DocType = await scrape(url)
  if (doc.status === 200) {
      const $ = cheerio.load(doc.data as any)
      const hrefs = $(".mediumNewsCon a").map((index, element: cheerio.TagElement | any ): string | undefined => {
        if (element.name === "a" && element.attribs) {
          return url + element.attribs.href;
        }
      })
      
      return hrefs.toArray() as unknown as string[]
  }

}

function getArticalId(url: string): string {
    // @ts-ignore
    return url.match(/\/(\w+)-/)[1]
}

async function scrapeArtical(url: string): Promise<ArticalType | null> {
  const doc: DocType = await scrape(url);
  if (doc.status !== 200) return null
  const $ = cheerio.load(doc.data as any)
  const bodyList: string[] = []

  const heading = $(".headline").text();
  const subTitle = $(".headtext").text();
  const author = $(".author").text();
  const date = $(".date").text().trim();
  $(".text p").each((index, element: cheerio.TagElement | any) => {
    if (element.name === "p" && element.children.length === 1) {
      if (element.children[0].data === " ") return;
      bodyList.push(element.children[0].data);
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
  // CREATE: new JSON file object
  fs.readFile(fileName, "utf8", (err: any, file) => {
    if (!file) {
      console.log("No file data", file);
      const json = JSON.stringify([data]);
      fs.writeFile(fileName, json, "utf8", function (err) {
        if (err) return console.log(err);
        console.log("Created new file data");
      });
      return;
    }

    // UPDATE: Push artical object to file
    const fileObj = JSON.parse(file);
    const hasArticalData = fileObj.some((filedata: ArticalType) => filedata.id === data.id);
    if (!hasArticalData) {
      fileObj.push(data);
      const json = JSON.stringify(fileObj);
      fs.writeFile(fileName, json, "utf8", function (err) {
        if (err) return console.log(err);
        console.log("File updated");
      });
    } else {
      console.log("Data already exists in file", data.id);
    }
  });
}

async function writeDatabase() {
  const database: ArticalType[]  = [];
  const links = await articalLinks("https://www.dust2.dk")
  if (links !== undefined) {
      links.forEach(async (link) => {
        const artical = await scrapeArtical(link as string);
        if (artical) {
          database.push(artical);
          writeJSON("artical.json", artical);
        }
      });
      isScraping = false;
      return database;
  }
}

app.get("/", async (req, res) => {
  const database = await writeDatabase();
    if (database) {
        if (!isScraping) console.log(database);
      
        
        res.send(`<pre> ${JSON.stringify(database, null, "\t")} <pre/>`);
    }
    res.send(`<pre> ${JSON.stringify({
        status: 'Database was not written' 
    }, null, "\t")} <pre/>`);
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
