const dotenv=require('dotenv');
dotenv.config();
const http=require('http');
const cors=require('cors');
const express=require('express');
const app=express();

app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increase payload size limit for base64 images
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// auth routes
const authRoutes = require('./routes/auth.routes');
app.use('/api/auth', authRoutes);

// rider routes
const riderRoutes = require('./routes/rider.routes');
app.use('/api/rider', riderRoutes);

app.get('/',(req,res)=>{
    res.send('Hello World!');
});



module.exports=app;
