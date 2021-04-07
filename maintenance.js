// This script maintains a MongoDB collection of COVID data
// it fetches the latest COVID data from and updates a local copy.

// Benefits of caching our own copy of the data:
// -Ability to run your own queries & projections with Mongo
// -Save the user from having to download the entire dataset
// -No need to rely on external data file

// COVID-19 Data is sourced from Our World In Data:
// https://raw.githubusercontent.com/owid/covid-19-data/master/public/data/owid-covid-data.json

// Updates run on a schedule using node-cron
// See also: https://www.npmjs.com/package/node-cron

// To auto-run this in the background, daemonize it (e.g. with pm2)
// See also: https://pm2.keymetrics.io/

// Libraries
const fetch = require('node-fetch');	// Library to fetch JSON data
const cron = require('node-cron');		// Library to schedule tasks
const mongodb = require('mongodb');		// Library to connect to mongodb

// Settings
const covid_data_url = 'https://raw.githubusercontent.com/owid/covid-19-data/master/public/data/owid-covid-data.json';
const mongo_url = "mongodb://localhost:27017/";		// mongodb url
const database_name = 'covid';	   // name of database
const collection_name = 'owid';   // name of collection
const options = {useUnifiedTopology: true}; // mongodb options

// Set up a schedule to fetch new data daily
cron.schedule('* 1 * * *', () => {
	mongodb.MongoClient.connect(mongo_url, options).then( mongo_client => { 
		console.log('Downloading and Parsing New Data.');
		fetch(covid_data_url)
			.then(response => response.json())
			.then(json => saveData(json, mongo_client) );
	}).catch( e => console.log(e) ) 
}, null, true);

// remove old data from Mongo and replace with new data. 
const saveData = async (countries, mongo_client) => {
	console.log('Updating Database.');
	const collection = mongo_client.db(database_name).collection(collection_name);
	for (key of Object.keys(countries)){
		console.log('Updating ' + countries[key].location + '.')
		await collection.deleteOne( { 'location' : countries[key].location } )
		await collection.insertOne( countries[key] )
	}
	console.log('Update Complete.')
}
