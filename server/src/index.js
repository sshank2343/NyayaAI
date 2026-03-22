const express=require('express');
const mongoose=require('mongoose');
const cors=require('cors');
const cookieParser=require('cookie-parser');
require('dotenv').config();

const app=express();
const PORT=process.env.PORT || 5000;

// middleware
app.use(cors({origin:'http://localhost:5173',credentials:true}));
app.use(express.json());
app.use(cookieParser());

app.get('/',(req,res)=>{
    res.send('⚖️ Legal AI Node.js Gateway is running!');
});

app.get('/test', (req, res) => {
    res.json({ message: 'Test endpoint works - code changes are being picked up', timestamp: new Date() });
});

// Import Routes
const searchRoutes = require('./routes/searchRoutes');
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth',authRoutes);
app.use('/api/search',searchRoutes);

const startServer = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB Database');

        // Start server after DB connection
        app.listen(PORT, () => {
            console.log(`🚀 Node.js Gateway running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.log('❌ MongoDB Connection Error:', error.message);
        process.exit(1);
    }
};

startServer();