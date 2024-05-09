// const express = require('express');
// const bodyParser = require('body-parser');
// const mysql = require('mysql2');
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const dotenv = require('dotenv');

const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg'); // Use pg to connect to PostgreSQL
const dotenv = require('dotenv');

dotenv.config();

const app = express();

app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


// const db = mysql.createConnection({
//   host: process.env.MYSQL_HOST,
//   user: process.env.MYSQL_USER,
//   password: process.env.MYSQL_PASSWORD,
//   database: process.env.MYSQL_DATABASE,
// });

const pool = new Pool({
  user: process.env.PG_USER || 'mysql_304b_user',
  host: process.env.PG_HOST || 'dpg-copmjasf7o1s73e2imig-a.oregon-postgres.render.com',
  database: process.env.PG_DATABASE || 'mysql_304b',
  password: process.env.PG_PASSWORD || 'ZvV3PYTEyVihq23dMOLoayg7K5j0xeyG',
  port: process.env.PG_PORT || 5432, 
});


// db.connect((err) => {
//   if (err) {
//     console.error('Error connecting to MySQL:', err);
//   } else {
//     console.log('Connected to MySQL');
//   }
// });

// db.connect((err) => {
//   if (err) {
//     console.error('Error connecting to MySQL:', err.message);
//   } else {
//     console.log('Connected to MySQL');
//   }
// });

pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to PostgreSQL:', err.message);
  } else {
    console.log('Connected to PostgreSQL');
    release(); // Release the client back to the pool
  }
});

app.get('/', (req, res) => {
  res.send('Welcome to the PostgreSQL backend!');
});


app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    db.query(
      'INSERT INTO users (username, password) VALUES (?, ?)',
      [username, hashedPassword],
      (err, result) => {
        if (err) {
          return res.status(400).json({ error: 'User registration failed' });
        }

        res.status(201).json({ message: 'User registered successfully!' });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});


app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  db.query(
    'SELECT * FROM users WHERE username = ?',
    [username],
    async (err, results) => {
      if (err) {
        return res.status(500).json({ error: 'Server error' });
      }

      if (results.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const user = results[0];
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { userId: user.id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      res.json({ token });
    }
  );
});
