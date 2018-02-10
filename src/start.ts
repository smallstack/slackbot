import { Slackbot } from "./Slackbot";
import { GitlabReminderService } from "./GitlabReminderService";
import { Logger, IOC } from "@smallstack/common";
import { CronJob } from "cron";

// register answers
import "./answers/gtt";
import "./answers/mergeRequests";


// variables
const slackToken: string = process.env.SLACK_TOKEN;
const slackReminderChannel: string = process.env.SLACK_REMINDER_CHANNEL || "general";
const slackMRReminderEnabled: boolean = process.env.SLACK_MR_REMINDER_ENABLED === "false" ? false : true;
const gitlabToken: any = process.env.GITLAB_TOKEN;
const gitlabGroupName: any = process.env.GITLAB_GROUP_NAME;
const timezone: string = process.env.TIMEZONE || "Europe/Berlin";

// checks
if (!slackToken)
    throw new Error("No SLACK_TOKEN environment variable found!");
if (!gitlabToken)
    throw new Error("No GITLAB_TOKEN environment variable found!");
if (!gitlabGroupName)
    throw new Error("No GITLAB_GROUP_NAME environment variable found!");

// create the slackbot
Logger.info("Start", "Creating slackbot...");
const slackBot: Slackbot = new Slackbot(slackToken);
IOC.register("slackbot", slackBot);

// create gitlab service
Logger.info("Start", "Creating gitlab service...");
const gitlabReminderService: GitlabReminderService = new GitlabReminderService({ gitlabToken, groupName: gitlabGroupName, slackChannel: slackReminderChannel });
IOC.register("gitlabReminderService", gitlabReminderService);

// start reminder, every day at 9 about open MRs
if (slackMRReminderEnabled) {
    Logger.info("Start", "Starting MR Reminder Cronjob...");
    new CronJob("00 00 09 * * 1-5", () => {
        gitlabReminderService.remindAboutMRs();
    }, null, true, timezone);
}

