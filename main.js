const getJSONString = function (obj) {
  return JSON.stringify(obj, null, 2);
};

const express = require("express");
const bcrypt = require("bcryptjs");
const app = express();

const layouts = require("express-ejs-layouts");

var mongoose = require("mongoose");
mongoose.Promise = global.Promise;
mongoose.connect("mongodb://localhost:27017/cis485", {
  useUnifiedTopology: true,
  useNewUrlParser: true,
});

var loginSchema = new mongoose.Schema({
  userid: String,
  password: String,
});

var cartSchema = new mongoose.Schema({
  userid: String,
  code: String,
  name: String,
  price: Number,
  quantity: Number,
  image: String,
});

const catalogSchema = new mongoose.Schema({
  code: String,
  name: String,
  description: String,
  price: Number,
  quantity: Number,
  image: String,
});

mongoose.pluralize(null);

var Catalog = mongoose.model("catalog", catalogSchema);
var User = mongoose.model("login", loginSchema);
var Cart = mongoose.model("cart", cartSchema);

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use(layouts);

var bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const cookieParser = require("cookie-parser");
const session = require("express-session");

app.use(
  session({
    secret: "1234567",
    resave: true,
    saveUninitialized: true,
  })
);
app.use(cookieParser());

app.use((req, res, next) => {
  console.log(`request made to: ${req.url}`);
  next();
});

app.get("/", function (req, res) {
  res.render("login.ejs", { req: req });
});

app.get("/login", function (req, res) {
  res.render("login.ejs", { req: req });
});

app.get("/register", function (req, res) {
  res.render("register.ejs", { req: req });
});

/*app.get ("/products", function (req,res) 
{
    res.render ( "products.ejs",{});    
} );*/

// app.get("/sony", function (req, res) {
//   res.render("sony.ejs", {});
// });

// app.get("/iphone", function (req, res) {
//   res.render("iphone.ejs", {});
// });
/*
app.get("/registerx", (req, res) =>
{
    User.findOne({userid:req.query.userid}, '', function (err, data)
    {
        if (err) return handleError(err);
        if (data==null)
        {       
                var x = new User(req.query);
                x.save(function (err)
                { 
                    if (err) return handleError(err);
                    res.render ( "login",{message: 'Registration Succelfull'});
                });
        }
        else
        {
            res.render ( "register",{message: 'ERROR: User Already In Database'});
        }
    });
});
*/

app.get("/registerx", (req, res) => {
  User.findOne({ userid: req.query.userid }, "", function (err, data) {
    if (err) return handleError(err);
    if (data == null) {
      bcrypt.hash(req.query.password, 5, function (err, hashpass) {
        console.log("hashpassword=" + hashpass);
        req.query.password = hashpass;
        var x = new User(req.query);
        x.save(function (err) {
          if (err) return handleError(err);
          res.render("login", { message: "Registration Succelfull", req: req });
        });
      });
    } else {
      res.render("register", {
        message: "ERROR: User Already In Database",
        req: req,
      });
    }
  });
});

app.get("/loginx", (req, res) => {
  User.findOne({ userid: req.query.userid }, "", function (err, data) {
    if (err) return handleError(err);
    if (data == null) {
      if (err) return handleError(err);
      res.render("login", { message: "Invalid Userid", req:req });
    } else {
      bcrypt.compare(req.query.password, data.password, function (err, result) {
        if (result) {
          req.session.userid = req.query.userid;
          req.session.flag = "1";
          //res.render ( "products",{message:"Login Successful"});
          res.redirect("/products");
        } else {
          res.render("login", { message: "Invalid Password", req: req });
        }
      });
    }
  });
});

app.post("/add", (req, res) => {
  const item2find = new Object();
  item2find.code = req.body.code;
  item2find.userid = req.session.userid;
  Cart.find(item2find, "", function (err, data) {
    if (err) return handleError(err);
    if (data == "") {
      const item = new Object();
      item.code = req.body.code;
      item.userid = req.session.userid;
      item.name = req.body.name;
      item.quantity = 1;
      item.price = req.body.price;
      item.image = req.body.image;
      console.log(getJSONString(item));
      var x = new Cart(item);
      x.save(function (err) {
        if (err) return handleError(err);
      });
    } else {
      const item2update = new Object();
      item2update.code = req.body.code;
      item2update.userid = req.session.userid;
      const update = new Object();
      update.quantity = parseInt(data[0].quantity) + 1;
      Cart.updateOne(item2update, update, function (err, result) {
        if (err) console.log("ERROR=" + err);
        else console.log("RECORD UPDATED");
      });
    }
    res.render("products.ejs", { message: "", req: req });
  });
});

app.get("/products", (req, res) => {
  if (req.session.flag != "1")
    res.render("login", { message: "Session Expired" });
  const item2find = new Object();
  Catalog.find(item2find, "", function (err, data) {
    if (err) return handleError(err);
    if (data == "") {
    } else {
      let catalog = "";
      for (let i = 0; i < data.length; i++) {
        catalog += `
<div style="border:solid green 1px;background:#FFFFFF;float:left">
<div class="title">${data[i].name}</div>
<span class="left"><a href="panasonic.html"><img src="images/${data[i].image}" style="width:200px;" alt="example graphic" /></a></span>
<p class="size">
${data[i].description}

<form onclick="this.submit()" method="post" action="solopage">
<input type='hidden' name='code' value='${data[i].code}' />
<a style="font-size:20px">More...</a>
</form>

<span style="float:right;text-align:left;padding:.5em;">
<a href="#"
onclick="addItem('${data[i].code}','${data[i].name}',${data[i].price},'${data[i].image}')">
Add to Cart<a>&nbsp;&nbsp;<a href="cart">Goto Cart</a>
</a>

</span>
</p>
</div>
<p style="clear:both"></p>
`;
      }
      res.render("products.ejs", { catalog: catalog, message: "", req: req });
    }
    //res.render ( "products.ejs",{message:""});
  });
});

app.get("/Solopage", (req, res) => {
  if (req.session.flag != "")
    res.render("login", { message: "Session Expired" });
  const item2find = new Object();
  Catalog.find(item2find, "", function (err, data) {
    if (err) return handleError(err);
    if (data == "") {
    } else {
      let catalog = "";
      for (let i = 0; i < data.length; i++) {
        catalog += `
<div style="border:solid green 1px;background:#FFFFFF;float:left">
<div class="title">${data[i].name}</div>
<span class="left"><a href="panasonic.html"><img src="images/${data[i].image}" style="width:200px;" alt="example graphic" /></a></span>
<p class="size">
${data[i].description}

<form onclick="this.submit()" method="post" action="solopage">
<input type='hidden' name='code' value='${data[i].code}' />
<a style="font-size:20px">More...</a>
</form>

<span style="float:right;text-align:left;padding:.5em;">
<a href="#"
onclick="addItem('${data[i].code}','${data[i].name}',${data[i].price},'${data[i].image}')">
Add to Cart<a>&nbsp;&nbsp;<a href="cart">Goto Cart</a>
</a>

</span>
</p>
</div>
<p style="clear:both"></p>
`;
      }
      res.render("Solopage.ejs", { catalog: catalog, message: "", req: req });
    }
    //res.render ( "Solopage.ejs",{message:""});
  });
});

app.get("/logout", function (req, res) {
  if (req.session.flag == "1") {
    req.session.destroy(function (err) {
      res.redirect("/");
    });
  }
});

app.get("/cart", (req, res) => {
  if (req.session.flag !== "1") {
    res.render("login", { message: "Session Expired" });
  } else {
    const item2find = { userid: req.session.userid };
    Cart.find(item2find, '', function (err, data) {
      if (err) {
        console.error(err);
        return res.render("error", { message: "Error retrieving cart items" });
      }
      if (data.length === 0) {
        res.render("cart", { cart: "", message: "Your cart is empty", req: req });
      } else {
        let grandTotal = 0;
        let cart = `
          <table class="cart-table">
            <tr>
              <th>IMAGE</th>
              <th>NAME</th>
              <th>QUANTITY</th>
              <th>PRICE</th>
              <th>SUBTOTAL</th>
              <th>REMOVE ITEM</th>
            </tr>
        `;

        data.forEach(item => {
          let subtotal = item.price * item.quantity;
          grandTotal += subtotal;
          cart += `
            <tr>
              <td><img src='images/${item.image}' alt='${item.name}' /></td>
              <td>${item.name}</td>
              <td>
                <form action="/decrease-quantity/${item._id}" method="post" style="display: inline;">
                  <button type="submit">-</button>
                </form>
                ${item.quantity}
                <form action="/increase-quantity/${item._id}" method="post" style="display: inline;">
                  <button type="submit">+</button>
                </form>
              </td>
              <td>$${item.price.toFixed(2)}</td>
              <td>$${subtotal.toFixed(2)}</td>
              <td>
                <form action="/remove-item/${item._id}" method="post" style="display: inline;">
                  <button type="submit">Remove</button>
                </form>
              </td>
            </tr>
          `;
        });

        cart += `
          <tr>
            <td colspan="4" style="text-align: right;">Grand Total:</td>
            <td>$${grandTotal.toFixed(2)}</td>
            <td colspan="2" style="text-align: right;">
              <form action="/checkout" method="post" style="display: inline;">
                <button type="submit">Checkout</button>
              </form>
            </td>
          </tr>
        </table>
        `;
        
        res.render("cart", { cart: cart, message: "", req: req });
      }
    });
  }
});

 

// Decrease quantity
app.post("/decrease-quantity/:itemId", (req, res) => {
  if (!req.session.userid) {
    return res.redirect('/login');
  }
  Cart.findOneAndUpdate(
    { _id: req.params.itemId, userid: req.session.userid },
    { $inc: { quantity: -1 } },
    { new: true },
    (err, doc) => {
      if (err || !doc) {
        console.error("Error updating quantity:", err);
        return res.redirect("/cart");
      }
      console.log("Decreased quantity for item:", doc);
      if (doc.quantity < 1) {
        Cart.deleteOne({ _id: req.params.itemId }, err => {
          console.log(err ? "Error removing item" : "Item removed");
        });
      }
      res.redirect("/cart");
    }
  );
});

// Increase quantity
app.post("/increase-quantity/:itemId", (req, res) => {
  if (!req.session.userid) {
    return res.redirect('/login');
  }
  Cart.findOneAndUpdate(
    { _id: req.params.itemId, userid: req.session.userid },
    { $inc: { quantity: 1 } },
    { new: true },
    (err) => {
      if (err) {
        console.error("Error increasing quantity:", err);
      }
      res.redirect("/cart");
    }
  );
});

// Remove item
app.post("/remove-item/:itemId", (req, res) => {
  if (req.session.flag !== "1") {
    res.render("login", { message: "Session Expired" });
  } else {
    Cart.deleteOne({ _id: req.params.itemId, userid: req.session.userid }, function (err) {
      if (err) {
        console.error(err);
        return res.render("error", { message: "Failed to remove item" });
      }
      res.redirect("/cart");
    });
  }
});

// Checkout
app.post("/checkout", (req, res) => {
  if (req.session.flag !== "1") {
    res.render("login", { message: "Session Expired" });
    return;
  }
  const item2find = { userid: req.session.userid };
  Cart.deleteMany(item2find, function(err) {
    if (err) {
      console.error(err);
      res.render("error", { message: "Error processing your checkout." });
    } else {
      res.render("Thankyou", { message: "THANK YOU SO MUCH FOR SHOPPING", req: req });
    }
  });
});


app.listen(3000, function () {
  console.log("server is listening!!!");
});
