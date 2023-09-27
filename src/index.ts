import "dotenv/config";

import { Elysia, t } from "elysia";
import { html } from "@elysiajs/html";
import { staticPlugin } from "@elysiajs/static";
import { cleanEnv, str, num } from "envalid";
import { readFile } from "fs/promises";
import MsgHandler from "./msg";

export const envs = cleanEnv(process.env, {
    NODE_ENV: str({
        choices: ["development", "production"]
    }),
    PORT: num()
});

enum Actions {
    HELLO = "hello",
    OK = "ok",
    ERROR = "error",
    RECEIVE_MSGS = "receive_msgs",
    SEND_MSG = "send_msg",
    DELETE_MSG = "delete_msg"
}

const msgHandler = new MsgHandler();

try {
    const app = new Elysia()
        .use(html())
        .use(staticPlugin())
        .ws("/ws", {
            message(ws, message) {
                const { action, payload } = message;

                switch (action) {
                    case Actions.HELLO:
                        ws.send({
                            action: Actions.HELLO,
                            payload: "Hello from Mirella Wells!"
                        });
                        break;
                    case Actions.RECEIVE_MSGS:
                        msgHandler.getMsgs().then(msgs => {
                            ws.send({
                                action: Actions.RECEIVE_MSGS,
                                payload: msgs
                            });
                        });
                        break;
                    case Actions.SEND_MSG:
                        if (typeof payload !== "string") {
                            ws.send({
                                action: Actions.ERROR,
                                payload: "Payload must be a string"
                            });
                            return;
                        } else if (payload.length > 100) {
                            ws.send({
                                action: Actions.ERROR,
                                payload: "Payload must be less than 100 characters"
                            });
                            return;
                        }

                        msgHandler.addMsg(JSON.parse(payload as string)).then(() => {
                            msgHandler.getMsgs().then(msgs => {
                                ws.send({
                                    action: Actions.RECEIVE_MSGS,
                                    payload: msgs
                                });
                            });
                        });
                        break;
                    case Actions.DELETE_MSG:
                        if (isNaN(Number(payload))) {
                            ws.send({
                                action: Actions.ERROR,
                                payload: "Payload must be a number"
                            });
                            return;
                        }

                        msgHandler.deleteMsg(Number(payload)).then(() => {
                            msgHandler.getMsgs().then(msgs => {
                                ws.send({
                                    action: Actions.RECEIVE_MSGS,
                                    payload: msgs
                                });
                            });
                        });
                        break;
                }
            },
            body: t.Object({
                action: t.Enum(Actions),
                payload: t.Optional(t.String())
            })
        })
        .get("/", async () => await readFile("index.html", { encoding: "utf-8" }))
        .listen(envs.PORT);
    console.log(`Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
} catch (err) {
    console.error(err);
    process.exit(1);
}
