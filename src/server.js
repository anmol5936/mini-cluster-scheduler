const express = require('express');
const Scheduler = require('./scheduler');
const Job = require('./job');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const nodes = [{ id: 1, port: 5001 }, { id: 2, port: 5002 }];
const scheduler = new Scheduler(nodes, 'leastLoaded');
const jobHistory = []; // Store job status

// Submit a job
app.post('/api/jobs', (req, res) => {
    const { id, duration, task } = req.body;
    if (!id || !duration || !task) {
        return res.status(400).json({ error: 'Missing job details' });
    }

    // Check for duplicate job ID
    const existingJob = jobHistory.find(job => job.id === id);
    if (existingJob) {
        return res.status(409).json({ error: `Job with ID ${id} already exists` });
    }

    const job = new Job(id, duration, { task });
    scheduler.submitJob(job);
    jobHistory.push({ id, workerId: null, duration, task, status: 'pending' });
    res.json({ message: 'Job submitted', job });
});

// Get worker loads
app.get('/api/workers', async (req, res) => {
    try {
        const loads = await Promise.all(nodes.map(async node => {
            const load = await new Promise((resolve, reject) => {
                const client = require('net').createConnection({ port: node.port }, () => {
                    client.write('GET_LOAD');
                });
                client.on('data', data => {
                    resolve(JSON.parse(data));
                    client.end();
                });
                client.on('error', reject);
            });
            return { node, load };
        }));
        res.json(loads.map(item => ({
            id: item.node.id,
            load: item.load.load,
            cpuUsage: item.load.cpuUsage,
            cores: item.load.cores,
            score: item.load.cpuUsage / item.load.cores + item.load.load * 10
        })));
    } catch (err) {
        res.status(500).json({ error: 'Failed to get worker loads' });
    }
});

// Get job history
app.get('/api/jobs', (req, res) => {
    res.json(jobHistory);
});

// Update job status (called by workers via scheduler)
scheduler.scheduleJobs = async function () {
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
                    const client = require('net').createConnection({ port: node.port }, () => {
                        client.write(JSON.stringify(job.toJSON()));
                    });
                    client.on('data', data => {
                        console.log(`Worker ${node.id} response:`, data.toString());
                        client.end();
                        // Update job history
                        const jobEntry = jobHistory.find(j => j.id === job.id);
                        if (jobEntry) {
                            jobEntry.workerId = node.id;
                            jobEntry.status = 'completed';
                        }
                        resolve();
                    });
                    client.on('error', reject);
                });
                break;
            } catch (err) {
                console.error(`Worker ${node?.id || 'unknown'} failed for job ${job.id}:`, err);
                retries--;
                if (retries === 0) {
                    console.error(`Job ${job.id} failed after retries`);
                    const jobEntry = jobHistory.find(j => j.id === job.id);
                    if (jobEntry) jobEntry.status = 'failed';
                }
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    }
};

app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});