const keys = require('./keys');
const chalk = require('chalk');
 

// express setup
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');


const app = express();
// cross origin resource sharing -- ability to make requests from one domain where
// react application will be running to another domain where express app is running
app.use(cors());
app.use(bodyParser.json());

// postgress setup
const  {Pool} = require('pg');
const pgClient = new Pool({
    user: keys.pgUser,
    host: keys.pgHost,
    database: keys.pgDatabase,
    password: keys.pgPassword,
    port: keys.pgPort
});
pgClient.on('error', () => console.log('lost postgress connection'));
// this is the table that will store fib indexes we have already seen
// a table called 'values' with one column in it
pgClient.on('connect', () => {
    console.log(chalk.green('* * * * * * * Connected to Postgres.... * * * * *'));

    pgClient
        .query('CREATE TABLE IF NOT EXISTS values (number INT)')
        .catch(err => console.log(err));    
});


// redis setup
const redis = require('redis');
const redisClient  = redis.createClient({
    host: keys.redisHost,
    port: keys.redisPort,
    retry_strategy: () => 1000 // reconnect every second
});
const redisPublisher = redisClient.duplicate();


// express route handlers
/**
 * * notice that there is no leading /api here even though
 * * thats how client makes the requests -- with a leading api
 */
app.get('/', (req, res) => {
    res.send('hi');
});

/**
 * * query postgress for all the values ever submitted to postgress
 */
app.get('/values/all', async (req, res) => {
    //this uses promises
    const values = await pgClient.query('SELECT * from values');
    res.send(values.rows);
});

/**
 * * 
*/
app.get('/values/current', async (req, res) => {
    // this uses callbacks
    redisClient.hgetall('values', (err, values) => {
        res.send(values);
    });
});

// react application putting in a new fib index and value
app.post('/values', async (req, res) => {
    const index = req.body.index;

    // max fib of 40
    if (parseInt(index) > 40)
        return res.status(422).send('index too large. Max is 40');

    // calculated value has not been calculated yet
    redisClient.hset('values', index, "nothing yet !");
    // generate the event to whoever is listening
    redisPublisher.publish('insert', index);

    // just store the fib index thats being submitted
    pgClient.query('INSERT into values(number) VALUES($1)', [index]);

    res.send({working: true});
});

app.listen(5000, err => {
    console.log(chalk.green('* * * * * * *Express server listening .... * * * * * '));
});
