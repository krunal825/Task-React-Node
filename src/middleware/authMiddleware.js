import jwt from 'jsonwebtoken'; 
const JWT_SECRET = 'secret_key';
export function verifyToken(req, res, next) {
    const token = req.headers['authorization'];
    console.log(token, "token");
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: 'Unauthorized: Invalid token' });
        }
        console.log(decoded, "decoded");
        req.userId = decoded.userId;
        next();
    });
}

