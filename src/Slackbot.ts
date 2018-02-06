import { WebClient } from "@slack/client";
import { Logger } from "@smallstack/common";

export class Slackbot {
    private webClient: any;

    constructor(token: string) {
        this.webClient = new WebClient(token);
    }

    public sendMessage(receiver: string, message: string, optionals?: any) {
        this.webClient.chat.postMessage(receiver, message, optionals)
            .then((res) => {
                Logger.info("Slackbot", `Message sent to ${receiver} with message ${message}!`);
            })
            .catch(console.error);
    }
}
