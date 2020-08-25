/* worker process watches redis and whenever new value is inserted, the 
worker process calculates and stores the fib number back inton redis
*/
const keys = require('./keys');
const redis = require('redis');

const redisClient = redis.createClient({
    host: keys.redisHost,
    port: keys.redisPort,
    retry_strategy: ()=> 1000
});

//subscription
const sub = redisClient.duplicate();

function fib(index) {
    if (index <2 )
        return 1;

    return fib(index - 1) + fib(index - 2);
}

/**
 * * message subscription
 * * any time a new value shows up in redis, calc a fib number and
 * * store it in the 'values' hash where message is the key and fib 
 * * value is the value
 */
sub.on('message', (channel, message) => {
    redisClient.hset('values', message, fib(parseInt(message)));
});
// sunscribe to inserts 
sub.subscribe('insert');