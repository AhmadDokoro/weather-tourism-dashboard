const express = require('express');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();
const app = express();

//make it to serve static files
app.use(express.static(path.join(__dirname, 'public')));

const port = process.env.PORT || 3000;
const apiKey = process.env.WEATHER_API_KEY;
const Base_url = process.env.BASE_URL;

//first page
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname,'public/landingPage.html'));
});




//home page
app.get("/home", (req, res)=>{
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

//Search
app.get("/search", (req, res)=>{
    res.sendFile(path.join(__dirname, 'public/search.html'));
});








app.get("/weather", async(req, res)=>{
    const city = req.query.city;
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&APPID=${apiKey}`;

    try{
        const response = await fetch(url);
        const data = await response.json();

        res.send(data);
    }catch(err){
        console.log("An error occured while fetching weather information: ",err);
    }
   
});







app.listen(port, () =>{
    console.log(`Server running on ${port}`);
})