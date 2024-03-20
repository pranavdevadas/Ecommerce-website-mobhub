const express= require('express')
const app= express()
require('dotenv').config()
const mongoose= require('mongoose')
const path= require('path')
const session= require('express-session')
const {v4:uuidv4}= require('uuid')
const nocache = require('nocache')
const adminRouter = require('./routes/adminRoutes')
const bodyParser = require('body-parser');
const passport = require('passport')
const MongoDBStore = require('connect-mongodb-session')(session);


const PORT= process.env.PORT||3000

app.use(nocache())

const store = new MongoDBStore({
    uri: 'mongodb://localhost:27017/session-store', // MongoDB connection URI
    collection: 'sessions' // Collection to store sessions
});



//middleware to handle sesssion
app.use(session({
    secret: uuidv4(),
    resave: false,
    saveUninitialized: false,
    store: store,
}));

app.use((req, res, next) => {
    res.locals.message = req.session.message;
    delete req.session.message;
    next();
});

//connecting database 
const db= mongoose.connect(process.env.DB_URI)
db.then(()=>console.log('Database connected'))
db.catch(()=>console.log('Error in connecting Database'))

//link static files
app.use('/static',express.static(path.join(__dirname,'public')))



//middleware
app.use(express.json()) 
app.use(express.urlencoded({extended:false}))
app.use(passport.initialize())
app.use(passport.session())



//set template engine 
app.set('view engine','ejs')


//route prefix
app.use('/',require('../Project/routes/userRoutes'))
app.use('/',require('../Project/routes/adminRoutes'))



app.listen(PORT,()=>console.log(`Server running on http://localhost:${PORT}`))