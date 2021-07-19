//  OpenShift sample Node application
var express = require('express'),
    app = express(),
    morgan = require('morgan');

Object.assign = require('object-assign')

app.engine('html', require('ejs').renderFile);
app.use(morgan('combined'))

var cors = require('cors')
app.use(cors())

app.use(express.json())

var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: false}));


var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
    ip = process.env.IP || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0',
    mongoURL = process.env.OPENSHIFT_MONGODB_DB_URL || process.env.MONGO_URL,
    mongoURLLabel = "",
    serviceURL = process.env.DEVICE_AD_COLLECTOR_URL,
    localhostURL = process.env.LOCALHOST_URL;

app.get('/', function (req, res) {
    res.render('index.html', {url: localhostURL});
});

const http = require('http');

app.get('/data', function (req, res) {
    http.get(`${serviceURL}/data`, (resp) => {
        let data = '';

        // A chunk of data has been received.
        resp.on('data', (chunk) => {
            data += chunk;
        });

        // The whole response has been received. Print out the result.
        resp.on('end', () => {
            // console.log(JSON.parse(data).explanation);
            res.send(JSON.parse(data));
        });

    }).on("error", (err) => {
        console.log("Error: " + err.message);
    });
});

const axios = require('axios')

const header = {
    headers: {
        'Content-Type': 'application/json',
        'Accept': '*/*'
    }
}

app.post('/save', function (req, res) {
    const message = `"{"area":"${req.body.area}", "comentario":"${req.body.desc}","passos":"${req.body.steps}"}"`;
    const data = {
        timestamp: Date.now(),
        deviceId: req.body.deviceId,
        deviceIp: req.body.deviceIp,
        deviceMac: req.body.deviceMac,
        deviceType: req.body.deviceType,
        deviceFwVersion: req.body.deviceFwVersion,
        message: message
    }
    axios
        .post(`${serviceURL}/save`, data, header)
        .then(resp => {
            console.log(`statusCode: ${resp.statusCode}`)
            console.log(resp)
            res.send("");
        })
        .catch(error => {
            console.error(error)
            res.status(400).send(error.message);
        })
});

// if (mongoURL == null) {
//   var mongoHost, mongoPort, mongoDatabase, mongoPassword, mongoUser;
//   // If using plane old env vars via service discovery
//   if (process.env.DATABASE_SERVICE_NAME) {
//     var mongoServiceName = process.env.DATABASE_SERVICE_NAME.toUpperCase();
//     mongoHost = process.env[mongoServiceName + '_SERVICE_HOST'];
//     mongoPort = process.env[mongoServiceName + '_SERVICE_PORT'];
//     mongoDatabase = process.env[mongoServiceName + '_DATABASE'];
//     mongoPassword = process.env[mongoServiceName + '_PASSWORD'];
//     mongoUser = process.env[mongoServiceName + '_USER'];
//
//   // If using env vars from secret from service binding
//   } else if (process.env.database_name) {
//     mongoDatabase = process.env.database_name;
//     mongoPassword = process.env.password;
//     mongoUser = process.env.username;
//     var mongoUriParts = process.env.uri && process.env.uri.split("//");
//     if (mongoUriParts.length == 2) {
//       mongoUriParts = mongoUriParts[1].split(":");
//       if (mongoUriParts && mongoUriParts.length == 2) {
//         mongoHost = mongoUriParts[0];
//         mongoPort = mongoUriParts[1];
//       }
//     }
//   }
//
//   if (mongoHost && mongoPort && mongoDatabase) {
//     mongoURLLabel = mongoURL = 'mongodb://';
//     if (mongoUser && mongoPassword) {
//       mongoURL += mongoUser + ':' + mongoPassword + '@';
//     }
//     // Provide UI label that excludes user id and pw
//     mongoURLLabel += mongoHost + ':' + mongoPort + '/' + mongoDatabase;
//     mongoURL += mongoHost + ':' +  mongoPort + '/' + mongoDatabase;
//   }
// }
// var db = null,
//     dbDetails = new Object();
//
// var initDb = function(callback) {
//   if (mongoURL == null) return;
//
//   var mongodb = require('mongodb');
//   if (mongodb == null) return;
//
//   mongodb.connect(mongoURL, function(err, conn) {
//     if (err) {
//       callback(err);
//       return;
//     }
//
//     db = conn;
//     dbDetails.databaseName = db.databaseName;
//     dbDetails.url = mongoURLLabel;
//     dbDetails.type = 'MongoDB';
//
//     console.log('Connected to MongoDB at: %s', mongoURL);
//   });
// };
//
// app.get('/', function (req, res) {
//   // try to initialize the db on every request if it's not already
//   // initialized.
//   if (!db) {
//     initDb(function(err){});
//   }
//   if (db) {
//     var col = db.collection('counts');
//     // Create a document with request IP and current time of request
//     col.insert({ip: req.ip, date: Date.now()});
//     col.count(function(err, count){
//       if (err) {
//         console.log('Error running count. Message:\n'+err);
//       }
//       res.render('index.html', { pageCountMessage : count, dbInfo: dbDetails });
//     });
//   } else {
//     res.render('index.html', { pageCountMessage : null});
//   }
// });
//
// app.get('/pagecount', function (req, res) {
//   // try to initialize the db on every request if it's not already
//   // initialized.
//   if (!db) {
//     initDb(function(err){});
//   }
//   if (db) {
//     db.collection('counts').count(function(err, count ){
//       res.send('{ pageCount: ' + count + '}');
//     });
//   } else {
//     res.send('{ pageCount: -1 }');
//   }
// });

// error handling
app.use(function (err, req, res, next) {
    console.error(err.stack);
    res.status(500).send('Something bad happened!');
});

// initDb(function(err){
//   console.log('Error connecting to Mongo. Message:\n'+err);
// });

app.listen(port, ip);
console.log('Server running on http://%s:%s', ip, port);

module.exports = app;
