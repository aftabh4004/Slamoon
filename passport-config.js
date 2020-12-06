const LocalStrategy = require('passport-local');
const bcrypt = require('bcrypt');

function initialize(passport, getUserByUsername){
    async function authenticateUser(username, password, done){
        try{
            const user = await getUserByUsername(username);
            if(!user){
                done(null, false, {message: "No user found!"});
                return;
            }else{
                if(await bcrypt.compare(password, user.password)){
                    done(null, user);
                }else{
                    done(null, false, {message: "Invalid password!"});
                }
            }

        }catch(e){

        }
       
    }
    passport.use(new LocalStrategy(authenticateUser))
    passport.serializeUser((user, done) => {  return  done(null, user._id) });
    passport.deserializeUser(async (id, done) => {
        const username = await getUserByUsername(id);
        return done (null, username);
    });

}

module.exports = initialize;