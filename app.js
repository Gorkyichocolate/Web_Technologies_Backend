require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

const RANDOM_USER_API_KEY = process.env.RANDOM_USER_API_KEY;
const COUNTRIES_API_KEY = process.env.COUNTRIES_API_KEY;
const EXCHANGE_RATE_API_KEY = process.env.EXCHANGE_RATE_API_KEY;
const NEWS_API_KEY = process.env.NEWS_API_KEY;

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});


app.get('/randomuser', async (req, res) => {
  const userResponse = await axios.get(`https://api.randomuser.me/?key=${RANDOM_USER_API_KEY}`);
  const user = userResponse.data.results[0];

  const userData = {
    firstName: user.name.first,
    lastName: user.name.last,
    gender: user.gender,
    profilePic: user.picture.large,
    age: user.dob.age,
    dob: user.dob.date,
    city: user.location.city,
    country: user.location.country,
    address: `${user.location.street.number} ${user.location.street.name}`,
    countryCode: user.nat
  };
});


app.get('/countries', async (req, res) => {
  const countryResponse = await axios.get(`https://api.countrylayer.com/v2/name/${userData.country}?access_key=${process.env.COUNTRYLAYER_API_KEY}&fullText=true`);
  const cInfo = countryResponse.data[0] || {};

  const countryData = {
    capital: cInfo.capital || 'N/A',
    languages: cInfo.languages ? cInfo.languages.map(l => l.name).join(', ') : 'N/A',
    currencyCode: cInfo.currencies ? cInfo.currencies[0].code : 'USD',
    flag: `https://flagcdn.com/w320/${userData.countryCode}.png`
  };
});


app.get('/exchange-rate', async (req, res) => {
  const exchangeResponse = await axios.get(`https://v6.exchangerate-api.com/v6/${process.env.EXCHANGERATE_API_KEY}/latest/${countryData.currencyCode}`);
  const rates = exchangeResponse.data.conversion_rates;
  const exchangeData = {
    usd: rates ? rates.USD.toFixed(2) : 'N/A',
    kzt: rates ? rates.KZT.toFixed(2) : 'N/A',
    base: countryData.currencyCode
  };
});


app.get('/news', async (req, res) => {
  const newsResponse = await axios.get(`https://newsapi.org/v2/top-headlines?country=${userData.countryCode}&apiKey=${NEWS_API_KEY}`);
  const articles = newsResponse.data.articles.slice(0, 5);

  const newsData = articles.map(article => ({
    title: article.title,
    description: article.description,
    url: article.url,
    imageUrl: article.urlToImage
  }));

  res.json({
    user: userData,
    country: countryData,
    exchangeRate: exchangeData,
    news: newsData
  });
});



app.listen(3000, () => {
  console.log('Server running on port 3000');
});
