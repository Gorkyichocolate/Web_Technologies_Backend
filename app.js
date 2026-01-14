require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/randomuser', async (req, res) => {
  try {
    const { data } = await axios.get('https://randomuser.me/api/');
    const user = data.results[0];

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
      countryCode: user.nat.toLowerCase()
    };

    res.json(userData);
  } catch {
    res.status(500).json({ error: 'Random user error' });
  }
});


app.get('/countries', async (req, res) => {
  const { country, code } = req.query;

  if (!country) {
    return res.status(400).json({ error: 'country required' });
  }

  try {

    if (process.env.COUNTRYLAYER_API_KEY) {
      const { data } = await axios.get(
        `https://api.countrylayer.com/v2/name/${country}`,
        {
          params: {
            access_key: process.env.COUNTRYLAYER_API_KEY,
            fullText: true
          }
        }
      );

      const c = data[0] || {};
      const countryData = {
        name: c.name || country,
        capital: c.capital || 'N/A',
        languages: Array.isArray(c.languages) ? c.languages.map(l => l.name).join(', ') : 'N/A',
        currencyCode: (c.currencies && c.currencies[0] && c.currencies[0].code) ? c.currencies[0].code : 'N/A',
        flag: code ? `https://flagcdn.com/w320/${code}.png` : (c.flag || '')
      };

      return res.json(countryData);
    }

    const { data } = await axios.get(`https://restcountries.com/v3.1/name/${encodeURIComponent(country)}?fullText=true`);
    const c = Array.isArray(data) ? data[0] : data;

    const languages = c && c.languages ? Object.values(c.languages).join(', ') : 'N/A';
    let currencyCode = 'N/A';
    if (c && c.currencies) {
      const codes = Object.keys(c.currencies);
      if (codes.length) currencyCode = codes[0];
    }

    const flag = (c && c.flags && (c.flags.png || c.flags.svg)) ? (c.flags.png || c.flags.svg) : (code ? `https://flagcdn.com/w320/${code}.png` : '');

    const countryData = {
      name: c && c.name && (c.name.common || c.name.official) || country,
      capital: (c && c.capital && c.capital[0]) || 'N/A',
      languages,
      currencyCode,
      flag
    };

    res.json(countryData);
  } catch (err) {
    console.error('Countries error:', err && err.response ? err.response.data || err.response.statusText : err.message);
    res.status(500).json({ error: 'Country error', details: (err && err.message) || '' });
  }
});


app.get('/exchange-rate', async (req, res) => {
  const { currency } = req.query;

  if (!currency) {
    return res.status(400).json({ error: 'currency required' });
  }

  try {
    const { data } = await axios.get(
      `https://v6.exchangerate-api.com/v6/${process.env.EXCHANGE_RATE_API_KEY}/latest/${currency}`
    );

    res.json({
      base: currency,
      usd: data.conversion_rates.USD.toFixed(2),
      kzt: data.conversion_rates.KZT.toFixed(2)
    });
  } catch {
    const err = arguments[0] || new Error('unknown');
    console.error('Exchange-rate error:', err && err.response ? err.response.data || err.response.statusText : err.message);
    res.status(500).json({ error: 'Exchange rate error', details: (err && err.message) || '' });
  }
});


app.get('/news', async (req, res) => {
  const { country } = req.query;

  if (!country) {
    return res.status(400).json({ error: 'country required' });
  }

  try {
    const { data } = await axios.get(
      'https://newsapi.org/v2/everything',
      {
        params: {
          q: country,
          language: 'en',
          pageSize: 5,
          apiKey: process.env.NEWS_API_KEY
        }
      }
    );

    const news = data.articles.map(a => ({
      title: a.title,
      description: a.description,
      url: a.url,
      image: a.urlToImage,
      date: a.publishedAt
    }));

    res.json(news);
  } catch {
    res.status(500).json({ error: 'News error' });
  }
});

app.get('/api/random-user', async (req, res) => {
  try {
    const user = await axios.get('http://localhost:' + PORT + '/randomuser')
      .then(r => r.data);

    const country = await axios.get(
      `http://localhost:${PORT}/countries?country=${user.country}&code=${user.countryCode}`
    ).then(r => r.data);

    const exchange = await axios.get(
      `http://localhost:${PORT}/exchange-rate?currency=${country.currencyCode}`
    ).then(r => r.data);

    const news = await axios.get(
      `http://localhost:${PORT}/news?country=${user.country}`
    ).then(r => r.data);

    res.json({
      user,
      country,
      exchange,
      news
    });

  } catch (err) {
    res.status(500).json({ error: 'Aggregator error' });
  }
});


app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
