const express = require('express');
const bcrypt = require('bcrypt');
const mongojs = require('mongojs');
const bodyParser = require('body-parser');
const passport = require('passport');
const flash = require('express-flash');
const session = require('express-session');
const passportInitialize = require('./passport-config');
const methodOverride = require('method-override');
const httpMsgs = require('http-msgs');
const PORT =9000;


const app = express();



// middleware 
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('public'));
app.use(express.urlencoded({extended: false}));
app.use(flash());
app.use(session( {
    secret: "slamoon",
    resave: false,
    saveUninitialized: false
} ));
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride('_method'));


// connecting to mongodb using mongojs
const db = mongojs('Slamoon' ,['credentials']);

db.on("error", function(error) {
    console.log("Database Error:", error);
});

function getUserByUsername(username){
    return new Promise((resolve, reject) => {
        db.credentials.findOne({_id: username}, function (err, data) {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}


// initializing passport, calling the function define in the passport-config.js
passportInitialize(
    passport,
    getUserByUsername 
);

// seting view engine
app.set('view engine', 'ejs');


// @route GET /
// @desc login and signup page 
app.get("/", checkAuth,(req, res) => {
    res.status(200);
    res.render('login', {message: "", acknowledge: true});
});


// @route POST /resgister
// @desc take the date from the form and put in the database
app.post('/register', async (req, res) => {

    try{
        if(!(req.body.password === req.body.cpassword)){
            res.render('login', { message : "Confirm password doesn't match", acknowledge: false }); 
            return;
        }
        const hashedPass = await bcrypt.hash(req.body.password, 10);
        db.credentials.insertOne({ 
            _id: req.body.username,
            password: hashedPass,
            name: req.body.name,
            dob: req.body.dob,
            Notification: [],
            Book: [],
            Birthdays: []
        },
        (err, data) =>{
            let msg = "Successfully registered! Please login.";
            if(err){
                msg = "Username alreay taken";
                res.render('login', { message : msg, acknowledge: false});
                return;
            }
            res.render('login', { message : msg, acknowledge: true });
        });
    }catch(e){
        res.send(e);
    }
});

//@route POST /login
// @desc Authenticate user
app.post('/login', passport.authenticate('local', {
    failureRedirect: '/',
    failureFlash: true,
}),
(req, res) => {
    // this function wiil be called only if auth. is successfull
    res.redirect(`/profile/${req.user._id}`);
}
);



// @route GET /profile
// @desc render profile.ejs
app.get('/profile/:id',checkNotAuth, (req, res) => {
    db.credentials.findOne( {_id: req.params.id }, (err, data) => {
        res.render('profile', {
            user: req.user.name,
            id: req.user._id,
            profile_id: req.params.id,
            profile_name: data.name,
            notification: data.Notification,
            book: data.Book,
            birthdays: data.Birthdays
        });
    });
    
});

// @route DELETE /logout
// @desc deserialize the user
app.delete('/logout', (req, res) => {
    req.logOut();
    res.redirect('/');
});


// if user is authenticate, dont allow to go on login page
function checkAuth(req, res, next){
    if(req.isAuthenticated()){
        return res.redirect(`/profile/${req.user._id}`);
    }
    next();
}

// if user is not authenticate, dont allow to go on profile page
function checkNotAuth(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
   res.redirect('/');
}


// @route GET /edit-profile
// @desc serve a form to upload profile and cover photo
app.get('/edit-profile', (req, res) => {
    console.log(req.user._id);
    res.redirect(`http://localhost:5000/${req.user._id}`);
});

 

// @route POST /search
// @desc handle AJAX call for search
// search the keyword in mongoDB using text indexing

app.post('/search',(req, res) => {
    db.credentials.createIndex( { _id: "text", name: "text"} );
    db.credentials.find(
        { $text: { $search: req.body.search_text } },
        { score: { $meta: "textScore" } },
        (err, data) => {
            if(err){
                console.log('err  ' + err);
                return;
            }
            let html ="";
            let counter = 0;
            data.forEach(element => {
                html += 
                `
                
                <div class="card" id="${counter}">
                    <img src="http://localhost:5000/image/${element._id}.jpg" alt="" id="card-img">
                    <div style="margin-left: 5px">
                        <label id="card-label">${element.name}</label><br>
                        <label id="card-id-lable${counter}">${element._id}</label>
                    </div>
                </div>`;
                counter++;
                
            });
            httpMsgs.sendHTML(req, res, html);
        }
     )
});


// @route POST /invite
// @desc invite a user to fill the slam book
app.post('/invite', (req, res) => {
    db.credentials.updateOne(
        {_id: req.body.id},
        { $push: { "Notification":  {"username" : req.user._id, "name": req.user.name}} }
    );
    res.end();

}) 


// @route POST /write
// @desc render the book
app.post('/write', (req, res) => {
    res.render('book', {
        user_id: req.user._id,
        user_name: req.user.name,
        bookholder_id: req.body.profile_id,
        bookholder_name: req.body.profile_name
    });
    
});

//@route POST /addToBook
// @desc add the frirnd responce to the book in the database
app.post('/addToBook', (req, res) => {
    // appending book in the database
    db.credentials.updateOne(
        {_id: req.body.profile_id},
        { $push: { "Book":  {
                                "username" : req.user._id,
                                "name": req.user.name,
                                "nickname": req.body.nickname,
                                "born": req.body.born,
                                "gender": req.body.gender,
                                "email": req.body.email,
                                "p_no": req.body.p_no,
                                "address": req.body.address,
                                "about_you": req.body.about_you,
                                "about_me": req.body.about_me

                            }
                }
        }
    );
    
    //appending birthday list in the 
    db.credentials.updateOne(
        {_id: req.body.profile_id},
        { $push: { "Birthdays":  {
                                "username" : req.user._id,
                                "name": req.user.name,
                                "born": req.body.born
                            }
                }
        }
    );

    res.redirect('/');
});

app.listen(PORT, () => {
    console.log(`sever start on port ${PORT}`);
});