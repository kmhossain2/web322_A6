const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcryptjs');

const userSchema = new Schema({
    userName: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    loginHistory: [
        {
            dateTime: {
                type: Date,
                required: true
            },
            userAgent: {
                type: String,
                required: true
            }
        }
    ]
});

let User; // to be defined on new connection

module.exports.initialize = function () {
    return new Promise((resolve, reject) => {
        let db = mongoose.createConnection("mongodb+srv://mehrabhossain112:46RPD1CbHKLK1Syt@web322.ch1lv.mongodb.net/?retryWrites=true&w=majority&appName=Web322");

        db.on('error', (err)=>{
            reject(err); // reject the promise with the provided error
        });
        db.once('open', ()=>{
           User = db.model("users", userSchema);
           resolve();
        });
    });
};

module.exports.registerUser = function(userData) {
    return new Promise((resolve, reject) => {
        if (userData.password != userData.password2) {
            reject("Passwords don't match");
        }

        bcrypt.hash(userData.password, 10)
            .then((hash) => {
                userData.password = hash;

                let newUser = new User(userData);
                newUser
                    .save()
                    .then(() => {
                        resolve(newUser);
                    })
                    .catch((err) => {
                        if (err.code == 11000) {
                            reject("User Name already taken");
                        }
                        else if (err.code != 11000) {
                            reject("There was an error creating the user: " + err);
                        }
                    });
            })
            .catch((err) => {
                console.log(err);
                reject("There was an error encrypting the password");
            });
    });
}

module.exports.checkUser = function(userData) {
    return new Promise((resolve, reject) => {
        // Find the user in the database
        User.find({ userName: userData.userName })
            .then((users) => {
                if (users.length === 0) {
                    reject("Unable to find user: " + userData.userName);
                } else {
                    // Use bcrypt to compare the entered password with the stored hash
                    bcrypt.compare(userData.password, users[0].password)
                        .then((result) => {
                            if (result === false) {
                                reject("Incorrect Password for user: " + userData.userName);
                            } else {
                                // Password matches, so update the login history
                                users[0].loginHistory.push({
                                    dateTime: new Date().toString(),
                                    userAgent: userData.userAgent
                                });

                                // Update the user's login history in the database
                                User.updateOne(
                                    { userName: users[0].userName },
                                    { $set: { loginHistory: users[0].loginHistory } }
                                )
                                    .then(() => {
                                        resolve(users[0]); // Successfully logged in
                                    })
                                    .catch((err) => {
                                        reject("There was an error verifying the user: " + err);
                                    });
                            }
                        })
                        .catch((err) => {
                            reject("Error comparing passwords: " + err); // Handle bcrypt error
                        });
                }
            })
            .catch(() => {
                reject("Unable to find user: " + userData.userName);
            });
    });
};