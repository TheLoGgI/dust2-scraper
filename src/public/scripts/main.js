// @ts-ignore
import "bootstrap";
import "bootstrap/dist/css/bootstrap.css"; // Import precompiled Bootstrap css
import jade from "jade"
// import "../style/main.scss";

async function fetchArticalData() {
    const data = await (await fetch('http://localhost:3000/api/articals'))
    console.log('data: ', data);
    return data
}

// fetchArticalData()

fetch('http://localhost:3000/api/articals')
.then(res => {
    console.log(res);
    return res.json()
}).then(data => {
    console.log(data);
})

// const template = jade.compile()
