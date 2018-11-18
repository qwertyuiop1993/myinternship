require('./config/config.js'); // set up environment variables and ports/databsaes
const {mongoose} = require('./database/mongoose.js');
const {User} = require('./models/user');
const {Admin} = require('./models/admin');

const {authenticate} = require('./middleware/authenticate.js');
const {authenticateAdmin} = require('./middleware/authenticateAdmin.js');
const {loadCompanyChoices} = require('./middleware/loadCompanyChoices.js');
const {loadStudentChoices} = require('./middleware/loadStudentChoices.js');
const {loadCompanyOptions} = require('./middleware/loadCompanyOptions.js');
const {sorterGetStudentChoices} = require('./middleware/sorterGetStudentChoices.js');
const {sorterGetCompanyChoices} = require('./middleware/sorterGetCompanyChoices.js');
const hbs = require('hbs');
const {ObjectID} = require('mongodb'); // import ObjectID from mongodb for id validation methods
const _ = require('lodash');
const express = require('express');
const bodyParser = require('body-parser');

const port = process.env.PORT;

var app = express();

app.use(bodyParser.json()); // use bodyParser to parse request as JSON
var urlencodedParser = bodyParser.urlencoded({ extended: false }) // parse req body middleware for form submission

app.use(express.static(`public`)); // middleware that sets up static directory in a folder of your choice - for your pages which don't need to be loaded dynamically
hbs.registerPartials(`${__dirname}/../views/partials`); // register default partials directory


app.listen(port, () => {
  console.log(`Listening to port ${port}`);
});

//homepage
app.get("/", (req, res) => {
  res.render("home.hbs");
})

//signup
app.post("/signup", urlencodedParser, (req, res, next) => {
  let body = _.pick(req.body, ['studentid', 'name', 'password', 'department']);
  let user = new User(body);

  user.save().then(() => {
    return user.generateAuthToken();
  }).then((token) => {
    res.header({'x-auth': token, studentid: req.body.studentid}).send(user);

  }).catch((err) => {
    res.status(400).send(err);
  })
})


// signin
app.post("/signin", urlencodedParser, (req, res) => {
  let body = _.pick(req.body, ['studentid', 'password']);

  User.findByCredentials(body.studentid, body.password).then((user) => {
    return user.generateAuthToken().then((token) => {
      res.header({'x-auth': token, studentid: body.studentid}).send(user);
    })
  }).catch((e) => {
    res.status(400).send();
  })
});


app.get("/profile", (req, res) => {
  res.redirect("/profile/:token");
})

// access profile
app.get("/profile/:token", authenticate, loadCompanyOptions, (req, res, next) => {

    let companyList = req.companyList; // get companyList from req object as set by loadCompanyOptions middleware
    let choices = req.user.choices; // get user choices from req.user object (returned from authentification middleware)
    let choicesList = "";

    if(choices && choices != "None") { // if there are choices, turn them into list items to be passed to handlebars
      let choicesArray = JSON.parse(choices);
      choicesArray.forEach(choice => {
        choicesList += `<li>${choice}</li>`
      })
    }

    res.render('loggedIn.hbs', {
      name: req.user.name,
      department: req.user.department,
      studentid: req.user.studentid,
      choices: choicesList,
      companyList: companyList,
    })

})

// logout
app.delete('/logout', authenticate, (req, res) => {
  req.user.removeToken(req.token).then(() => {
    res.status(200).send();
  }).catch((e) => {
    res.status(400).send();
  })
})


// save company choices
app.post("/profile/:token", authenticate, urlencodedParser, (req, res) => {
  console.log(req.body.choices)
  let choices = req.body.choices;
  // save company choices

  User.findOneAndUpdate({
    _id: req.user._id
  }, {$set: {choices: choices}}, {new: true}).then((choices) => {
    res.status(200).send();
  }).catch((err) => {
    res.status(400).send();
  })
});


// admin homepage

app.get("/admin", urlencodedParser, (req, res) => {
  res.render("admin.hbs");
});

// admin signin
app.post("/admin", urlencodedParser, (req, res) => {
  let body = _.pick(req.body, ['username', 'password']);

  Admin.findByCredentials(body.username, body.password).then((admin) => {
    return admin.generateAuthToken().then((token) => {
      res.header({'admin-auth': token, username: body.username}).send();
    })
  }).catch((e) => {
    res.status(400).send();
  });
});


// show logged in page for admin
app.get("/admin/:token", authenticateAdmin, loadCompanyChoices, loadStudentChoices, (req, res, next) => {

  let studentChoicesTable = req.studentChoicesTable;
  let companyChoicesTable = req.companyChoicesTable;

    res.render('loggedInAdmin.hbs', {
      studentChoicesTable: studentChoicesTable,
      companyChoicesTable: companyChoicesTable,
    })
})


// update companyChoices
app.post("/admin/update", authenticateAdmin, urlencodedParser, (req, res) => {

  let companyChoices = req.body.companyChoices;
  let admin = req.admin;

  admin.companyChoices = companyChoices;

  admin.save().then(() => {
    res.status(200).send();
  }).catch(e => {
    res.status(400).send();
  })

});


// load sorter route
app.get("/admin/sorter/:token", authenticateAdmin, (req, res) => {
  res.render("sorter.hbs")
})


// get student data for sorter
app.get("/fetchSorterData", authenticateAdmin, sorterGetStudentChoices, sorterGetCompanyChoices, (req, res) => {

    // get data from the req object where the middleware has stored the relevant values
    let studentsArray = req.studentsArray;
    let companyChoicesObject = req.companyChoicesObject;

    let sorterData = {}; // combine student and company data into one data package to be sent
    sorterData.studentsArray = studentsArray;
    sorterData.companyChoices = companyChoicesObject;

    res.send(sorterData);
})



//admin logout
app.delete('/admin/logout', authenticateAdmin, (req, res) => {
  req.admin.removeToken(req.token).then(() => {
    res.status(200).send();
  }).catch((e) => {
    res.status(400).send();
  })
})

// export app for use in other modules
module.exports = {
  app: app
}
