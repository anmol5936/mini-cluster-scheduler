class Job {
    constructor(id, duration, data) {
        this.id = id;
        this.duration = duration;
        this.data = data;
        this.progress = 0;
    }

    toJSON() {
        return {
            id: this.id,
            duration: this.duration,
            data: this.data,
            progress: this.progress
        };
    }
}

module.exports = Job;