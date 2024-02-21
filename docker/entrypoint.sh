#!/bin/sh

set -e

echo "...Run app in [${NODE_ENV}] mode..."

if [  "${NODE_ENV}" = "production" ]; then
    echo "[...Running deploy migrations for prisma...]"
    npm run prisma:deploy
    echo "[...Running application in production mode...]"
    npm run start:prod
elif [ "${NODE_ENV}" = "development" ]; then
    echo "[...Running init migrations for prisma...]"
    npm run prisma:init-migration
    echo "[...Running application in development mode...]"
    npm run start:dev
elif [ "${NODE_ENV}" = "testing" ]; then
    echo "[...Reset DB...]"
    npm run prisma:reset
    echo "[...Just sleep...]"
    # Sleep container, because we don't need to start application, but just have opportunity to reset DB
    # & connect to the network (for testing purposes)
    sleep infinity
else
    echo "[...Do nothing, NODE_ENV is not set...]"
fi
