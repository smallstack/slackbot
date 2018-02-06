import * as moment from "moment";
import * as durationFormat from "moment-duration-format";
import { IOC } from "@smallstack/common";
import { Slackbot } from "../Slackbot";
import { GitlabReminderService } from "../GitlabReminderService";

// configure momentjs
durationFormat(moment);

IOC.onRegister("gitlabReminderService", (gitlabReminderService: GitlabReminderService) => {
    IOC.onRegister("slackbot", (slackbot: Slackbot) => {

        const durationFormatTemplate: string = "d [days], h [hrs], m [min]";
        slackbot.addSlackbotAnswer({
            description: "gtt project _ProjectName_ - Prints time spent values for projects",
            messageRegex: "^gtt project [a-zA-Z0-9\-/]{3,}$", answerCallback: (message: any) => {
                const projectNameRegex: RegExpExecArray = new RegExp("^gtt project ([a-zA-Z0-9\-/]{3,}$)").exec(message.text);
                if (projectNameRegex === null)
                    slackbot.sendMessage(message.channel, "You can get project times via `gtt project PROJECTNAME`!");
                else {
                    const projectName: string = projectNameRegex[1];
                    if (!projectName)
                        slackbot.sendMessage(message.channel, "You can get project times via `gtt project PROJECTNAME`!");
                    else {
                        slackbot.sendMessage(message.channel, `I'll sum up the times for the project '${projectName}' quickly, give me a minute...`);
                        try {
                            gitlabReminderService.getAllProjectIssues(projectName, { scope: "all", state: "closed" }).then((issues) => {
                                let totalTimeSpent: number = 0;
                                const rightNow: Date = new Date();
                                const firstDateOfThisMonth: number = new Date(rightNow.getFullYear(), rightNow.getMonth(), 1, 0, 0, 0, 0).getTime();
                                for (const issue of issues) {
                                    const closedAt: number = new Date(issue.closed_at).getTime();
                                    if (closedAt > firstDateOfThisMonth && issue.time_stats && issue.time_stats.total_time_spent)
                                        totalTimeSpent += issue.time_stats.total_time_spent;
                                }
                                let humanReadable: string = moment.duration(totalTimeSpent, 'seconds')["format"](durationFormatTemplate);
                                slackbot.sendMessage(message.channel, `total time spent this month: ${humanReadable}`);
                            }).catch((error) => {
                                slackbot.sendMessage(message.channel, `oh gosh, I stumbled: ${error.message}!`);
                            });
                        } catch (error) {
                            slackbot.sendMessage(message.channel, `oh gosh, I stumbled: ${error.message}!`);
                        }
                    }
                }
            }
        });
    });
});
