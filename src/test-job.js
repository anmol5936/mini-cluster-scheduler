const Job = require("./job");

const job = new Job("1", 5, { task:"calculate" });

console.log(job);
console.log(job.toJSON()); 
console.log('JSON string:', JSON.stringify(job.toJSON()));