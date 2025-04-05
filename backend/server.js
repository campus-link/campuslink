require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

db.connect(err => {
    if (err) {
        console.error("❌ MySQL Connection Error:", err);
        process.exit(1);
    }
    console.log('✅ MySQL Connected...');
});

// ✅ Admin Login
app.post('/admin/login', async (req, res) => {
    const { username, password } = req.body;

    db.query('SELECT * FROM admins WHERE username = ?', [username], async (err, results) => {
        if (err) return res.status(500).json({ message: "Server error" });
        if (results.length === 0) return res.status(401).json({ message: "Invalid credentials" });

        const admin = results[0];
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

        const token = jwt.sign({ username: admin.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    });
});

// ✅ Token Verification
app.post("/admin/verify", (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Unauthorized: No token provided" });

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(403).json({ message: "Invalid token" });
        res.json({ message: "Authorized", user: decoded.username });
    });
});

// ✅ CRUD APIs for Users

// CREATE User
app.post('/users', (req, res) => {
    const { name, email, role } = req.body;
    db.query('INSERT INTO users (name, email, role) VALUES (?, ?, ?)', [name, email, role], (err, result) => {
        if (err) return res.status(500).json({ message: "Error creating user" });
        res.json({ id: result.insertId, name, email, role });
    });
});

// READ All Users
app.get('/users', (req, res) => {
    db.query('SELECT * FROM users', (err, results) => {
        if (err) return res.status(500).json({ message: "Error fetching users" });
        res.json(results);
    });
});

// UPDATE User
app.put('/users/:id', (req, res) => {
    const { id } = req.params;
    const { name, email, role } = req.body;
    db.query('UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?', [name, email, role, id], (err) => {
        if (err) return res.status(500).json({ message: "Error updating user" });
        res.json({ id, name, email, role });
    });
});

// DELETE User
app.delete('/users/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM users WHERE id = ?', [id], (err) => {
        if (err) return res.status(500).json({ message: "Error deleting user" });
        res.json({ message: "User deleted", id });
    });
});

app.listen(5000, () => {
    console.log('🚀 Server running on port 5000');
});
