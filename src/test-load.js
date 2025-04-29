const WorkerNode = require('./worker');

const worker = new WorkerNode(1, 5001);

worker.getLoad().then(load => console.log(load));