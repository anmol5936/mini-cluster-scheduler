const WorkerNode = require('./worker');
const Scheduler = require('./scheduler');
const Job = require('./job');

async function main() {
    const worker1 = new WorkerNode(1, 5001);
    const worker2 = new WorkerNode(2, 5002);
    await Promise.all([worker1.start(), worker2.start()]);
    const nodes = [{ id: 1, port: 5001 }, { id: 2, port: 5002 }];
    const schedulerRR = new Scheduler(nodes, 'roundRobin');
    schedulerRR.submitJob(new Job("1", 3, { task: "calculate" }));
    schedulerRR.submitJob(new Job("2", 4, { task: "process" }));
    schedulerRR.submitJob(new Job("3", 2, { task: "compute" }));
    const schedulerLL = new Scheduler(nodes, 'leastLoaded');
    schedulerLL.submitJob(new Job("4", 2, { task: "analyze" }));
}

main().catch(err => console.error('Error:', err));