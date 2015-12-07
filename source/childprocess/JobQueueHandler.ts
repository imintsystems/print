/// <reference path="JobQueue" />

module Print.Childprocess {
	export class JobQueueHandler {
		private jobQueues: JobQueue[];
		private runningJobQueues: number;
		private maxRunningJobQueues: number;
		constructor(maxRunningJobQueues: number) {
			this.jobQueues = [];
			this.runningJobQueues = 0;
			this.maxRunningJobQueues = maxRunningJobQueues;			
		}
		addJobQueue(jobQueue: JobQueue) {
			if (this.runningJobQueues < this.maxRunningJobQueues) {
				this.runningJobQueues++;
				jobQueue.runJobs(this.onJobQueueDone.bind(this));
			}
			else {
				this.jobQueues.push(jobQueue);
			}
		}
		onJobQueueDone() {
			if (this.jobQueues.length > 0) {
				this.jobQueues.pop().runJobs(this.onJobQueueDone.bind(this));
			}
			else {
				this.runningJobQueues--;
			}
			console.log(this.runningJobQueues.toString() + " job queues running");
		}
	}
}