// This Node app serves two purposes:
// 1. Function as an API to our COVID database.
// 2. Deliver a front end for our app (via /public/ folder)

// Libraries
const express = require ('express');    // Library to handle HTTP requests
const mongodb = require('mongodb');     // Library to connect to mongodb

// Express Setup
const app	= express();  			      // activate an express app
app.use( express.json() ); 	      	// enable parsing of JSON data
app.use('/Covid' , express.static('public'));  // serve public files (e.g. index.html)
const port = 8000;						      // port to listen for requests

// MongoDB Options
const mongo_url = "mongodb://localhost:27017/";		// mongodb url
const database = 'covid';										// name of database
const collection = 'owid';									// name of collection
const options = {useUnifiedTopology: true}; // mongodb options

// connect to MongoDB
mongodb.MongoClient.connect(mongo_url, options)
.then( client => {

  //endpoint for getting a distinct list of countries.
  app.get('/Covid/countries/', (req, res) => {
    client.db(database).collection(collection)
    .distinct( "location", {} , (err, item) => {
      if (err) { res.send({ 'error': 'An error has occured' }); }
      else { res.send( item );	}		// send the result back.
    });
  });

  //endpoint to get data for one specific country.
  app.get('/Covid/:country', (req, res) => {
		client.db(database).collection(collection)
    .find(  { 'location': req.params.country } )
    .project( {'data.total_cases':1, 'data.date':1 , '_id':0} )
    .next( (err, country) => {
			if (err) { res.send({ 'error': 'An error has occured' }); }
			else { res.send( country );	}		// send the result back.
		});
	});

	app.listen(port, () => {
		console.log("We are live on " + port);
	});

}).catch( e => console.log(e) );
