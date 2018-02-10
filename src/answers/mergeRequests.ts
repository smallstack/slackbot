import { IOC } from "@smallstack/common";
import { Slackbot } from "../Slackbot";
import { GitlabReminderService } from "../GitlabReminderService";

IOC.onRegister("gitlabReminderService", (gitlabReminderService: GitlabReminderService) => {
    IOC.onRegister("slackbot", (slackbot: Slackbot) => {

        slackbot.addSlackbotAnswer({
            description: "mr overview - Lists all open merge requests",
            messageRegex: "^mr overview$", answerCallback: (message: any) => {
                slackbot.sendMessage(message.channel, "I'll process all merge requests quickly, one sec...");
                gitlabReminderService.getMRReminderMessage().then((mrMessage) => {
                    slackbot.sendMessage(message.channel, "Open Merge Requests: ", mrMessage);
                });
            }
        });
    });
});
