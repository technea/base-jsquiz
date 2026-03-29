export interface BaseLessonModule {
  title: string;
  points: string[];
  code: string;
}

export interface BaseLesson {
  id: number;
  title: string;
  emoji: string;
  subtitle: string;
  modules: BaseLessonModule[];
}

export const BASE_LESSONS: BaseLesson[] = [
  {
    id: 1,
    title: "Base Fundamentals",
    emoji: "🔵",
    subtitle: "The core concepts of Ethereum's most popular L2",
    modules: [
      {
        title: "What is Base?",
        points: [
          "Base is an **Ethereum Layer 2 (L2)** solution incubated by **Coinbase**",
          "Built on the **OP Stack**, it inherits Ethereum's security while slashing fees",
          "Transactions on Base are typically **10x-100x cheaper** than Ethereum Mainnet",
          "✅ Focus: Bringing the next **billion users** onchain with a builder-first approach"
        ],
        code: '// Base Network Info\nChain ID: 8453\nNative Token: ETH\nTechnology: Optimistic Rollup\nStack: OP Stack'
      },
      {
        title: "Optimistic Rollups 101",
        points: [
          "Base 'rolls up' thousands of transactions into a single batch posted to Ethereum",
          "Uses **Optimistic** verification — transactions are assumed valid unless challenged",
          "The **Sequencer** is responsible for ordering and batching transactions",
          "✅ Challenge Period: 7 days to ensure fraud-proof security for L2 → L1 exits"
        ],
        code: '// L2 Scaling Flow\n1. Users transact on Base\n2. Sequencer batches TXs\n3. Data posted to L1 Ethereum\n4. L1 security is inherited'
      }
    ]
  },
  {
    id: 2,
    title: "Ecosystem & DApps",
    emoji: "🌐",
    subtitle: "Explore the thriving world of Basenames and apps",
    modules: [
      {
        title: "Native Ecosystem Tools",
        points: [
          "**Basenames**: Register human-readable names like `alice.base` for your wallet",
          "**Coinbase Wallet**: The primary gateway for seamless Base integration",
          "**Onchain Identity**: Your history on Base builds your verifiable reputation",
          "✅ Apps like **Aerodrome** and **Farcaster** form the backbone of the network"
        ],
        code: '// Resolving alice.base\nconst address = await resolve("alice.base");\n// "0x1234...abcd"'
      },
      {
        title: "Stablecoins & Social",
        points: [
          "**Native USDC**: Issued directly on Base by Circle (no bridging needed)",
          "**Social Apps**: Platforms like Friend.tech and Warpcast live here",
          "**Commerce**: Base is a global rail for sub-cent payments with USDC",
          "✅ Benefit: Faster confirmation times (seconds) compared to L1 (minutes)"
        ],
        code: '// Native USDC on Base\nconst USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";'
      }
    ]
  },
  {
    id: 3,
    title: "Smart Contracts",
    emoji: "📝",
    subtitle: "Developing decentralised logic on Base",
    modules: [
      {
        title: "Solidity & EVM",
        points: [
          "Base is **100% EVM-compatible** — your Solidity code works perfectly",
          "Deployment costs are **fractional** (pennies vs dollars on Mainnet)",
          "Compatible with all Major tools: **Foundry**, **Hardhat**, and **Remix**",
          "✅ Use **OpenZeppelin** for audited, secure contract standards"
        ],
        code: '// Write once, deploy anywhere\npragma solidity ^0.8.20;\n\ncontract BasedContract {\n  string public msg = "I love Base";\n}'
      }
    ]
  },
  {
    id: 4,
    title: "DeFi on Base",
    emoji: "💰",
    subtitle: "Unlocking financial freedom with protocol yields",
    modules: [
      {
        title: "Liquidity & Yield",
        points: [
          "**Aerodrome**: The #1 DEX and liquidity hub on Base chain",
          "**Lending**: Borrow against your assets using protocols like **Moonwell**",
          "**Yield Farming**: Earn rewards by providing liquidity to trading pairs",
          "✅ Goal: A permissionless financial system accessible to everyone"
        ],
        code: '// Constant Product Formula\nx * y = k\n\n// Swapping ETH for USDC\n// handled by Aerodrome AMM'
      }
    ]
  },
  {
    id: 5,
    title: "NFTs & Assets",
    emoji: "🎨",
    subtitle: "Digital ownership and the creator economy",
    modules: [
      {
        title: "Creating on Base",
        points: [
          "**Zora & OpenSea**: Major marketplaces supporting Base NFTs",
          "**Low Mint Costs**: Deploying collections costs virtually nothing",
          "**ERC-721 / ERC-1155**: The gold standards for digital collectibles",
          "✅ Onchain Art: Metadata stored on Base is permanent and verifiable"
        ],
        code: '// ERC-721 Metadata\n{\n  name: "My Based NFT",\n  image: "ipfs://...",\n  attributes: []\n}'
      }
    ]
  },
  {
    id: 6,
    title: "Wallets & Security",
    emoji: "🔐",
    subtitle: "Best practices for protecting your onchain future",
    modules: [
      {
        title: "Wallet Safety",
        points: [
          "**Private Keys**: Never share your seed phrase or private keys",
          "**Account Abstraction**: Smart wallets with social recovery (ERC-4337)",
          "**Permissions**: Regularly use `revoke.cash` to clean up token approvals",
          "✅ Hardware Wallets: The gold standard for securing high-value assets"
        ],
        code: '// Safety Checklist:\n1. Seed stored offline\n2. Enable 2FA\n3. Check URLs\n4. Limit approvals'
      }
    ]
  },
  {
    id: 7,
    title: "Identity & Social",
    emoji: "👤",
    subtitle: "The human element of the decentralized web",
    modules: [
      {
        title: "Social Protocols",
        points: [
          "**Farcaster**: The decentralized social network where builders hang out",
          "**Frames**: Interactive mini-apps directly inside social posts",
          "**Verifiable Identity**: Your activity is your decentralized resume",
          "✅ Connection: Social and financial identity merged into one"
        ],
        code: '// Farcaster FID\nconst myFID = 12345;\n// Verifiable onchain identity'
      }
    ]
  },
  {
    id: 8,
    title: "Bridging & Cross-Chain",
    emoji: "🌉",
    subtitle: "Moving value across the blockchain multiverse",
    modules: [
      {
        title: "The Superchain",
        points: [
          "**Base Bridge**: The official tunnel for moving ETH between L1 and L2",
          "**Superchain**: Interconnected L2s sharing security and stack (OP Stack)",
          "**Safety**: Always verify bridge URLs to avoid phishing scams",
          "✅ Interoperability: The goal is seamless transfers across all chains"
        ],
        code: '// L1 -> L2: Fast (~1-10 mins)\n// L2 -> L1: Standard (~7 days)'
      }
    ]
  },
  {
    id: 9,
    title: "Building on Base",
    emoji: "⚒️",
    subtitle: "Tools and SDKs for the modern developer",
    modules: [
      {
        title: "Developer Toolkit",
        points: [
          "**OnchainKit**: React components for building onchain apps fast",
          "**CDP SDK**: Coinbase's professional toolkit for enterprise apps",
          "**Basescan**: The essential explorer for debugging transactions",
          "✅ Deployment: Use **Base Sepolia** testnet before going live"
        ],
        code: 'npm install @coinbase/onchainkit\n// Build faster on Base'
      }
    ]
  },
  {
    id: 10,
    title: "Future & Advanced",
    emoji: "🚀",
    subtitle: "What's next for the Base ecosystem",
    modules: [
      {
        title: "Scalability & AI",
        points: [
          "**Blobs (EIP-4844)**: Massive fee reduction via data blobs",
          "**AI Agents**: Autonomous bots that trade and build onchain",
          "**Decentralization**: The road to a fully trustless sequencer",
          "✅ Vision: A global, open financial economy for everyone"
        ],
        code: '// Future Tech\nblobs: true,\nai_agents: true,\ndecentralization: "in progress"'
      }
    ]
  }
];
