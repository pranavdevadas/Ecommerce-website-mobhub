const passport = require('passport')
const GoogleStrategy = require('passport-google-oauth20').Strategy;
require('dotenv').config()
const googleAuthUsers = require('../model/googleAuthUsers')


passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await googleAuthUsers.findById(id);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });


  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:'http://localhost:3000/auth/google/callback',

  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const existingUser = await googleAuthUsers.findOne({ googleId: profile.id });

      console.log(profile)
  
      if (existingUser) {
        return done(null, existingUser);
      }
  
      const newUser = new googleAuthUsers({
        googleId: profile.id,
        displayName: profile.displayName,
        email: profile.emails && profile.emails.length > 0 ? profile.emails[0].value : '',
        // Add other user fields as needed
      });
  
      await newUser.save();
      done(null, newUser);
    } catch (err) {
      done(err, null);
    }
  }));

  const authController = {
    googleAuth: passport.authenticate('google', {
      scope: ['profile', 'email'],
      
    }),
  
    googleAuthCallback: passport.authenticate('google', {
        failureRedirect: '/',
        successRedirect: '/', // Redirect to your dashboard or home page
      }),
    
  };

module.exports = authController;



// const isAuth =()=>{

//  passport.use(new GoogleStrategy({
//     clientID: process.env.GOOGLE_CLIENT_ID,
//     clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//     callbackURL: "http://localhost:3000/auth/google/callback"
//   },
//   function(accessToken, refreshToken, profile, done) {
//     done(null,profile)
//   }
// ));

// passport.serializeUser((user,done)=>{
//     done (null,user)
// })
// passport.deserializeUser((user,done)=>{
//     done(null,user)
// })
// }

// module.exports = isAuth

