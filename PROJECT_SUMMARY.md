## Project Summary

**Name**: n8n-nodes-render
**Version**: 1.0.0
**Author**: Velocity BPA, LLC
**License**: Business Source License 1.1 (BSL 1.1)

### Overview
A comprehensive n8n community node for Render Network - the decentralized GPU rendering and AI compute platform built on Solana blockchain. Enables workflow automation for 3D rendering jobs, AI inference, wallet management, staking operations, and network monitoring.

### Key Features
- Submit and manage 3D render jobs (OctaneRender, Cycles, Redshift, Arnold, V-Ray)
- Run AI inference and training on distributed GPU network
- Manage RENDER/SOL wallets, transfers, and transaction history
- Stake RENDER tokens, claim rewards, and monitor APY
- Real-time WebSocket triggers for job and network events

### Resources
- 17 resource categories
- 150+ operations
- 2 trigger types (Job Events, Network Events)

### Technical Stack
- TypeScript
- n8n Community Node API v1
- @solana/web3.js, @solana/spl-token
- Axios for REST API
- WebSocket for real-time streaming

### Target Users
- 3D Artists and Animation Studios
- AI/ML Engineers and Researchers
- DeFi and Blockchain Developers

---

## Short Description

A comprehensive n8n community node for Render Network providing 17 resources and 150+ operations for GPU rendering, AI compute, wallet management, staking, and network statistics on Solana blockchain. Includes WebSocket triggers for real-time event monitoring.

---

## Installation Instructions

### Method 1: Via n8n GUI (Recommended)
```
1. Open n8n
2. Go to Settings → Community Nodes
3. Click "Install a community node"
4. Enter: n8n-nodes-render
5. Click Install
```

### Method 2: Local Development Installation

```bash
# 1. Extract the zip file
unzip n8n-nodes-render.zip
cd n8n-nodes-render

# 2. Install dependencies
npm install

# 3. Build the project
npm run build

# 4. Create symlink to n8n custom nodes directory
# For Linux/macOS:
mkdir -p ~/.n8n/custom
ln -s $(pwd) ~/.n8n/custom/n8n-nodes-render

# For Windows (run as Administrator):
# mklink /D %USERPROFILE%\.n8n\custom\n8n-nodes-render %CD%

# 5. Restart n8n
n8n start
```

### Testing the Node

```bash
# Run unit tests
npm test

# Run tests with coverage
npm run test:coverage

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix
```

### Verify Installation in n8n

1. Open n8n in your browser (default: http://localhost:5678)
2. Create a new workflow
3. Click the "+" button to add a node
4. Search for "Render"
5. The node should appear in the list:
   - "Render Network" (action node)
   - "Render Trigger" (trigger node)
6. Add the node and configure credentials
7. Test the node operations

---

## Credentials Setup

### Render Network Credentials
For wallet and blockchain operations:
- Network: Solana Mainnet/Devnet/Custom
- RPC URL: Your Solana RPC endpoint
- Private Key: Base58 or JSON byte array

### Render API Credentials
For API-based operations:
- API Key: Your Render Network API key
- Creator Account ID: Your account identifier
- API Endpoint: https://api.rendernetwork.com (or custom)

### Node Operator Credentials
For node operator functions:
- Operator ID: Your operator ID
- Auth Token: Authentication token
- Tier: Node tier level (1-4)

---

## Author Information

**Author:** Velocity BPA, LLC  
**Website:** https://velobpa.com  
**GitHub:** https://github.com/Velocity-BPA  
**Repository:** https://github.com/Velocity-BPA/n8n-nodes-render  
**Licensing:** licensing@velobpa.com

---

## License

> **[Velocity BPA Licensing Notice]**
>
> This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
>
> Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA.
>
> For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.

### Free Use
Permitted for personal, educational, research, and internal business use.

### Commercial Use
Use of this node within any SaaS, PaaS, hosted platform, managed service,
or paid automation offering requires a commercial license.

For licensing inquiries: licensing@velobpa.com

See [LICENSE](LICENSE), [COMMERCIAL_LICENSE.md](COMMERCIAL_LICENSE.md), and [LICENSING_FAQ.md](LICENSING_FAQ.md) for details.

---

## Support

- **Issues:** https://github.com/Velocity-BPA/n8n-nodes-render/issues
- **Render Network Docs:** https://render.network/docs
- **n8n Community:** https://community.n8n.io
- **Licensing:** licensing@velobpa.com

---

## GitHub Commit Structure

```bash
# Extract and navigate
unzip n8n-nodes-render.zip
cd n8n-nodes-render

# Initialize and push
git init
git add .
git commit -m "Initial commit: n8n Render Network blockchain community node

Features:
- Wallet: Get RENDER/SOL balance, transfer tokens, transaction history
- Job: Create render jobs, get status, cancel, download results
- Rendering: Submit 3D/animation jobs, configure quality/resolution
- AI Compute: Submit inference/training jobs, get results, token usage
- Node: Get node info, status, capacity, jobs, earnings
- Node Operator: Manage operator profile, nodes, payouts
- Pricing: Get current rates, calculate job costs, volume discounts
- Staking: Stake/unstake RENDER, claim rewards, get APY
- Escrow: Deposit, withdraw, manage job payments
- Frame: Get frame status, download, retry failed frames
- Scene: Upload, validate, manage 3D scene files
- Output: Download renders, convert formats, get thumbnails
- Network Stats: Get network metrics, GPU distribution, job statistics
- GPU: Get available GPUs, reserve, compare performance
- Queue: Get position, estimate wait, prioritize jobs
- Burn-Mint: Track BME economics, burn/mint rates, token circulation
- Utility: Unit conversion, message signing, validation tools"

git remote add origin https://github.com/Velocity-BPA/n8n-nodes-render.git
git branch -M main
git push -u origin main
```
