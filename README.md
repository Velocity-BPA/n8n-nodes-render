# n8n-nodes-render

> **[Velocity BPA Licensing Notice]**
>
> This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
>
> Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA.
>
> For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.

![Render Network](https://img.shields.io/badge/Render-Network-E94B3C)
![n8n](https://img.shields.io/badge/n8n-Community%20Node-blue)
![License](https://img.shields.io/badge/License-BUSL--1.1-blue)
![Version](https://img.shields.io/badge/Version-1.0.0-orange)

A comprehensive n8n community node package for interacting with **Render Network** - the decentralized GPU rendering and AI compute platform built on Solana.

**Author:** [Velocity BPA, LLC](https://velobpa.com)  
**GitHub:** [Velocity-BPA](https://github.com/Velocity-BPA)  
**Licensing:** [licensing@velobpa.com](mailto:licensing@velobpa.com)

---

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Credentials](#credentials)
- [Nodes](#nodes)
- [Usage Examples](#usage-examples)
- [Resources Reference](#resources-reference)
- [Development](#development)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- **17 Resource Types** with 150+ operations
- **3D Rendering** - Submit OctaneRender, Cycles, Redshift, Arnold jobs
- **AI Compute** - Run inference and training jobs on distributed GPUs
- **Wallet Management** - RENDER and SOL balance queries, transfers
- **Node Operations** - Monitor and manage render nodes
- **Staking** - Stake RENDER tokens and claim rewards
- **BME Economics** - Track burn-mint equilibrium metrics
- **Real-time Triggers** - WebSocket-based event monitoring
- **Full TypeScript Support** - Type-safe implementations

---

## Installation

### Via n8n GUI (Recommended)

1. Go to **Settings** → **Community Nodes**
2. Click **Install a community node**
3. Enter `n8n-nodes-render`
4. Click **Install**

### Via npm

```bash
# Navigate to your n8n installation
cd ~/.n8n

# Install the package
npm install n8n-nodes-render
```

### Manual Installation (Development)

```bash
# Clone the repository
git clone https://github.com/Velocity-BPA/n8n-nodes-render.git
cd n8n-nodes-render

# Install dependencies
npm install

# Build the package
npm run build

# Link for local testing
npm link

# In your n8n directory
cd ~/.n8n
npm link n8n-nodes-render
```

---

## Credentials

### Render Network Credentials
Required for wallet and blockchain operations.

| Field | Description |
|-------|-------------|
| Network | Solana Mainnet, Devnet, or Custom |
| RPC URL | Solana RPC endpoint |
| Private Key | Base58 or JSON byte array format |
| Commitment | Transaction confirmation level |

### Render API Credentials
Required for API-based operations.

| Field | Description |
|-------|-------------|
| API Key | Your Render Network API key |
| Creator Account ID | Your creator account identifier |
| API Endpoint | API base URL |

### Node Operator Credentials
Required for node operator operations.

| Field | Description |
|-------|-------------|
| Operator ID | Your node operator ID |
| Auth Token | Authentication token |
| Tier | Node tier level (1-4) |

---

## Nodes

### Render Network (Action Node)
Main node for all Render Network operations across 17 resources.

### Render Trigger (Trigger Node)
Real-time event monitoring for jobs, nodes, wallets, staking, and network events.

---

## Usage Examples

### Submit a 3D Render Job

```javascript
// Using the Render node
Resource: Rendering
Operation: Submit 3D Render Job

// Parameters
Scene ID: "scene_abc123"
Render Engine: OctaneRender
Quality: Production
Resolution: 1920x1080
Frame Range: 1-100
GPU Type: RTX 4090
```

### Check RENDER Balance

```javascript
// Using the Render node
Resource: Wallet
Operation: Get RENDER Balance

// Leave wallet address empty to use your configured wallet
// Or specify a specific address to check
```

### Monitor Job Completion

```javascript
// Using the Render Trigger node
Event Category: Job Events
Event: Job Completed
Job ID Filter: "job_xyz789" // Optional
```

### Run AI Inference

```javascript
// Using the Render node
Resource: AI Compute
Operation: Submit AI Inference Job

// Parameters
Model: llama-70b
Prompt: "Explain quantum computing"
Max Tokens: 500
Temperature: 0.7
GPU Type: A100
```

### Stake RENDER Tokens

```javascript
// Using the Render node
Resource: Staking
Operation: Stake RENDER

// Parameters
Amount: 1000
Lock Period: 30 days
```

### Track BME Statistics

```javascript
// Using the Render node
Resource: Burn-Mint (BME)
Operation: Get BME Stats

// Returns burn rate, mint rate, equilibrium status
```

---

## Resources Reference

| Resource | Operations | Description |
|----------|------------|-------------|
| **Wallet** | 10 | Balance queries, transfers, history |
| **Job** | 15 | Job creation, status, management |
| **Rendering** | 12 | 3D render job submission |
| **AI Compute** | 12 | AI inference and training |
| **Node** | 14 | Render node information |
| **Node Operator** | 10 | Operator management |
| **Pricing** | 10 | Cost and pricing info |
| **Staking** | 11 | Token staking operations |
| **Escrow** | 8 | Escrow management |
| **Frame** | 10 | Individual frame operations |
| **Scene** | 10 | Scene file management |
| **Output** | 10 | Rendered output management |
| **Network Stats** | 10 | Network metrics |
| **GPU** | 9 | GPU info and reservation |
| **Queue** | 7 | Job queue management |
| **Burn-Mint** | 7 | BME economics |
| **Utility** | 10 | Helper tools |

---

## Development

### Prerequisites

- Node.js 18.x or later
- npm 9.x or later
- n8n installed locally

### Setup

```bash
# Clone the repository
git clone https://github.com/Velocity-BPA/n8n-nodes-render.git
cd n8n-nodes-render

# Install dependencies
npm install

# Build
npm run build

# Run linting
npm run lint

# Run tests
npm test
```

### Project Structure

```
n8n-nodes-render/
├── credentials/
│   ├── RenderNetwork.credentials.ts
│   ├── RenderApi.credentials.ts
│   └── NodeOperator.credentials.ts
├── nodes/
│   └── Render/
│       ├── Render.node.ts
│       ├── RenderTrigger.node.ts
│       ├── render.svg
│       ├── actions/
│       │   ├── wallet/
│       │   ├── job/
│       │   ├── rendering/
│       │   ├── aiCompute/
│       │   ├── node/
│       │   ├── nodeOperator/
│       │   ├── pricing/
│       │   ├── staking/
│       │   ├── escrow/
│       │   ├── frame/
│       │   ├── scene/
│       │   ├── output/
│       │   ├── networkStats/
│       │   ├── gpu/
│       │   ├── queue/
│       │   ├── burnMint/
│       │   └── utility/
│       ├── transport/
│       │   ├── solanaClient.ts
│       │   ├── renderApi.ts
│       │   ├── jobClient.ts
│       │   └── streamClient.ts
│       ├── constants/
│       │   ├── networks.ts
│       │   ├── programs.ts
│       │   ├── gpuTypes.ts
│       │   └── formats.ts
│       └── utils/
│           ├── jobUtils.ts
│           ├── sceneUtils.ts
│           ├── pricingUtils.ts
│           └── unitConverter.ts
├── package.json
├── tsconfig.json
├── gulpfile.js
├── index.ts
├── README.md
└── LICENSE
```

---

## Testing

### Local n8n Testing

1. **Build the package:**
   ```bash
   npm run build
   ```

2. **Create a ZIP file for local testing:**
   ```bash
   # Create distribution package
   npm pack
   # This creates n8n-nodes-render-1.0.0.tgz
   ```

3. **Install in n8n:**
   ```bash
   # Navigate to n8n custom extensions directory
   cd ~/.n8n/custom
   
   # Extract the package
   tar -xzf /path/to/n8n-nodes-render-1.0.0.tgz
   mv package n8n-nodes-render
   
   # Install dependencies
   cd n8n-nodes-render
   npm install --production
   ```

4. **Start n8n:**
   ```bash
   n8n start
   ```

5. **Verify installation:**
   - Open n8n in browser (http://localhost:5678)
   - Create new workflow
   - Search for "Render" in nodes panel
   - Both "Render Network" and "Render Trigger" should appear

### Running with Docker

```bash
# Build custom n8n image with the node
docker build -t n8n-custom .

# Run container
docker run -it --rm \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8n-custom
```

---

## Technical Details

### Supported Networks
- **Solana Mainnet** - Production network
- **Solana Devnet** - Testing network
- **Custom RPC** - Custom endpoints

### Token Information
- **Token:** RENDER
- **Blockchain:** Solana
- **Mint Address:** `rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof`

### Supported Render Engines
- OctaneRender
- Cycles (Blender)
- Redshift
- Arnold
- V-Ray
- Corona

### Supported GPU Types
- NVIDIA RTX 4090, 4080, 3090, 3080, 3070, 3060
- NVIDIA A100, H100, A6000, A5000, A4000
- AMD RX 7900 XTX, 7900 XT

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## License

This n8n community node is licensed under the **Business Source License 1.1**.

### Free Use
Permitted for personal, educational, research, and internal business use.

### Commercial Use
Use of this node within any SaaS, PaaS, hosted platform, managed service,
or paid automation offering requires a commercial license.

For licensing inquiries: **[licensing@velobpa.com](mailto:licensing@velobpa.com)**

See also:
- [LICENSE](LICENSE) - Full license text
- [COMMERCIAL_LICENSE.md](COMMERCIAL_LICENSE.md) - Commercial licensing details
- [LICENSING_FAQ.md](LICENSING_FAQ.md) - Frequently asked questions

---

## Support

- **Documentation:** [Render Network Docs](https://render.network/docs)
- **Issues:** [GitHub Issues](https://github.com/Velocity-BPA/n8n-nodes-render/issues)
- **Website:** [velobpa.com](https://velobpa.com)
- **Licensing:** [licensing@velobpa.com](mailto:licensing@velobpa.com)

---

## Acknowledgments

- [Render Network](https://render.network) - Decentralized GPU rendering platform
- [n8n](https://n8n.io) - Workflow automation platform
- [Solana](https://solana.com) - High-performance blockchain

---

**Made with ❤️ by [Velocity BPA, LLC](https://velobpa.com)**
