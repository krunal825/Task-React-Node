import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

import authRoutes from './src/routes/authRoutes.js';
import userRoutes from './src/routes/userRoutes.js';

const app = express();

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json()); 

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
