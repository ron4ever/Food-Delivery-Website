const express = require('express')
const session = require('express-session')
//Database variables
let mongo = require('mongodb');
let MongoClient = mongo.MongoClient;
let db;
const MongoDBStore = require('connect-mongodb-session')(session);
const ObjectID = require('mongodb').ObjectID;
let app = express();  




let store = new MongoDBStore({
  uri: 'mongodb://localhost:27017/a4', //db
  collection: 'sessions' //colection
});

// Use the session middleware
app.use(session({ secret: 'big secret', store: store}))

app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static("public"));
app.set("view engine", "pug");





//Home and header login/logout
app.get("/", (req, res, next)=> {res.render("home",{session : req.session}); });
app.get("/login", (req, res, next)=> {res.render("login",{session : req.session}); });
app.post("/login", login);
app.get("/logout", logout);
//User Registration
app.get("/register", (req, res, next)=> {res.render("register",{session : req.session}); });
app.post("/register", register);
//query ?=name 
app.get("/users",loadUsers);
//User individual profile page
app.get("/users/:userID",loadUser);
app.get("/goPublic",goPublic);
app.get("/goPrivate",goPrivate);
//User orders
app.get("/orders/:orderID",loadOrder);
//Adding to a user order history
app.post("/orders",addToOrderHistory);
//displaying orders
app.get("/orders",authenticate,(req, res, next)=> {res.render("orderform",{session : req.session}); });



function loadOrder(req,res,next){

  let id = req.params.orderID;
  let oid;
  let order;
  try{ 
		oid = new ObjectID(id);
	}catch{
		res.status(404).send("The ID does not exist.");
		return;
	}
  
  db.collection("orders").findOne({"_id" : oid }, function(err,result){
    if(err){
			res.status(500).send("Error reading database.");
			return;
		}
    order = result;
    
    db.collection("users").findOne({"username" : order.username }, function(err,result){
      if(err){
        res.status(500).send("Error reading database.");
        return;
      }
      if(result.privacy == false){
        
        res.status(200).render("orderSum", {session : req.session, orderInfo: order});
        return;
      }
      
      else if((req.session.username != null) && req.session.username  === result.username){
        
        console.log(order);
        res.status(200).render("orderSum", {session : req.session, orderInfo: order});
        return;
      }
      else{
          res.status(403).send("This order was placed by a private user you do not have the permissions to view it");
          return;
      }
    });
  });
}


function authenticate(req,res,next){
  if(req.session.loggedin == false){
    res.status(404).send("Log into to acsses the ordering menu")
    return;
  }
  else{
    next();
  }
}


function addToOrderHistory(req,res,next){
  console.log(req.body);
  let orderId;
  
  db.collection("orders").insertOne({restName: req.body.restaurantName, orderTotal: req.body.total, orderSubTotal : req.body.subtotal, 
    orderFee : req.body.fee, orderTax : req.body.tax, orderItems: req.body.order, username: req.session.username}, function(err,result){
      if(err){
        res.status(500).send("Error reading database.");
        return;
      }
      orderId = result.insertedId;
      console.log(orderId);
      db.collection("users").updateOne({username: req.session.username},{$push : {orderHistory : orderId}}, function(err,result){
        if(err){
          res.status(500).send("Error reading database.");
          return;
        }
        res.status(200).send("Success inserting order to order database and to user");
        return;
      });
    });
  
}
function goPublic(req,res,next){
  if(!req.session.loggedin){
    res.status(404).send("Log in to change your privacy setting");
  }
  //updates this session privacy by looking it up on mongo db
  let id = req.session.userId;
  let oid;
  try{ 
		oid = new ObjectID(id);
	}catch{
		res.status(404).send("The ID does not exist.");
		return;
	}                                
  db.collection("users").updateOne({"_id" : oid }, {$set: {privacy: false}}, function(err,result){
    if(err){
			res.status(500).send("Error reading database.");
			return;
		}
    console.log(result);
    res.status(200).send(JSON.stringify(oid));
    
  });

}

function goPrivate(req,res,next){
  
  if(!req.session.loggedin){
    res.status(404).send("Log in to change your privacy setting");
  }
  let id = req.session.userId;
  let oid;
  
  //updates this session privacy by looking it up on mongo db
  try{ 
		oid = new ObjectID(id);
	}catch{
		res.status(404).send("The ID does not exist.");
		return;
	}                                
  db.collection("users").updateOne({"_id" : oid }, {$set: {privacy: true}}, function(err,result){
    if(err){
			res.status(500).send("Error reading database.");
			return;
		}
    console.log(result);
    res.status(200).send(JSON.stringify(oid)); //see if ti works
    
  });

}


function loadUser(req,res,next){
  let id = req.params.userID;
  let oid;
  
  try{ 
		oid = new ObjectID(id);
	}catch{
		res.status(404).send("The ID does not exist.");
		return;
	}

  db.collection("users").findOne({"_id" : oid }, function(err,result){
    if(err){
			res.status(500).send("Error reading database.");
			return;
		}
    console.log(result);
    console.log(result._id);
    console.log(oid);
    if((result.privacy == true) && ((req.session.loggedin == false) || (req.session.userId.toString() != result._id.toString()) )){
      res.status(403).send("This user is private you do not have permission to view him");
      return;
    }
    else{
      res.status(200).render("user", {session : req.session, user: result});
    }
  });
}


function loadUsers(req,res,next){
  //look at DB for users that are not private and match the search query with case insenstivity parameter use .toArray
  //pass the session data + these users to render in a pug file
  let name = req.query.name;
  if(name == undefined){
    name = "";
  }
  db.collection("users").find({username : {$regex : name, $options : "i"}, privacy : false }).toArray(function(err,result){
    if(err){
			res.status(500).send("Error reading database.");
			return;
		}
    
    res.status(200).render("users", {session : req.session, list: result});
  
  });
}



function register(req,res,next){
  if(req.session.loggedin){
    res.status(200).send("You are currently logged in");
  }
  else{
    let name = req.body.username;
    let password = req.body.password;

    if(name == "" || password == ""){
      res.status(401).render("register",{session : req.session, noInput : true});;
      return;
    }

    console.log("Registering in with credentials:");
    console.log("Username: " + req.body.username);
    console.log("Password: " + req.body.password);

    //find if in DB
    db.collection("users").findOne({username : name}, function(err,result){
      if(err){
        res.status(500).send("Error reading database.");
        return;
      }
      if(result){
        res.status(401).render("register",{session : req.session, alert : true});
        return;
        }
      else{                         //insert user
          db.collection("users").insertOne({username: name, password: password, privacy : false, orderHistory : []}, function(err,result){
              if(err) throw err;
          });
          //find user to update the session
          db.collection("users").findOne({username: name, password: password}, function(err,result){
            if(err) throw err;
            req.session.loggedin = true;
            req.session.username = result.username;
            req.session.userId = result._id;
            console.log(req.session);
            res.status(200).redirect("http://localhost:3000/users/" + req.session.userId); //REDIRECT TO USER PAGE
            return;

          });
        
        
        }
    });

  }


}



function logout(req,res,next){
  
  if(req.session.loggedin){
		req.session.loggedin = false;
    req.session.username = null;
    req.session.userId = null;
    res.status(200).redirect("/");
    return;
  }
  else{
    res.status(401).send("You are not logged in");
    return;
  }
}

function login(req, res, next){
  if(req.session.loggedin){
		res.status(200).send("Already logged in.");
		return;
	}

	let name = req.body.username;
  let password = req.body.password;

  console.log("Logging in with credentials:");
  console.log("Username: " + req.body.username);
  console.log("Password: " + req.body.password);

    //find in DB
    
  
    db.collection("users").findOne({username : name, password : password}, function(err,result){
      if(err){
        res.status(500).send("Error reading database.");
        return;
        }
        if(!result){
        res.status(404).render("login",{session : req.session, error : true});
        return;
        }
        else{
        req.session.loggedin = true;
        req.session.username = result.username;
        req.session.userId = result._id;
       
        res.status(200).redirect("/");
        return;
        
        }
    });
        
}


// Initialize database connection
MongoClient.connect("mongodb://localhost:27017/", function(err, client) {
  if(err) throw err;

  
  db = client.db('a4');
  //this will set up the orders collection for the first time if it does not already exist 
  db.listCollections({name: "orders"})
    .next(function(err, result) {
        if (!result) {
          db.createCollection("orders", function(err, result) {
            if (err) throw err;
            console.log("Order collection is created!");
          });
        }
    });
  app.listen(3000);
  console.log("Listening on port http://localhost:3000");

});

