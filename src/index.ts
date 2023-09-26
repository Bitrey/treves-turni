import "dotenv/config";

import { Elysia } from "elysia";
import { html } from "@elysiajs/html";
import { staticPlugin } from "@elysiajs/static";
import { cleanEnv, str, num } from "envalid";
import { readFile } from "fs/promises";

export const envs = cleanEnv(process.env, {
    NODE_ENV: str({
        choices: ["development", "production"]
    }),
    PORT: num()
});

try {
    const app = new Elysia()
        .use(html())
        .use(staticPlugin())
        .get("/", async () => await readFile("index.html", { encoding: "utf-8" }))
        .listen(envs.PORT);
    console.log(`Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
} catch (err) {
    console.error(err);
    process.exit(1);
}
