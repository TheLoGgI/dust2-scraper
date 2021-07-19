# Dust2 scraper and API endpoint

This was a small project for me, to get my hands dirty in different libraries.
Some libraries I have used before, but never got the point I felt comfortable by using it. So I wanted to get a good grip on the technologies so I understand them better.

 I used:
 - ExpressJs - To create an api endpoint and server side requests
 - Node Fetch - To fetch the site document
 - Cheerio - To parse the document and find the elements with relevant data
 - MongoDB - To connect and control my MongoCluster
 - Dotenv - For keeping tokens secret

It started out has a project with using the FileSystem to read and write data. Some errors I couldn't figure out, so I evolved the project to include MongoDB insted. Which I never had worked with before.
My code for Read & Write is in the CRUDFile

In my internship I was stuggleing with typescript, so I desided I wanted to addopted in this project to get my feets more wet. Which also gave me a better understanding, even though "any" is a timesaver. 

## Coming soon

- Hosting at [Vercel](https://vercel.com/)

## mongodb v3.6.4 error

```
"Warning: Accessing non-existent property ‘MongoError’ of module exports inside circular dependency (Use node --trace-warnings ... to show where the warning was created)"
```