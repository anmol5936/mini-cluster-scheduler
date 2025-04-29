const net = require('net');
const si = require('systeminformation'); // Add this
const Job = require('./job');

class WorkerNode {
    constructor(id, port) {
        this.id = id;
        this.port = port;
        this.load = 0;
        this.server = net.createServer(socket => {
            socket.on('data', data => {
                try {
                    const jobData = JSON.parse(data);
                    const job = new Job(jobData.id, jobData.duration, jobData.data);
                    job.progress = jobData.progress;
                    this.load++;
                    setTimeout(() => {
                        this.load--;
                        socket.write(`Job ${job.id} completed`);
                        socket.end();
                    }, job.duration * 1000);
                } catch (err) {
                    console.error('Invalid JSON:', err);
                    socket.write('Error: Invalid job data');
                    socket.end();
                }
            });

            socket.on('error', err => {
                console.error('Socket Error:', err);
            });
        });
    }

    start() {
        this.server.listen(this.port, () => {
            console.log(`Worker ${this.id} listening on port ${this.port}`);
        });

        this.server.on('error', err => {
            console.error('Server Error:', err);
        });
    }

    async getLoad() {
        const cpu = await si.currentLoad();
        return {
            id: this.id,
            load: this.load,
            cpuUsage: cpu.currentLoad // Change 'cpu' to 'cpuUsage'
        };
    }
}

module.exports = WorkerNode;