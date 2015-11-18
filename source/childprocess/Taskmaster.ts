/// <reference path="../ServerConfiguration" />
/// <reference path="../RepositoryConfiguration" />
/// <reference path="../Action" />
/// <reference path="../ExecutionResult" />
/// <reference path="GitCommands" />
var execSync = require('child_process').execSync
var fs = require("fs")
module Print.Childprocess {
	export class Taskmaster  {
		private pullRequestNumber: number;
		private user: string;
		private primaryRepository: Childprocess.GitCommands;
		private secondaryRepository: Childprocess.GitCommands;
		private branch: string;
		private repositoryConfiguration: RepositoryConfiguration;
		private actions: Action[] = [];
		constructor(pullRequestNumber: number, user: string,name: string, organization: string, branch: string) {
			this.pullRequestNumber = pullRequestNumber;
			this.user = user;
			this.primaryRepository = new Childprocess.GitCommands(this.pullRequestNumber, this.user, name, organization);
			this.branch = branch;
		}
		setup(repository: Childprocess.GitCommands, branch: string) {
			repository.clone(repository.name, branch);
			repository.setUpstream(repository.name, repository.organization);
			repository.fetch(repository.name);
			repository.merge(repository.name);
		}
		readRepositoryConfiguration(repository: string) {
			var json = fs.readFileSync(this.pullRequestNumber +"/"+ this.primaryRepository.name +"/"+ repository+".json", "utf-8");
			var repositoryConfiguration: RepositoryConfiguration = JSON.parse(json);
			return repositoryConfiguration;
		}
		readRepositoryConfigurationTMP(repositoryName: string) : RepositoryConfiguration {
			var json = fs.readFileSync(repositoryName+".json", "utf-8");
			var repositoryConfiguration: RepositoryConfiguration = JSON.parse(json);
			return repositoryConfiguration;
		}
		manage() : ExecutionResult[]   {
			console.log('manage');
			// Create folder
			if (!fs.existsSync(String(this.pullRequestNumber))){
			    fs.mkdirSync(String(this.pullRequestNumber));
			}

			// Clone, set upstream, fetch and merge primary repo
			if (!fs.existsSync(this.pullRequestNumber + '/' + this.primaryRepository.name)){
				this.setup(this.primaryRepository, this.branch);
			}
			else {
				this.primaryRepository.fetchFromOrigin(this.primaryRepository.name);
				this.primaryRepository.resetToOrigin(this.primaryRepository.name);
				this.primaryRepository.merge(this.primaryRepository.name);
			}

			// Read repository Configuration file in repo
			var repositoryConfiguration: RepositoryConfiguration = this.readRepositoryConfiguration(this.primaryRepository.name);

			// Clone secondary repository
			if(!(repositoryConfiguration.secondary == 'none')) {
				if (!fs.existsSync(this.pullRequestNumber + '/' + repositoryConfiguration.secondary)){
					this.secondaryRepository = new Childprocess.GitCommands(this.pullRequestNumber, this.user, repositoryConfiguration.secondary , repositoryConfiguration.secondaryUpstream );
					this.setup(this.secondaryRepository, this.branch);
				}
			}
			
			//  Perform actions
			this.actions = repositoryConfiguration.actions;
			var actionResult = this.executeActionList();
			console.log(actionResult);
			return actionResult;
		}
		createJSON(myClass : any) {
		}
		executeActionList() : ExecutionResult[]  {
			var executionResult: ExecutionResult[] = [];
			for (var v in this.actions) {
				var action = this.actions[v];
				var result = this.executeAction(action);
				executionResult.push(new Print.ExecutionResult(action.task,result));
			}
			return executionResult;
		}
		executeAction(action: Action) : string {
			var command = 'cd ' + this.pullRequestNumber + '/' + this.primaryRepository.name + ' && ';
			if (action.dependency == 'none') {
				command = command + action.task;
			}
			else {
				command = command + action.task + ' ' +  __dirname + '/../video/' + action.dependency;
			}
			try {
				var outputValue = execSync(command);
				var outputArray = String(outputValue).split('\n');
				var returnValue = outputArray[outputArray.length -2]
				return returnValue;
			}
			catch (ex) {
				return 'fail'
			}
		}
	}
}
