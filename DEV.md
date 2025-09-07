# Dev workflow: image-based

This flow builds a custom n8n image that already contains the Bluesky node installed. Docker caches layers so rebuilds are fast when `dist/` hasn't changed.

Prereqs
- Build on host first so `dist/` exists:
  - `pnpm install`
  - `pnpm build`

Build and run
- Build the dev image and start n8n on port 5679:
  - `docker compose -f docker-compose.image-dev.yml build`
  - `docker compose -f docker-compose.image-dev.yml up -d`
- Open http://localhost:5679 and add the node.

Update loop
1) Make code changes
2) `pnpm build`
3) `docker compose -f docker-compose.image-dev.yml build`
4) `docker compose -f docker-compose.image-dev.yml up -d`

Rollback (if UI blanks)
- Stop the dev stack: `docker compose -f docker-compose.image-dev.yml down`
- Fix code, rebuild `dist/`, then rebuild the image.

Notes
- No bind-mounted user folder, so the preinstalled node remains available inside the container.
- The Dockerfile installs the package with:
  `npm install --omit=dev --no-audit --no-fund --prefix "$N8N_USER_FOLDER"/nodes "$N8N_USER_FOLDER"/custom/n8n-nodes-bluesky-enhanced`
- You can change base image via `N8N_IMAGE` build-arg if needed.Local dev loop for Bluesky nodes (safe isolated instance)

1) Start dev n8n on a different port
- Requires Docker and docker compose.

- Build your node once on host:
  - pnpm install
  - pnpm build

- Launch the isolated instance:
  - docker compose -f docker-compose.dev.yml up -d
  - The UI is on http://localhost:5679

2) Install the node inside the dev container
- Open a shell:
  - docker compose -f docker-compose.dev.yml exec n8n bash -lc "cd \"${N8N_USER_FOLDER:-/home/node/.n8n}\"/custom/n8n-nodes-bluesky-enhanced && npm install --omit=dev --no-audit --no-fund"
- Copy into community folder so n8n discovers it:
  - docker compose -f docker-compose.dev.yml exec n8n bash -lc "mkdir -p \"${N8N_USER_FOLDER:-/home/node/.n8n}\"/nodes/node_modules && cp -r \"${N8N_USER_FOLDER:-/home/node/.n8n}\"/custom/n8n-nodes-bluesky-enhanced \"${N8N_USER_FOLDER:-/home/node/.n8n}\"/nodes/node_modules/"
- Restart:
  - docker compose -f docker-compose.dev.yml restart n8n

3) Iterate safely
- After code changes: pnpm build
- Re-run the two container steps (npm install inside container only if dep set changed)
- Restart container

4) Quick uninstall if Add Node panel blanks
- docker compose -f docker-compose.dev.yml exec n8n bash -lc "rm -rf \"${N8N_USER_FOLDER:-/home/node/.n8n}\"/nodes/node_modules/n8n-nodes-bluesky-enhanced"
- docker compose -f docker-compose.dev.yml restart n8n

5) Notes
- Default user folder is /home/node/.n8n in the official image.
- Do not use a custom aggregator; let n8n discover via nodes/node_modules.
- Ensure package.json n8n block points to dist/*.js paths.

## Dev workflow: @n8n/node-cli (recommended)

This route starts a local n8n pointed at this package with auto-linking and hot reload. No Docker required.

Prereqs
- Node 18+
- pnpm 9+

Setup
- pnpm install

Run (hot reload)
- pnpm dev

What happens
- TypeScript watcher compiles to `dist/`
- `n8n-node dev` starts n8n and links this package as a custom node
- Open http://localhost:5678 and use the node

Build
- pnpm build

Troubleshooting
- If the node doesn’t show, clear: `rm -rf ~/.n8n-node-cli/.n8n/custom` and re-run `pnpm dev`
