const express = require('express');
const path = require('path');

const app = express();

app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});


app.post('/calculate-bmi', (req, res) => {
  const weight = parseFloat(req.body.weight);
  const heightCm = parseFloat(req.body.height);

  if (weight <= 0 || heightCm <= 0) {
    return res.send('<p style="color:red;">Invalid input</p><a href="/">Back</a>');
  }

  const heightM = heightCm / 100;
  const bmi = weight / (heightM * heightM);

  let category = '';
  let color = '';

  if (bmi < 18.5) {
    category = 'Underweight';
    color = '#cce5ff';
  } else if (bmi < 24.9) {
    category = 'Normal';
    color = '#c8f7c5';
  } else if (bmi < 29.9) {
    category = 'Overweight';
    color = '#fff3b0';
  } else {
    category = 'Obese';
    color = '#f7c5c5';
  }

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>BMI Result</title>
      <style>
        body {
          font-family: Arial;
          background: #f4f6f8;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
        }
        .card {
          background: white;
          padding: 25px;
          border-radius: 10px;
          width: 320px;
          text-align: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .result {
          margin-top: 15px;
          padding: 12px;
          border-radius: 6px;
          background: ${color};
          font-weight: bold;
        }
        a {
          display: inline-block;
          margin-top: 15px;
        }
      </style>
    </head>
    <body>
      <div class="card">
        <h2>Result</h2>
        <div class="result">
          BMI: ${bmi.toFixed(2)}<br>
          ${category}
        </div>
        <a href="/">Calculate again</a>
      </div>
    </body>
    </html>
  `);
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
