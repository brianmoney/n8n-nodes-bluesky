# Development with n8n-node-cli

This is the streamlined development workflow using `@n8n/node-cli` for local development and testing.

## Prerequisites

- Node.js >= 20.19 (current: v20.19.5)
- pnpm >= 9.1
- n8n globally installed

## Setup

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Build the project:
   ```bash
   pnpm build
   ```

## Development Workflows

### Option 1: Auto-managed n8n (Recommended for simple development)
```bash
pnpm dev:internal
```
This will:
- Build your node
- Link it to n8n-node-cli's custom folder
- Start n8n automatically
- Watch for changes and rebuild

### Option 2: External n8n (Recommended for advanced development)
Terminal 1 - Start the build watcher:
```bash
pnpm dev:watch
```

Terminal 2 - Start n8n with dev reload (isolated port and user folder):
```bash
N8N_USER_FOLDER="$HOME/.n8n-node-cli/.n8n" N8N_CUSTOM_EXTENSIONS="$HOME/.n8n-node-cli/.n8n/custom" N8N_PORT=5680 N8N_HOST=0.0.0.0 N8N_LISTEN_ADDRESS=0.0.0.0 N8N_DEV_RELOAD=true n8n start --tunnel
```

Terminal 3 - Run the external dev command:
```bash
pnpm dev
```

### Option 3: Manual linking (For debugging)
```bash
# Build and link manually
pnpm build
pnpm dev:link

# Start n8n in a separate terminal on port 5680
N8N_USER_FOLDER="$HOME/.n8n-node-cli/.n8n" N8N_CUSTOM_EXTENSIONS="$HOME/.n8n-node-cli/.n8n/custom" N8N_PORT=5680 N8N_HOST=0.0.0.0 N8N_LISTEN_ADDRESS=0.0.0.0 n8n start --tunnel
```

## Configuration

- Port and host are enforced via environment variables in the start scripts:
   - N8N_PORT=5680
   - N8N_HOST=0.0.0.0
   - N8N_LISTEN_ADDRESS=0.0.0.0
- User folder is isolated to avoid colliding with production settings:
   - N8N_USER_FOLDER=$HOME/.n8n-node-cli/.n8n
- Custom nodes path used by both CLI and start scripts:
   - N8N_CUSTOM_EXTENSIONS=$HOME/.n8n-node-cli/.n8n/custom

## Available Scripts

- `pnpm build` - Build the project using n8n-node-cli
- `pnpm build:legacy` - Build using traditional TypeScript compiler
- `pnpm dev` - Start external n8n development mode
- `pnpm dev:internal` - Start auto-managed n8n development mode
- `pnpm dev:watch` - Build and watch for changes
- `pnpm dev:link` - Manually link to n8n-node-cli custom folder
- `pnpm lint` - Lint the code using n8n-node-cli
- `pnpm lintfix` - Fix linting issues
- `pnpm release` - Publish to npm using n8n-node-cli

## Troubleshooting

### ES Module Issues
If you encounter ES module errors, ensure you're using Node.js >= 20.19:
```bash
source ~/.nvm/nvm.sh && nvm use 20.19.5
```

### Linking Issues
If the auto-linking fails, try manual linking:
```bash
pnpm dev:link
```

### n8n Not Finding Node
Make sure the N8N_CUSTOM_EXTENSIONS environment variable is set:
```bash
export N8N_CUSTOM_EXTENSIONS=/home/brian/.n8n-node-cli/.n8n/custom
```

## Testing Your Changes

1. Build your changes: `pnpm build`
2. The node should automatically reload in n8n
3. Create a new workflow in n8n and add your Bluesky node
4. Test the functionality

## Publishing

When ready to publish:
```bash
pnpm release
```

This will handle version bumping, building, and publishing to npm.
