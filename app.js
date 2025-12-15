const express = require('express');
const app = express();

app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.send(`
    <form method="POST" action="/calculate-bmi">
      <input name="weight" type="number" step="0.1" placeholder="Weight" required />
      <input name="height" type="number" step="0.01" placeholder="Height" required />
      <button type="submit">Calculate BMI</button>
    </form>
  `);
});

app.post('/calculate-bmi', (req, res) => {
    const { weight, height } = req.body;

    const bmi = weight / ((height / 100) * (height / 100));
    let category = '';

    if (bmi < 18.5) category = 'Underweight';
    else if (bmi < 24.9) category = 'Normal';
    else if (bmi < 29.9) category = 'Overweight';
    else category = 'Obese';

    res.send(`BMI: ${bmi.toFixed(2)} (${category})`);
});

app.listen(3000, () => console.log('OK'));
