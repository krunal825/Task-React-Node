import { compare, hash } from 'bcrypt';
import { query } from '../config/db.config.js';
const JWT_SECRET = 'secret_key';
import jwt from 'jsonwebtoken'; 

export async function login(req, res) {
    const { email, password } = req.body;

    const sql = 'SELECT * FROM user WHERE email = ?';
    query(sql, [email], async (error, results) => {
        if (error) {
            return res.status(500).json({ error: 'Internal server error' });
        }

        if (results.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = results[0];

        const isPasswordMatch = await compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });

        res.status(200).json({ message: 'Login successful', token, email: user.email });
    });
}

export async function signup(req, res) {
    const { email, password, confirmPassword } = req.body;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;   

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
        query(checkQuery, [email], async (err, result) => {
            if (err) {
                console.error('Error checking existing user:', err);
                return res.status(500).json({ error: "An error occurred while checking existing user" });
            }

            if (result.length > 0) {
                return res.status(409).json({ error: "User already exists please login" });
            }

            const hashedPassword = await hash(password, 10);

            const insertQuery = 'INSERT INTO user (email, password) VALUES (?, ?)';
            query(insertQuery, [email, hashedPassword], (err, result) => {
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
}
