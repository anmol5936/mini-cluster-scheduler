const net = require('net');
const Job = require('./job');

const job = new Job("1", 5, { task: "calculate" });
const client = net.createConnection({ port: 5001 }, () => {
    client.write(JSON.stringify(job.toJSON()));
});

client.on('data', data => {
    console.log('Response:', data.toString());
    client.end();
});

client.on('end', () => {
    console.log('Connection Closed');
});

client.on('error', err => {
    console.error('Client Error:', err);
});