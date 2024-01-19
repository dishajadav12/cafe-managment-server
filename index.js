const express = require('express');
require('dotenv').config();
var cors = require('cors');

const connection = require('./connection');
const userRoute = require('./routes/user');
const categoryRoute = require('./routes/category');
const productRoute = require('./routes/product');
const app = express();

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/user',userRoute);
app.use('/category',categoryRoute);
app.use('/product',productRoute);


app.listen(process.env.PORT || 8081, ()=> {
    console.log('server started successfully');
});

