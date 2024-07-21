const express = require('express');
const cors = require('cors');
const connectDB = require('./utils/database');
const authRoutes = require('./routes/auth');
const recommendationRoutes = require('./routes/recommendations');

const app = express();
app.use(cors());
app.use(express.json());

connectDB();

app.use('/api/auth', authRoutes);
app.use('/api/recommendations', recommendationRoutes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
