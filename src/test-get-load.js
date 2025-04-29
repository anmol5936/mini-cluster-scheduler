const net = require('net');
const client = net.createConnection({ port: 5001 }, () => {
    client.write('GET_LOAD');
});
client.on('data', data => {
    console.log('Load:', JSON.parse(data));
    client.end();
});
client.on('end', () => {
    console.log('Connection closed');
});
client.on('error', err => {
    console.error('Client error:', err);
});