const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
// const fetch = require('node-fetch');
// const axios = require('axios');
// const fs = require('fs');
const cors = require('cors');
const { rates } = require('./rates');

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



//exchange rate API
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// API Endpoint: /api/exchange?from=USD&to=EUR&amount=100
app.get('/api/exchange', (req, res) => {
  const from = req.query.from?.toUpperCase();
  const to = req.query.to?.toUpperCase();
  const amount = parseFloat(req.query.amount);

  if (!from || !to || isNaN(amount)) {
    return res.status(400).json({ error: "Missing or invalid 'from', 'to', or 'amount' parameter." });
  }

  if (!rates[from] || !rates[to]) {
    return res.status(404).json({ error: `Currency not supported: ${from} or ${to}` });
  }

  // USD-based conversion logic
  const baseToFrom = 1 / rates[from];      // Convert FROM to USD
  const rate = baseToFrom * rates[to];     // Convert USD to TO
  const convertedAmount = rate * amount;   // Final conversion

  res.json({
    from,
    to,
    amount: parseFloat(amount.toFixed(2)),
    rate: parseFloat(rate.toFixed(4)),
    converted: parseFloat(convertedAmount.toFixed(2)),
    date: new Date().toISOString().split('T')[0]
  });
});




app.listen(port, () =>{
    console.log(`Server running on ${port}`);
})