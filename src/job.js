class Job {

    constructor(id, duration, data = {}) {

        this.id = id;
        this.duration = duration;
        this.data = data;

    }

    toJSON() {

        return {
            id: this.id,
            duration: this.duration,
            data: this.data
        }


    }

}

module.exports = Job;