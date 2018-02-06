import { Slackbot } from "./Slackbot";
import { GitlabReminderService } from "./GitlabReminderService";
import { Logger, IOC } from "@smallstack/common";
import { CronJob } from "cron";

// variables
const slackToken: string = process.env.SLACK_TOKEN;
const slackReminderChannel: string = process.env.SLACK_REMINDER_CHANNEL;
const slackMRReminderEnabled: boolean = process.env.SLACK_MR_REMINDER_ENABLED === "false" ? false : true;
const gitlabToken: any = process.env.GITLAB_TOKEN;
const gitlabGroupName: any = process.env.GITLAB_GROUP_NAME;

// create the slackbot
Logger.info("Start", "Creating slackbot...");
IOC.register("slackbot", new Slackbot(slackToken));

// create gitlab service
Logger.info("Start", "Creating gitlab service...");
const gitlabReminderService: GitlabReminderService = new GitlabReminderService({ gitlabToken, groupName: gitlabGroupName, slackChannel: slackReminderChannel });
// IOC.register("gitlabReminderService", gitlabReminderService);

// start the reminders

// every day at 9 about open MRs
if (slackMRReminderEnabled) {
    Logger.info("Start", "Starting MR Reminder Cronjob...");
    new CronJob("0 9 * * *", () => {
        gitlabReminderService.remindAboutMRs();
    }, null, true, 'Europe/Berlin');
}