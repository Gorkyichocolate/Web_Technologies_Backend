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

  const heightM = heightCm / 100; // ← ключевой момент
  const bmi = weight / (heightM * heightM);

  let category = '';
  let cssClass = '';

  if (bmi < 18.5) {
    category = 'Underweight';
    cssClass = 'underweight';
  } else if (bmi < 24.9) {
    category = 'Normal';
    cssClass = 'normal';
  } else if (bmi < 29.9) {
    category = 'Overweight';
    cssClass = 'overweight';
  } else {
    category = 'Obese';
    cssClass = 'obese';
  }

  res.send(`
    <div style="font-family:Arial; text-align:center; margin-top:50px;">
      <h2>Result</h2>
      <div class="${cssClass}" style="padding:10px; border-radius:6px;">
        BMI: ${bmi.toFixed(2)}<br>${category}
      </div>
      <br>
      <a href="/">Calculate again</a>
    </div>
  `);
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
