const net = require('net');

class Scheduler {

    constructor(nodes, policy='roundRobin') {

        this.nodes = nodes;
        this.jobQueue = [];
        this.roundRobinIndex = 0;
        this.policy = policy;

    }

    submitJob(job) {

        this.jobQueue.push(job);
        this.scheduleJobs();

    }

    async scheduleJobs() {
        while (this.jobQueue.length > 0) {
            const job = this.jobQueue.shift();
            let retries = 3;
            while (retries > 0) {
                try {
                    const node = this.policy === 'roundRobin'
                        ? this.roundRobinPolicy()
                        : await this.leastLoadedPolicy();
                    console.log(`Sending job ${job.id} to worker ${node.id}`);
                    await new Promise((resolve, reject) => {
                        const client = net.createConnection({ port: node.port }, () => {
                            client.write(JSON.stringify(job.toJSON()));
                        });
                        client.on('data', data => {
                            console.log(`Worker ${node.id} response:`, data.toString());
                            client.end();
                            resolve();
                        });
                        client.on('error', reject);
                    });
                    break;
                } catch (err) {
                    console.error(`Worker ${node?.id || 'unknown'} failed for job ${job.id}:`, err);
                    retries--;
                    if (retries === 0) console.error(`Job ${job.id} failed after retries`);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
        }
    }

    roundRobinPolicy() {
        const node = this.nodes[this.roundRobinIndex];
        this.roundRobinIndex = (this.roundRobinIndex + 1) % this.nodes.length;
        return node;
    }

    async leastLoadedPolicy() {
        const loads = [];
        for (const node of this.nodes) {
            try {
                const load = await new Promise((resolve, reject) => {
                    const client = net.createConnection({ port: node.port }, () => {
                        client.write('GET_LOAD');
                    });
                    client.on('data', data => {
                        resolve(JSON.parse(data));
                        client.end();
                    });
                    client.on('error', reject);
                });
                console.log(`Worker ${node.id} load:`, load);
                loads.push({ node, load });
            } catch (err) {
                console.error(`Worker ${node.id} failed:`, err);
            }
        }
        if (loads.length === 0) throw new Error('No workers available');
        const leastLoaded = loads.reduce((min, curr) => {
            const currScore = curr.load.cpuUsage / curr.load.cores + curr.load.load * 10;
            const minScore = min.load.cpuUsage / min.load.cores + min.load.load * 10;
            return currScore < minScore ? curr : min;
        });
        return leastLoaded.node;
    }

}

module.exports = Scheduler;