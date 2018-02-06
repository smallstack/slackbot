export interface SlackbotAnswer {
    messageRegex: string;
    description: string;
    answerCallback: (messageReceived: any) => any;
}
