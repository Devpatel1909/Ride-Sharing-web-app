const dotenv=require('dotenv');
dotenv.config();
const http=require('http');
const cors=require('cors');
const express=require('express');
const app=express();

app.use(cors());
app.use(express.json());

// auth routes
const authRoutes = require('./routes/auth.routes');
app.use('/api/auth', authRoutes);

app.get('/',(req,res)=>{
    res.send('Hello World!');
});



module.exports=app;
