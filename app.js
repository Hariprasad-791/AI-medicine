const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const { predictMedicineQuality } = require('./mlModel');  // Import the ML model

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

// Set up MySQL connection with provided credentials
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'rakshu',
  database: 'medicine'
});

// Connect to MySQL
db.connect((err) => {
  if (err) {
    console.error('Database connection failed: ', err);
  } else {
    console.log('Connected to the database');
  }
});

// API to fetch medicine details and feed data into the ML model
app.post('/getMedicineDetails', (req, res) => {
  const { medicine_id, medicine_name } = req.body;

  const query = 'SELECT * FROM medata WHERE medicine_id = ? OR medicine_name = ?';
  db.query(query, [medicine_id, medicine_name], (err, result) => {
    if (err) {
      res.status(500).send('Error fetching data');
    } else {
      const medicineData = result[0];
      // Feed data into the ML model for prediction
      const prediction = predictMedicineQuality(medicineData);
      res.json({
        medicineData,
        prediction
      });
    }
  });
});

// API to handle chatbot query
app.post('/chatbotQuery', (req, res) => {
  const { query } = req.body;
  let response;

  if (query.toLowerCase().includes('headache')) {
    response = 'You may be experiencing a tension headache. Please consult a healthcare provider for further advice.';
  } else if (query.toLowerCase().includes('fever')) {
    response = 'A fever might indicate an infection. Stay hydrated and consult a doctor if symptoms persist.';
  } else {
    response = 'Based on your symptoms, please seek professional medical advice.';
  }

  res.json({ response });
});

// API to place an order for medicine
app.post('/orderMedicine', (req, res) => {
  const { medicine_id, quantity } = req.body;

  const orderQuery = 'INSERT INTO orders (medicine_id, quantity) VALUES (?, ?)';
  db.query(orderQuery, [medicine_id, quantity], (err, result) => {
    if (err) {
      res.status(500).send('Error placing order');
    } else {
      res.json({ message: 'Order successfully placed!' });
    }
  });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
