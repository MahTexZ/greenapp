const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg'); // Use pg for PostgreSQL
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config(); // Load environment variables

const app = express();

// Middleware for parsing JSON bodies
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

// Set up PostgreSQL connection pool
const pool = new Pool({
  user: process.env.PG_USER || 'mysql_304b_user',
  host: process.env.PG_HOST || 'dpg-copmjasf7o1s73e2imig-a.oregon-postgres.render.com',
  database: process.env.PG_DATABASE || 'mysql_304b',
  password: process.env.PG_PASSWORD || 'ZvV3PYTEyVihq23dMOLoayg7K5j0xeyG',
  port: process.env.PG_PORT || 5432, // Default PostgreSQL port
});

// Check PostgreSQL connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to PostgreSQL:', err.message);
  } else {
    console.log('Connected to PostgreSQL');
    release(); // Release the client back to the pool
  }
});

// Root route for testing
app.get('/', (req, res) => {
  res.send('Welcome to the PostgreSQL backend!');
});

// Register user endpoint
app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    // Use PostgreSQL query with parameterized inputs to prevent SQL injection
    const insertQuery = `
      INSERT INTO users (username, password)
      VALUES ($1, $2)
      RETURNING id
    `;

    pool.query(
      insertQuery,
      [username, hashedPassword],
      (err, result) => {
        if (err) {
          return res.status(400).json({ error: 'User registration failed', details: err.message });
        }

        res.status(201).json({ message: 'User registered successfully!', userId: result.rows[0].id });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Login user endpoint
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  // Fetch the user from PostgreSQL
  const selectQuery = `
    SELECT * FROM users WHERE username = $1
  `;

  pool.query(
    selectQuery,
    [username],
    async (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Server error', details: err.message });
      }

      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const user = result.rows[0];
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate JWT
      const token = jwt.sign(
        { userId: user.id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      res.status(200).json({ token });
    }
  );
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
