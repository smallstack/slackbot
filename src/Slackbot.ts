import { WebClient, RtmClient, CLIENT_EVENTS, RTM_EVENTS } from "@slack/client";
import { Logger } from "@smallstack/common";
import { SlackbotAnswer } from "./answers/SlackbotAnswer";

export class Slackbot {
    private webClient: any;
    private rtmClient: any;
    private rtmData: any = {};
    private answerCallbacks: SlackbotAnswer[] = [];

    constructor(token: string) {
        // initialize WEB Client
        this.webClient = new WebClient(token);

        // initialize RTM Client
        this.rtmClient = new RtmClient(token, {
            dataStore: false,
            useRtmConnect: true,
        });

        this.rtmClient.on(CLIENT_EVENTS.RTM.AUTHENTICATED, (connectData) => {
            this.rtmData.selfId = connectData.self.id;
            Logger.info("Slackbot", `RTM Client logged in as ${this.rtmData.selfId} of team ${connectData.team.id}`);
        });

        this.rtmClient.on(CLIENT_EVENTS.RTM.RTM_CONNECTION_OPEN, () => {
            Logger.info("Slackbot", "RTM Client Ready!");
        });
        this.rtmClient.start();

        this.rtmClient.on(RTM_EVENTS.MESSAGE, (message) => {
            // For structure of `message`, see https://api.slack.com/events/message

            // Skip messages that are from a bot or my own user ID
            if ((message.subtype && message.subtype === 'bot_message') ||
                (!message.subtype && message.user === this.rtmData.selfId)) {
                return;
            }

            // Skip messages in public channels without the @BOT annotation
            const botIdentifier: string = "<@" + this.rtmData.selfId + "> ";
            if (message.channel.charAt(0) === "C" && message.text.indexOf(botIdentifier) !== 0)
                return;
            message.text = message.text.substring(botIdentifier.length);

            let answerFound: boolean = false;
            for (const answer of this.answerCallbacks) {
                if (new RegExp(answer.messageRegex).test(message.text)) {
                    answerFound = true;
                    answer.answerCallback(message);
                }
            }

            if (!answerFound)
                this.sendMessage(message.channel, this.computeAnswerNotFoundMessage());
        });
    }

    public sendMessage(receiver: string, message: string, optionals?: any) {
        this.webClient.chat.postMessage(receiver, message, optionals)
            .then((res) => {
                Logger.info("Slackbot", `Message sent to ${receiver} with message ${message}!`);
            })
            .catch(console.error);
    }

    public addSlackbotAnswer(answer: SlackbotAnswer) {
        this.answerCallbacks.push(answer);
    }

    private computeAnswerNotFoundMessage(): string {
        let message: string = "No clue what you're talking about... Am quite dumm, I only understand the following commands: \n";
        for (const answer of this.answerCallbacks) {
            message += `- ${answer.description}\n`;
        }
        if (this.answerCallbacks.length === 0)
            message += "- no commands registered";
        return message;
    }
}
