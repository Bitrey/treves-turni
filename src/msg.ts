import { readFile, writeFile } from "fs/promises";
import path from "path";

export interface Message {
    id: number;
    author: string;
    msg: string;
    date: Date;
}

type NewMessage = Omit<Message, "id" | "date">;

class MsgHandler {
    private static readonly msgsFilePath = path.join(process.cwd(), "msg.json");

    constructor() {
        readFile(MsgHandler.msgsFilePath).catch(() => writeFile(MsgHandler.msgsFilePath, "[]"));
    }

    async getMsgs(): Promise<Message[]> {
        const msgs = await readFile(MsgHandler.msgsFilePath, { encoding: "utf-8" });
        return JSON.parse(msgs);
    }

    async setMsgs(msgs: Message[]): Promise<void> {
        await writeFile(MsgHandler.msgsFilePath, JSON.stringify(msgs));
    }

    async addMsg(msg: NewMessage): Promise<void> {
        const msgs = await this.getMsgs();
        msgs.push({ ...msg, id: msgs.length + 1, date: new Date() });
        await this.setMsgs(msgs);
    }

    async deleteMsg(id: number): Promise<void> {
        const msgs = await this.getMsgs();
        const filteredMsgs = msgs.filter((msg: Message) => msg.id !== id);
        await this.setMsgs(filteredMsgs);
    }
}

export default MsgHandler;
