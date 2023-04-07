var path = require ('path');
var favicon = require('serve-favicon');
const bodyParser = require('body-parser');

const hostname = '127.0.0.1';
const port = 3000;

const { render } = require('ejs');
const express = require('express')
const flash = require('express-flash')
const session = require('express-session');
const exp = require('constants');
const app = express();

const mysql = require('mysql');
const con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database:"FinalJs"
});

//set view engine to ejs
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(
    session({
      secret: '123@123abc',
      resave: false,
      saveUninitialized: true,
      cookie: { maxAge: 60000 },
    }),
  );
app.use(flash());

//set css
//app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static("public")); 

//set favi
app.use(favicon(path.join(__dirname, 'public', '/images/favicon.ico')));

// Parse incoming request bodies
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/cart/count', (req, res) => {
  // Query the database to get the number of products in the cart
  con.query('SELECT COUNT(*) AS count FROM cart', (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error retrieving cart count');
    } else {
      // Send the count as JSON
      res.json({ count: result[0].count });
    }
  });
});


app.get('/', function(req,res){
    con.query('SELECT * FROM pc', (err, results) => {
        if(err) throw err;
        res.render('pages/index', {pc: results});
    });
});
app.get('/design', function(req,res){
  con.query('SELECT * FROM pc where type = 1', (err, results) => {
    if(err) throw err;
    res.render('pages/design', {pc: results});
  });
});
app.get('/gaming', function(req,res){
  con.query('SELECT * FROM pc where type = 0', (err, results) => {
    if(err) throw err;
    res.render('pages/gaming', {pc: results});
  });
});
app.get('/pc/:id', (req, res) => {
    const id = req.params.id;
    
    // Use MySQL query to get the product with the given ID
    con.query('SELECT * FROM pc WHERE id = ?', [id], (err, results) => {
      if (err) {
        // Handle error
        console.error(err);
        res.status(500).send('Internal Server Error');
        return;
      }
  
      if (results.length === 0) {
        // Handle case where no product was found with the given ID
        res.status(404).send('Product not found');
        return;
      }
  
      // Render the product detail template with the product data
      const pc = results[0];
      res.render('pages/detail', { pc });
      
    });
  });
  app.post('/cart/remove/:pcid', (req, res) => {
    const pcid = req.params.pcid;
  
    // Delete the item from the database
    con.query('DELETE FROM cart WHERE productid = ?', [pcid], (err, results) => {
      if (err) throw err;
      console.log('Deleted item with id =',[pcid]);
      res.redirect('/cart');
    });
  });
  
  app.post('/cart/add/:pcid', function(req, res) {
    // Get the product ID from the URL parameter
    let pcid = req.params.pcid;
  
    // Get the product details from the database using the ID
    let sql = " Select * FROM pc WHERE id = ?";
    con.query(sql, [pcid], function(err, result) {
      if (err) throw err;
  
      // Check if the product is already in the cart
      let cartSql = "SELECT * FROM cart WHERE productId = ?";
      con.query(cartSql, [pcid], function(err, cartResult) {
        if (err) throw err;
  
        if (cartResult.length > 0) {
          // If the product is already in the cart, update the quantity
          let updateSql = "UPDATE cart SET quantity = quantity + 1 WHERE productId = ?";
          con.query(updateSql, [pcid], function(err, updateResult) {
            if (err) throw err;
            console.log("Add quantity already pc to cart!");
            // Return a success message
            //res.json({ success: true });
          });
        } else {
          // If the product is not in the cart, insert it with a quantity of 1
          let insertSql = "INSERT INTO cart (productId, productname, price, quantity) VALUES (?, ?, ?, ?)";
          con.query(insertSql, [result[0].id, result[0].namepc, result[0].pricepc, 1], function(err, insertResult) {
            if (err) throw err;
            console.log("Add a new pc to cart !");
            // Return a success message
            //res.json({ success: true });
          });
        }
      });
    });
  });
  app.post('/cart/checkout', function(req, res) {
    // Remove all items from the cart in your database
    con.query('DELETE FROM cart', function(error, results) {
      if (error) throw error;
      console.log("check out success full!")
      // Send a JSON response indicating success
      res.json({ success: true });
    });
  });
  
  app.get('/cart', function(req, res) {

  
    // Get the items in the cart for the current user (if applicable) or in general (if not)
    let cartSql = "SELECT c.*, p.imgpc FROM cart c,pc p where c.productid=p.id";
    
    let cartParams = [];

    con.query(cartSql, cartParams, function(err, cartResult) {
      if (err) throw err;
  
      // Render the cart page with the cart items and count
      res.render('pages/cart', {
        cartItems: cartResult,
        cartCount: cartResult.length
      });
    });
  });
    

//const dt = require('../NodeJS/datemodule');
app.listen(port, hostname, ()=>{
    console.log(`Server running at http://${hostname}:${port}/`);
});