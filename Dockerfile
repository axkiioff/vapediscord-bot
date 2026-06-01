FROM node:22-alpine

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

COPY package.json pnpm-workspace.yaml ./
COPY artifacts/discord-bot/ ./artifacts/discord-bot/

RUN pnpm install --filter @workspace/discord-bot...

WORKDIR /app/artifacts/discord-bot

CMD ["node", "--import", "tsx/esm", "src/index.ts"]
