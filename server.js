const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); 
const app = express();
const JWT_SECRET = 'secret_key';

const PORT = process.env.PORT || 3000;

// SQL connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Krunal@825',
  database: 'user-crud'
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL database:', err);
    return;
  }
  console.log('Connected to MySQL database');
});

app.use(cors());
app.use(bodyParser.json());

// Regular expressions for email and password validation
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

//  to create a new user
app.post('/api/user', async (req, res) => {
  const { email, password, confirmPassword } = req.body;

  // Validation
  if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
  }

  if (!passwordRegex.test(password)) {
      return res.status(400).json({ error: "Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)" });
  }

  if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
  }

  try {
      const checkQuery = 'SELECT * FROM user WHERE email = ?';
      db.query(checkQuery, [email], async (err, result) => {
          if (err) {
              console.error('Error checking existing user:', err);
              return res.status(500).json({ error: "An error occurred while checking existing user" });
          }

          if (result.length > 0) {
              return res.status(409).json({ error: "User already exists please login" });
          }

          const hashedPassword = await bcrypt.hash(password, 10);

          const insertQuery = 'INSERT INTO user (email, password) VALUES (?, ?)';
          db.query(insertQuery, [email, hashedPassword], (err, result) => {
              if (err) {
                  console.error('Error inserting user data:', err);
                  return res.status(500).json({ error: "An error occurred while saving user data" });
              }
              console.log('User data inserted successfully');
              res.status(200).json({ message: "User created successfully", user: { email } });
          });
      });
  } catch (error) {
      console.error('Error hashing password:', error);
      return res.status(500).json({ error: "An error occurred while hashing password" });
  }
});


app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  const sql = 'SELECT * FROM user WHERE email = ?';
  db.query(sql, [email], async (error, results) => {
    if (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (results.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = results[0];

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({ message: 'Login successful', token,email: user.email });
  });
});



const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];
console.log(token,"token");
  if (!token) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
          return res.status(401).json({ error: 'Unauthorized: Invalid token' });
      }
console.log(decoded,"jhsdjDEcode");
      req.userId = decoded.userId;
      next();
  });
};



//  updating user password
app.put('/api/user/password', verifyToken, async (req, res) => {
  const { email, currentPassword, newPassword, confirmNewPassword } = req.body;

  try {
    // Retrieve user data from the database
    const query = 'SELECT * FROM user WHERE email = ?';
    db.query(query, [email], async (err, result) => {
      if (err) {
        console.error('Error retrieving user data:', err);
        return res.status(500).json({ error: "An error occurred while retrieving user data" });
      }
      if (result.length === 0) {
        return res.status(401).json({ error: "User not found" });
      }

      const user = result[0];

      const passwordMatch = await bcrypt.compare(currentPassword, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ error: "Current password is incorrect" });
      }

      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

      if (newPassword !== confirmNewPassword) {
        return res.status(400).json({ error: "New password and confirm new password do not match" });
      }

      if (!passwordRegex.test(newPassword)) {
        return res.status(400).json({ error: "New password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)" });
      }

      const hashedNewPassword = await bcrypt.hash(newPassword, 10);

      const updateQuery = 'UPDATE user SET password = ? WHERE email = ?';
      db.query(updateQuery, [hashedNewPassword, email], (err, result) => {
        if (err) {
          console.error('Error updating password:', err);
          return res.status(500).json({ error: "An error occurred while updating password" });
        }
        res.status(200).json({ message: "Password updated successfully" });
      });
    });
  } catch (error) {
    console.error('Error updating password:', error);
    return res.status(500).json({ error: "An error occurred while updating password" });
  }
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
