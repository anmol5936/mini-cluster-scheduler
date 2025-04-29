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
                    if (data.toString() === 'GET_LOAD') {
                        this.getLoad().then(load => {
                            socket.write(JSON.stringify(load));
                            socket.end();
                        }).catch(err => {
                            console.error('Error getting load:', err);
                            socket.write('Error: Unable to get load');
                            socket.end();
                        });
                    } else {
                        const jobData = JSON.parse(data);
                        const job = new Job(jobData.id, jobData.duration, jobData.data);
                        job.progress = jobData.progress;
                        this.load++;
                        console.log(`Worker ${this.id} load incremented to ${this.load} for job ${job.id}`);
                        setTimeout(() => {
                            this.load--;
                            console.log(`Worker ${this.id} load decremented to ${this.load} for job ${job.id}`);
                            socket.write(`Job ${job.id} completed`);
                            socket.end();
                        }, job.duration * 1000);
                    }
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
        return new Promise((resolve, reject) => {
            this.server.listen(this.port, () => {
                console.log(`Worker ${this.id} listening on port ${this.port}`);
                resolve();
            });
            this.server.on('error', reject);
        });
    }

    async getLoad() {
        const cpu = await si.currentLoad();
        const cpuInfo = await si.cpu(); // Get CPU core count
        return {
            id: this.id,
            load: this.load,
            cpuUsage: cpu.currentLoad,
            cores: cpuInfo.cores // Number of CPU cores
        };
    }
}

module.exports = WorkerNode;