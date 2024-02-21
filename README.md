# Nest.js monolite template | Production ready

<p align="center">
  <a href="#technical-stack">Technical Stack</a>  •
  <a href="#features">Features</a> •
  <a href="#documentation">Documentation</a>  •
  <a href="#quick-start">Quick start</a> •
  <a href="#requirements">Requirements</a> •
  <a href="#docker-help">Docker help</a> •
  <a href="#e2e-tests">E2E tests</a> •
  <a href="#miscellaneous">Miscellaneous</a> •
</p>


# Technical Stack

-   Nest.js
-   Prisma + Postgresql
-   Redis (based on ioredis)
-   Elasticsearch
-   Winston + Logstash
-   Passport.js, JWT, express-session + connect-redis
-   Nest-access-control (attribute-based access control)
-   Archiver (creating .zip archives)
-   Pdfkit
-   Nodemailer
-   Zod / Class-validator
-   Swagger
-   Eslint & Prettier
-   Docker


# Features

-   [x] Following to clean (onion) architecture
-   [x] UML diagram class (auth)
-   [x] Account system based on JWT tokens (with Passport.js):
    -   [x] Signup (with email confirmation), Login, RefreshJwt, CreateRtSession, Logout
    -   [x] Mantaining of multi sessions for one user (based on refresh tokens) + self cleaning of expired sessions (cron job)
    -   [x] Several user roles with appropriate permissions (ABAC)
-   [x] Account system based on sessions (with Passport.js):
    -   [x] Login, Logout
    -   [x] Redis as storage for keeping active sessions
    -   [x] Manual decorators for login and accessing protected endpoints (based on Passport.js)
-   [x] Operations for Certificate report (generate .pdf, get (as .pdf / .zip))
-   [x] Winston logging:
    -   [x] Based on logstash transport implementation (ELK)
    -   [x] Based on file transport implementation
    -   [x] Based on only log-level transport implementation
-   [x] End-to-end logging (via Async Local Storage and traceId)
-   [x] Dto validation/transformation + Swagger:
    -   [x] Based on Zod
    -   [x] Based on Class-validator   
-   [x] Save environment variables
-   [x] Customizable bootstrapping of application (`app.module.ts`)
-   [x] Intergration tests:
    -   [x] For Redis, context, promise modules
-   [x] E2E tests:
    -   [x] For auth usecases (jwt, sessions)
    -   [x] For certificate usecases
    -   [x] For cache module
-   [x] Redis based cache system (cache wrapper module, cache bucket + invalidating, manual auto-caching decorator)
-   [x] Custom reliable Eslint & Prettier configs
-   [x] Seed, creating and restoring backup scripts for database
-   [x] Dockerization of the application
-   [ ] Gathering metrics & analytics (Clickhouse(?), Prometheus, Grafana)
-   [ ] Stress testing RPS/TRPS (with Ddosify)
-   [ ] CI/CD gitlab


# Documentation

- `docs/explanation-architecture.md` - explanation of clean architecture (a version of which we follow in this application).
- `docs/elk/*` - ELK explanation + guide how to watch logs.
- `docs/references/*` - Clean and hexagonal architecture schemas.

- `docs/abstract-sertificate.simplified-class-diagram.png` - simplified class diagram for abstract sertificate usecase (in accord to clean architecture).
- `docs/auth.class-diagram.pdf` - class diagram for auth (login usecase).


## Quick start

1. Clone this repository:
```bash
git clone git@gitlab.modsen.app:js/architecture-patterns/backend-nestjs-update.git
```

2. Install dependencies:
```bash
cd backend-nestjs-update && pnpm i
```

3. Run docker containers:
```bash
docker-compose -f docker-compose.local.yml up
```


# Requirements

1. It requires Node.js >= 18.0.0. 

	In order to check current Node.js version:
	```bash
	node -v
	```

	In order to change Node.js version use [nvm](https://github.com/nvm-sh/nvm):
	```bash
	nvm install 18 && nvm use 18
	```

2. It requires pnpm package manager. 
   
   In order to install it use:
	```bash
	npm install -g pnpm
	```

# Docker help

Run all containers:
```bash
npm run docker:start
```

Stop all containers:
```bash
npm run docker:stop
```

Restart all containers:
```bash
npm run docker:restart
```

Rebuild application (our API) image + container (f.e after changing `node_modules` / `.env files`):
```bash
npm run docker:rebuild-app
```

Remove all containers (for our project):
```bash
npm run docker:clean:containers
```

Remove all images which aren't used by any existing container (dangling):
```bash
npm run docker:clean:dangling-images
```

Remove all volumes which aren't used by any existing container (dangling):
```bash
npm run docker:clean:dangling-volumes
```

Remove all dangling images & volumes, containers (for our project) and application docker image (our API):
```bash
npm run docker:clean:full
```

# E2E tests

Usually you run application (with entire infrastructure) via:
```bash
npm run docker:start
```

Then, in order to switch from dev database to test one and restart application container with `testing env variables` (without running Nest.js server itself):
```bash
npm run app:restart-in-test-mode
```

**In order to make previous step and run e2e tests:**
```bash
npm run test:e2e:restart
```

**In order to re-run E2E tests (being inside testing infrastructure):**
```bash
npm run test:e2e
```

**Then, in order to come back to dev mode and continue developement:**
```bash
npm run app:restart-in-dev-mode
``` 
or 
```bash
npm run docker:restart
``` 

# Miscellaneous

- Since we use a lot of types in DI (instead of real attaching of implemenation) it can be extremely inconvenient to look for real implementation of injected interface in constructor (being within a class itself).
  In order to solve this problem: 
    1. Select the desired method which depends on type (f.e `this.authJwtRepository.findUserByEmail(email)`, where `authJwtRepository` is `IAuthJwtRepository<PrismaClient>`).
    2. Click `Go to implementation (CTRL + F12)`.
