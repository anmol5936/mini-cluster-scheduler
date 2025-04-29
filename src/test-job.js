const Job = require("./job");

const job1 = new Job("1", 5, { task:"calculate" });

console.log(job1.toJSON()); 