/*********************************************************************************

WEB322 – Assignment 05
I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part *  of this assignment has been copied manually or electronically from any other source (including 3rd party web sites) or distributed to other students.

Name: Kazi Meherab hossain 
Student ID: 118640234 
Date: 11 Dec 2024
Cyclic Web App URL: https://web322-app-1-nx7t.onrender.com
GitHub Repository URL: https://github.com/Zi64/web322-app.git

********************************************************************************/

const storeService = require('./store-service.js');
const authData = require('./auth-service.js');

// Importing express module
const express = require('express');
const path = require('path');

// Importing Multer, Cloudinary, and Streamifier
const multer = require("multer");
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const clientSessions = require('client-sessions');


// Cloudinary Config
cloudinary.config({
    cloud_name: 'dodvhao4q',
    api_key: '649952634518431',
    api_secret: 'FwBX4OMD-HILOaS89t-YotzqvgM',
    secure: true
});

const upload = multer(); // Multer without disk storage

// Creating express application
const app = express();
const HTTP_PORT = process.env.PORT || 8080;

// Set view engine to EJS
app.set('view engine', 'ejs');

// Static middleware
app.use(express.static('public'));

app.use(
    clientSessions({
        cookieName: 'session', // this is the object name that will be added to 'req'
        secret: 'o6LjQ5EVNC28ZgK64hDELM18ScpFQr', // this should be a long un-guessable string.
        duration: 2 * 60 * 1000, // duration of the session in milliseconds (2 minutes)
        activeDuration: 1000 * 60, // the session will be extended by this many ms each request (1 minute)
    })
);

app.use((req, res, next) => {
    res.locals.session = req.session;
    next();
});


function ensureLogin(req, res, next) {
    if (!req.session.user) {
        res.redirect('/login');
    } else {
        next();
    }
}


// Middleware to set activeRoute and category
app.use((req, res, next) => {
    const route = req.path.substring(1);
    app.locals.activeRoute = "/" + route.split('/')[0];
    app.locals.viewingCategory = req.query.category || null;
    next();
});

app.use(express.urlencoded({ extended: true }));

// Redirect '/' to '/about'
app.get('/', (req, res) => res.redirect('/about'));

// About Page
app.get('/about', (req, res) => {
    res.render('about', { activeRoute: app.locals.activeRoute });
});

// Shop Page
app.get('/shop', async (req, res) => {
    let viewData = {};
    let items = [];
    try {
        if (req.query.category) {
            // Obtain the published "item" by category
            items = await storeService.getPublishedItemsByCategory(req.query.category);
        } else {
            // Obtain the published "items"
            items = await storeService.getPublishedItems();
        }
        items.sort((a, b) => new Date(b.itemDate) - new Date(a.itemDate));
        let item = items[0];
        viewData.items = items;
        viewData.item = item;
    } catch {
        viewData.message = "no results";
    }

    try {
        viewData.categories = await storeService.getCategories();
    } catch {
        viewData.categoriesMessage = "no results";
    }
    res.render('shop', { data: viewData });
});

// Shop with ID
app.get('/shop/:id', async (req, res) => {
    const viewData = {};
    try {
        const items = req.query.category
            ? await storeService.getPublishedItemsByCategory(req.query.category)
            : await storeService.getPublishedItems();

        items.sort((a, b) => new Date(b.itemDate) - new Date(a.itemDate));
        viewData.items = items;
    } catch {
        viewData.message = "no results";
    }

    try {
        viewData.item = await storeService.getItemsById(req.params.id);
    } catch {
        viewData.message = "no results";
    }

    try {
        viewData.categories = await storeService.getCategories();
    } catch {
        viewData.categoriesMessage = "no results";
    }

    res.render('shop', { data: viewData });
});

// Items Page
app.get('/items', ensureLogin, (req, res) => {
    if (req.query.category) {
      storeService.getItemsByCategory(req.query.category)
            .then((data) => {
                if (data.length > 0) {
                    res.render('items', { 
                        items: data,
                        activeRoute: app.locals.activeRoute,
                        message: ""
                    });
                }
                else {
                    res.render('items', { message: "no results found" });
                }
            })
            .catch((reason) => {
                console.log(reason);
                res.render('items', { 
                    message: "Item not found"
                });
            })
    }
    else if (req.query.minDate) {
        storeService.getItemsByMinDate(req.query.minDate)
            .then((data) => {
                if (data.length > 0) {
                    res.render('items', { 
                        items: data,
                        activeRoute: app.locals.activeRoute,
                        message: ""
                    });
                }
                else {
                    res.render('items', { message: "no results found" });
                }
            })
            .catch((reason) => {
                console.log(reason);
                res.render('items', { 
                    message: "Item not found"
                });
            })
    }
    else {
        storeService.getAllItems()
            .then((data) => {
                if (data.length > 0) {
                    res.render('items', { 
                        items: data,
                        activeRoute: app.locals.activeRoute,
                        message: ""
                    });
                }
                else {
                    res.render('items', { message: "no results found" });
                }
            })
            .catch((reason) => {
                console.log(reason);
                res.render('items', { 
                    message: "Item not found"
                });
            })
    }
});


app.get('/items/add',ensureLogin, (req, res) => {
    storeService.getCategories()
        .then((data) => {
            res.render('addItem', {
                categories: data,
                activeRoute: app.locals.activeRoute
            });
        })
        .catch((err) => {
            res.render('addItem', {
                categories: [],
                activeRoute: app.locals.activeRoute
            });
        });
});

app.get('/items/delete/:id',ensureLogin, (req, res) => {
    storeService.deleteItemByID(req.params.id)
        .then((data) => {
            res.redirect('/items');
        })
        .catch((reason) => {
            res.status(500).send(reason);
        })
});

app.get('/items/:id',ensureLogin, (req, res) => {
    storeService.getItemsById(req.params.id)
        .then((data) => {
            if (data.length > 0){
                res.render('items', { 
                    items: data,
                    activeRoute: app.locals.activeRoute,
                    message: ""
                });
            }
            else {
                res.render('items', { message: "no results found" });
            }
        })
        .catch((reason) => {
            console.log(reason);
            res.render('items', { 
                message: "Item not found"
            });
        })
})

app.get('/categories/add',ensureLogin, (req, res) => {
    res.render('addCategory', {
        activeRoute: app.locals.activeRoute
    })
})

app.post('/categories/add', ensureLogin,(req, res) => {
    storeService.addCategory(req.body)
        .then((data) => {
            res.redirect('/categories');
        })
        .catch((reason) => {
            res.status(500).send("Unable to read the item");
        });
});

app.get('/categories',ensureLogin, (req, res) => {
    storeService.getCategories()
            .then((data) => {
                if (data.length > 0) {
                    res.render('categories', { 
                        categories: data,
                        activeRoute: app.locals.activeRoute,
                        message: ""
                    });
                }
                else {
                    res.render('categories', { message: "no results found" });
                }
            })
            .catch((reason) => {
                console.log(reason);
                res.render('categories', { 
                    message: "Category not found"
                });
            })
});

app.get('/categories/delete/:id',ensureLogin, (req, res) => {
    storeService.deleteCategoryByID(req.params.id)
        .then((data) => {
            res.redirect('/categories');
        })
        .catch((reason) => {
                res.status(500).send(reason);
        })
});

app.post('/items/add',ensureLogin, upload.single("featureImage"), (req, res) => {
    if(req.file){
        let streamUpload = (req) => {
            return new Promise((resolve, reject) => {
                let stream = cloudinary.uploader.upload_stream(
                    (error, result) => {
                        if (result) {
                            resolve(result);
                        } else {
                            reject(error);
                        }
                    }
                );

                streamifier.createReadStream(req.file.buffer).pipe(stream);
            });
        };

        async function upload(req) {
            let result = await streamUpload(req);
            console.log(result);
            return result;
        }

        upload(req).then((uploaded)=>{
            processItem(uploaded.url);
        });
    }
    else {
        processItem("");
    }
    
    function processItem(imageUrl){
        req.body.featureImage = imageUrl;

        // TODO: Process the req.body and add it as a new Item before redirecting to /items
        storeService.addItem(req.body)
            .then((data) => {
                res.redirect('/items');
            })
            .catch((reason) => {
                res.status(500).send("Unable to read the item");
            });
    }
});



app.get('/login', (req, res) => {
    res.render('login', { 
        activeRoute: app.locals.activeRoute,
        errorMessage: undefined,
        userName: undefined
    });
});

app.get('/register', (req, res) => {
    res.render('register', {
        activeRoute: app.locals.activeRoute,
        successMessage: undefined,
        errorMessage: undefined,
        userName: undefined
    });
})

app.post('/register', (req, res) => {
    const userData = req.body;
    authData.registerUser(userData)
        .then(() => {
            res.render('register', { successMessage: "User Created" });
        })
        .catch((err) => {
            res.render('register', { successMessage: undefined, errorMessage: err, userName: req.body.userName });
        });
})

app.post('/login', (req, res) => {
    req.body.userAgent = req.get("User-Agent"); 

    authData.checkUser(req.body)
        .then((usr) => {
            req.session.user = {
                userName: usr.userName,
                email: usr.email,
                loginHistory: usr.loginHistory
            };
            console.log(req.session.user);
            res.redirect('/items');
        })
        .catch((err) => {
            res.render('login', {
                errorMessage: err,
                userName: req.body.userName
            });
        });
});

app.get('/logout', (req, res) => {
    req.session.reset();
    res.redirect('/');
});

app.get('/userHistory', ensureLogin, (req, res) => {
    res.render('userHistory');
})


app.use((req, res) => {
    res.status(404).send('404: Page Not Found');
});


storeService.initialize()
    .then(authData.initialize)
    .then((data) => {
        console.log(data);
        app.listen(HTTP_PORT, ()=> {
            console.log(`Express http server listening on ${HTTP_PORT}`);
        });
    })
    .catch((reason) => {
        console.log(reason);
    });
// Listen on this port