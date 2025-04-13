require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));
 // simplified path

// 📦 MySQL Connection (Persistent)
let con;

async function connectDB() {
  try {
    con = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306
    });
    console.log("✅ MySQL connected");
  } catch (err) {
    console.error("❌ Database connection failed:", err);
    process.exit(1);
  }
}

connectDB();

// 🔐 Admin Login
app.post('/admin/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const [results] = await con.query('SELECT * FROM admins WHERE username = ?', [username]);

    if (results.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const admin = results[0];
    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ username: admin.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (err) {
    console.error("❌ Admin login error:", err.message);
    res.status(500).json({ message: "Something went wrong!" });
  }
});

// 🛡️ Token Verification
app.post('/admin/verify', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized: No token provided' });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    res.json({ message: 'Authorized', user: decoded.username });
  });
});

// 👤 CREATE User
app.post('/users', async (req, res) => {
  try {
    const { name, email, role, password } = req.body;
    if (!password) return res.status(400).json({ message: "Password is required" });

    const [result] = await con.query(
      'INSERT INTO users (name, email, role, password) VALUES (?, ?, ?, ?)',
      [name, email, role, password]
    );

    res.json({ id: result.insertId, name, email, role });
  } catch (err) {
    console.error("❌ Error creating user:", err.message);
    res.status(500).json({ message: "Error creating user" });
  }
});

// 📄 READ Users
app.get('/users', async (req, res) => {
  try {
    const [results] = await con.query('SELECT * FROM users');
    res.json(results);
  } catch (err) {
    console.error("❌ Fetch error:", err.message);
    res.status(500).json({ message: "Error fetching users" });
  }
});

// ✏️ UPDATE User
app.put('/users/:id', async (req, res) => {
  const { name, email, role, password } = req.body;
  const { id } = req.params;

  try {
    let query = '';
    let values = [];

    if (password && password.trim() !== '') {
      query = 'UPDATE users SET name = ?, email = ?, role = ?, password = ? WHERE id = ?';
      values = [name, email, role, password, id];
    } else {
      query = 'UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?';
      values = [name, email, role, id];
    }

    const [result] = await con.query(query, values);
    res.json({ message: 'User updated successfully', result });
  } catch (err) {
    console.error("❌ Update error:", err.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// 🗑️ DELETE User
app.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await con.query('DELETE FROM users WHERE id = ?', [id]);
    res.json({ message: "User deleted", id });
  } catch (err) {
    console.error("❌ Delete error:", err.message);
    res.status(500).json({ message: "Error deleting user" });
  }
});

// 🚀 Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
