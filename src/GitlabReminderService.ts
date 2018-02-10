import { Logger } from "@smallstack/common";
import { Autowired } from "@smallstack/common";
import { Slackbot } from "./Slackbot";
import { GitlabService, GitlabServiceOptions } from "@smallstack/cli";
import * as _ from "underscore";

export interface GitlabReminderServiceOptions extends GitlabServiceOptions {
    botLogoUrl?: string;
    botName?: string;
    groupName: string;
    slackChannel: string;
    slackMessage?: string;
}

export class GitlabReminderService extends GitlabService {

    @Autowired()
    private slackbot: Slackbot;

    constructor(private reminderOptions: GitlabReminderServiceOptions) {
        super(reminderOptions);
        if (!reminderOptions.botLogoUrl)
            reminderOptions.botLogoUrl = "https://about.gitlab.com/images/press/logo/logo.png";
        if (!reminderOptions.botLogoUrl)
            reminderOptions.botName = "Gitlab Merge Request Reminder";
        if (!reminderOptions.slackMessage)
            reminderOptions.slackMessage = "There are open merge request ready for review:";
    }

    public getProjectFromCache(projectId: string): any {
        return _.find(this.cachedProjects, (project) => project.id === projectId);
    }

    public createSlackMergeRequestsMessage(merge_requests) {
        Logger.info("GitlabService", "creating SlackMergeRequestsMessage ");
        const attachments = merge_requests.map((mr) => {
            let project: any = this.getProjectFromCache(mr.project_id);
            let title: string = mr.title;
            if (!project)
                Logger.error("GitlabService", "Could not find cached project with ID " + mr.project_id);
            else
                title = project.name + " -> " + title;
            return {
                color: '#FC6D26',
                author_name: mr.author.name,
                title,
                title_link: mr.web_url,
                text: mr.description,
            };
        });
        Logger.info("GitlabService", "created SlackMergeRequestsMessage ", attachments);
        return {
            text: "New MergeRequest ready for a Review!",
            attachments,
            icon_url: this.reminderOptions.botLogoUrl,
            username: this.reminderOptions.botName
        };
    }

    public getGroupMergeRequests(): Promise<any[]> {
        return this.getAllProjectsForGroup(this.reminderOptions.groupName)
            .then((projects) => {
                Logger.info("GitlabService", "found " + projects.length + " projects!");
                return Promise.all(projects.map((project) => this.getMergeRequests(project.id, "opened")));
            })
            .then((merge_requests) => {
                return [].concat(...merge_requests);
            });
    }

    public remindAboutMRs() {
        this.getMRReminderMessage()
            .then((message) => {
                return new Promise((resolve, reject) => {
                    this.slackbot.sendMessage(this.reminderOptions.slackChannel, this.reminderOptions.slackMessage, message);
                });
            }, (message) => {
                return Promise.resolve(message);
            });
    }

    public getMRReminderMessage(): Promise<any> {
        return this.getGroupMergeRequests()
            .then((merge_requests) => {
                Logger.info("GitlabService", "found merge requests: ", merge_requests.length);
                return merge_requests.filter((mr) => {
                    return mr.work_in_progress === false;
                });
            })
            .then((merge_requests) => {
                Logger.info("GitlabService", "filtered merge requests: ", merge_requests.length);
                if (merge_requests.length > 0) {
                    return this.createSlackMergeRequestsMessage(merge_requests);
                }
                else {
                    throw 'No reminders to send'
                }
            });
    }
}
