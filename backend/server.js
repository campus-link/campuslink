require('dotenv').config(); // Load environment variables at the start

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path'); // Add path for static files

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Serve static files
app.use(express.static(path.join(__dirname, "../public"))); 

// ✅ Database Connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

db.connect(err => {
    if (err) {
        console.error("❌ MySQL Connection Error:", err);
        process.exit(1); // Stop server if DB connection fails
    }
    console.log('✅ MySQL Connected...');
});

// ✅ Admin Login API
app.post('/admin/login', async (req, res) => {
    const { username, password } = req.body;

    console.log("📥 Login Attempt:", { username });

    db.query('SELECT * FROM admins WHERE username = ?', [username], async (err, results) => {
        if (err) {
            console.error("❌ Database Error:", err);
            return res.status(500).json({ message: "Server error" });
        }

        if (results.length === 0) {
            console.log("⚠️ User not found:", username);
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const admin = results[0];

        console.log("🔑 Checking password for:", username);

        const isMatch = await bcrypt.compare(password, admin.password);

        if (!isMatch) {
            console.log("❌ Password mismatch for:", username);
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // ✅ Generate JWT Token
        const token = jwt.sign({ username: admin.username }, process.env.JWT_SECRET, { expiresIn: '1h' });

        console.log("✅ Login successful for:", username);

        res.json({ token });
    });
});

// ✅ Token Verification API
app.post("/admin/verify", (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        console.log("⚠️ No token provided!");
        return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            console.log("❌ Token verification failed:", err.message);
            return res.status(403).json({ message: "Invalid token" });
        }

        console.log("✅ Token verified:", decoded);
        res.json({ message: "Authorized", user: decoded.username });
    });
});

// ✅ Start Server
app.listen(5000, () => {
    console.log('🚀 Server running on port 5000');
    console.log("🔑 JWT Secret:", process.env.JWT_SECRET ? "Loaded ✅" : "❌ Not Found!");
});
