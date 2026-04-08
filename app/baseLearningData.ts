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
          "Base is an **Ethereum Layer 2 (L2)** blockchain built and incubated by **Coinbase**, the largest US-based crypto exchange",
          "It is built on the **OP Stack** — the same open-source modular framework that powers Optimism, making it part of the **Superchain**",
          "Gas fees on Base average **under $0.01**, compared to **$5–$50+** on Ethereum L1, making it ideal for everyday transactions",
          "Base has **no native token** — it uses **ETH** for gas fees just like Ethereum, so there's no separate token to buy",
          "✅ Mission: Bring the **next billion users onchain** by making Web3 accessible, affordable, and developer-friendly"
        ],
        code: '// Base Network Configuration\n{\n  chainId: 8453,\n  chainName: "Base",\n  nativeCurrency: {\n    name: "Ether",\n    symbol: "ETH",\n    decimals: 18\n  },\n  rpcUrls: ["https://mainnet.base.org"],\n  blockExplorerUrls: ["https://basescan.org"]\n}'
      },
      {
        title: "How Optimistic Rollups Work",
        points: [
          "A **rollup** bundles hundreds of transactions into a single batch and posts the compressed data to Ethereum L1",
          "**Optimistic** means transactions are assumed valid by default — no expensive computation needed to verify each one",
          "The **Sequencer** (run by Coinbase) collects, orders and submits transaction batches to Ethereum every few seconds",
          "A **7-day challenge window** allows anyone to submit a **fraud proof** if they detect an invalid transaction in a batch",
          "✅ This design gives Base both **Ethereum-level security** and **sub-cent transaction costs**"
        ],
        code: '// Transaction Lifecycle on Base\n\n// Step 1: User submits TX\n// → Goes to Base Sequencer\n\n// Step 2: Sequencer batches TXs\n// → Orders + compresses data\n\n// Step 3: Batch posted to L1\n// → Stored as calldata/blobs\n\n// Step 4: Challenge window (7 days)\n// → Anyone can submit fraud proof\n\n// Step 5: Finalized on Ethereum\n// → Immutable, permanent record'
      },
      {
        title: "The Superchain Network",
        points: [
          "Base is part of the **Superchain** — a network of interconnected L2 chains all built on the shared **OP Stack** framework",
          "Other Superchain members include **OP Mainnet** (Optimism), **Zora**, **Mode**, and **Worldchain**",
          "Base contributes **15% of sequencer revenue** back to the **Optimism Collective** to fund public goods development",
          "The long-term vision is **native cross-chain messaging** — seamlessly sending tokens and data between all Superchain L2s",
          "✅ Think of it like the internet: many connected networks, one shared infrastructure — that's the Superchain"
        ],
        code: '// Superchain Architecture\n\n// Shared Infrastructure:\n// ├── OP Stack (codebase)\n// ├── Ethereum L1 (security)\n// └── Cross-chain messaging\n\n// Member Chains:\n// ✅ Base       → Coinbase\n// ✅ OP Mainnet → Optimism\n// ✅ Zora       → NFT/Media\n// ✅ Mode       → DeFi\n// ✅ Worldchain → Identity\n\n// Revenue sharing:\n// Base → 15% to Optimism Collective'
      }
    ]
  },
  {
    id: 2,
    title: "Ecosystem & DApps",
    emoji: "🌐",
    subtitle: "Explore the thriving world of Base apps and services",
    modules: [
      {
        title: "Basenames & Onchain Identity",
        points: [
          "**Basenames** let you register a human-readable name like `alice.base` instead of sharing a long hex address",
          "Your Basename is an **onchain identity** — it works across dApps, wallets, and even social platforms like Farcaster",
          "Registration is cheap and lives entirely on Base, making it accessible to everyone globally",
          "Basenames support **profile records** — you can attach your avatar, bio, social links, and more to your name",
          "✅ Your Basename becomes your **digital identity card** that follows you across the entire Base ecosystem"
        ],
        code: '// Resolving a Basename\nconst address = await resolveBasename(\n  "alice.base"\n);\n// Returns: "0x1234...abcd"\n\n// Reverse lookup\nconst name = await lookupAddress(\n  "0x1234...abcd"\n);\n// Returns: "alice.base"\n\n// Display logic in your dApp:\nconst displayName = basename\n  || `${addr.slice(0, 6)}...${addr.slice(-4)}`;'
      },
      {
        title: "Native USDC on Base",
        points: [
          "**USDC** on Base is **natively issued** by Circle — it's real USDC, not a bridged or wrapped version",
          "Contract address: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` — always verify before interacting!",
          "USDC has **6 decimals** (not 18 like ETH), so 1 USDC = `1,000,000` units — a common source of bugs",
          "Sending USDC on Base costs fractions of a penny, making it perfect for **micropayments**, tipping, and commerce",
          "✅ Base is becoming a leading **payments rail** — instant, global, permissionless dollar transfers for under $0.01"
        ],
        code: '// USDC on Base — Key Details\nconst USDC_BASE = {\n  address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",\n  decimals: 6,  // NOT 18 like ETH!\n  symbol: "USDC",\n  name: "USD Coin"\n};\n\n// ⚠️ Common mistake:\n// 1 USDC = 1_000_000 (1e6)\n// NOT 1_000_000_000_000_000_000 (1e18)\n\n// Transfer example:\nawait usdc.transfer(recipient, 1_000_000);'
      },
      {
        title: "Key dApps & Social",
        points: [
          "**Farcaster** + **Warpcast** — the decentralized social network with the strongest Base community presence",
          "**Aerodrome** — the #1 DEX (decentralized exchange) on Base, processing billions in volume",
          "**Moonwell** — the leading lending protocol on Base for earning yield and borrowing crypto",
          "**friend.tech** — social token platform that pioneered the creator economy on Base",
          "✅ Explore dApps at **base.org/ecosystem** — 200+ projects spanning DeFi, social, gaming, and infrastructure"
        ],
        code: '// Top Base dApps by Category:\n\n// 💰 DeFi:\n//   Aerodrome, Moonwell, Morpho, Extra\n\n// 👤 Social:\n//   Farcaster, friend.tech, Degen\n\n// 🎨 NFT/Art:\n//   Zora, OpenSea, Highlight\n\n// 🎮 Gaming:\n//   Parallel, Onchain Dungeons\n\n// 🏗️ Infra:\n//   Basescan, Alchemy, Chainlink\n\n// Explore: base.org/ecosystem'
      }
    ]
  },
  {
    id: 3,
    title: "Smart Contracts",
    emoji: "📝",
    subtitle: "Write and deploy your first Base smart contract",
    modules: [
      {
        title: "Solidity & EVM Compatibility",
        points: [
          "Base is **100% EVM-compatible** — any Solidity or Vyper contract works identically on Base as on Ethereum Mainnet",
          "Deployment costs on Base are **100x cheaper** — deploying a token costs pennies vs $20–50 on L1",
          "Compatible with all major developer tools: **Foundry**, **Hardhat**, **Remix IDE**, and **Truffle**",
          "Use **OpenZeppelin** contracts for battle-tested, audited implementations of ERC-20, ERC-721, and more",
          "✅ The same Solidity version, libraries, and patterns you know from Ethereum work perfectly on Base"
        ],
        code: '// SPDX-License-Identifier: MIT\npragma solidity ^0.8.20;\n\ncontract HelloBase {\n    string public message;\n    address public owner;\n    uint256 public updateCount;\n\n    event MessageUpdated(\n        string newMessage,\n        address indexed by\n    );\n\n    constructor(string memory _msg) {\n        message = _msg;\n        owner = msg.sender;\n    }\n\n    function update(string memory _new)\n        external {\n        require(msg.sender == owner);\n        message = _new;\n        updateCount++;\n        emit MessageUpdated(_new, msg.sender);\n    }\n}'
      },
      {
        title: "Creating an ERC-20 Token",
        points: [
          "**ERC-20** is the universal standard for fungible tokens — USDC, DAI, and AERO all follow this standard",
          "Key functions: `transfer()`, `approve()`, `transferFrom()`, `balanceOf()`, and `totalSupply()`",
          "The **approve + transferFrom** pattern lets dApps spend tokens on your behalf (e.g., DEX swaps)",
          "Always use OpenZeppelin's `ERC20.sol` rather than writing from scratch — it's audited and battle-tested",
          "✅ Deploying your own ERC-20 token on Base costs roughly **$0.02** — experiment freely!"
        ],
        code: '// SPDX-License-Identifier: MIT\npragma solidity ^0.8.20;\n\nimport \"@openzeppelin/contracts/token/\n  ERC20/ERC20.sol\";\nimport \"@openzeppelin/contracts/access/\n  Ownable.sol\";\n\ncontract BaseToken is ERC20, Ownable {\n    constructor(uint256 initialSupply)\n        ERC20(\"Base Token\", \"BTKN\")\n        Ownable(msg.sender)\n    {\n        _mint(msg.sender, initialSupply * 1e18);\n    }\n\n    function mint(address to, uint256 amt)\n        external onlyOwner {\n        _mint(to, amt);\n    }\n}\n// Deploy cost: ~$0.02 on Base ✨'
      },
      {
        title: "Frontend Contract Interaction",
        points: [
          "Use **viem** (modern) or **ethers.js** (classic) to interact with contracts from your JavaScript frontend",
          "**Read operations** (balanceOf, totalSupply) are always **free** — they don't send transactions or use gas",
          "**Write operations** (transfer, approve) require the user to **sign a transaction** in their wallet",
          "Always use **TypeScript** and type your contract ABIs for safety and autocomplete in your IDE",
          "✅ Show users what they're signing — transparency builds trust in your dApp"
        ],
        code: 'import { createPublicClient, http } from \"viem\";\nimport { base } from \"viem/chains\";\n\n// Create client\nconst client = createPublicClient({\n  chain: base,\n  transport: http()\n});\n\n// Read (FREE — no gas):\nconst balance = await client.readContract({\n  address: \"0x...\",\n  abi: tokenABI,\n  functionName: \"balanceOf\",\n  args: [userAddress]\n});\n\n// Write (needs wallet + gas):\nconst hash = await walletClient\n  .writeContract({\n    address: \"0x...\",\n    abi: tokenABI,\n    functionName: \"transfer\",\n    args: [recipient, amount]\n  });'
      }
    ]
  },
  {
    id: 4,
    title: "DeFi on Base",
    emoji: "💰",
    subtitle: "Understand decentralized finance on Base",
    modules: [
      {
        title: "DEXs & Automated Market Makers",
        points: [
          "**Aerodrome** is the #1 DEX on Base — next-gen AMM with **$1B+** in TVL (Total Value Locked)",
          "AMMs use **liquidity pools** (token pairs) instead of traditional order books to enable trading",
          "The **constant product formula** (`x × y = k`) ensures tokens can always be traded at a fair price",
          "Liquidity providers earn **trading fees** + **token rewards** (AERO) for supplying assets to pools",
          "✅ On Base, swapping tokens costs **under $0.01** in gas — making DeFi accessible to everyone"
        ],
        code: '// How AMMs Work (Constant Product)\n\n// Pool: 100 ETH + 300,000 USDC\n// k = 100 × 300,000 = 30,000,000\n\n// Buying 1 ETH:\n// new_ETH = 99\n// new_USDC = 30,000,000 ÷ 99\n//          = 303,030.30\n// Cost = 303,030 - 300,000\n//      = 3,030.30 USDC\n\n// Key insight:\n// Price ↑ as supply ↓\n// Larger trades = more slippage\n\n// Aerodrome adds vote-escrowed\n// tokenomics (veAERO) for\n// improved capital efficiency ⚡'
      },
      {
        title: "Lending & Borrowing",
        points: [
          "**Moonwell** is the largest lending protocol on Base — supply assets to earn interest, or borrow against collateral",
          "When you **supply** ETH or USDC, borrowers pay you **interest** — this is displayed as **APY** (Annual Percentage Yield)",
          "**Borrowing** requires over-collateralisation: deposit $1000 of ETH to borrow ~$750 of USDC (75% LTV)",
          "If your collateral value drops below the **liquidation threshold**, your position gets automatically sold (liquidated)",
          "✅ Always check the **Health Factor** — keep it above 1.5 to stay safe from liquidation risk"
        ],
        code: '// DeFi Lending Flow on Moonwell:\n\n// 1. Alice deposits 10 ETH\n//    (collateral worth ~$30,000)\n\n// 2. She borrows 20,000 USDC\n//    (66% Loan-to-Value ratio)\n\n// 3. Interest accrues over time\n//    (Alice pays ~3% APY)\n\n// 4. If ETH drops 40%...\n//    Collateral = $18,000\n//    Debt = $20,000+\n//    ⚠️ LIQUIDATION TRIGGERED!\n\n// Key metrics to watch:\n// ✅ Supply APY (what you earn)\n// ✅ Borrow APY (what you pay)\n// ✅ Health Factor (> 1.5 = safe)'
      },
      {
        title: "Yield Farming & LP Strategies",
        points: [
          "**Yield farming** means putting your crypto to work in DeFi protocols to earn passive rewards",
          "**LP (Liquidity Provider)** tokens represent your share of a trading pool — hold them to earn trading fees",
          "**Impermanent Loss** is a risk when one token's price changes vs the other in your pair — learn about it before LPing",
          "Some protocols offer **boosted rewards** — lock your LP tokens for extra incentives (e.g., veAERO on Aerodrome)",
          "✅ Start small, understand risks, and never invest more than you can afford to lose"
        ],
        code: '// Yield Farming Strategy:\n\n// 1. Get ETH + USDC tokens\n// 2. Add liquidity on Aerodrome\n//    → Receive LP tokens\n// 3. Stake LP tokens for rewards\n//    → Earn AERO + trading fees\n\n// Math example:\n// $10,000 LP position\n// 25% APY from fees\n// 15% APY from AERO rewards\n// = ~$4,000/year passive income\n\n// ⚠️ Risks to consider:\n// - Impermanent loss\n// - Smart contract risk\n// - Token price volatility\n// - Protocol exploit risk'
      }
    ]
  },
  {
    id: 5,
    title: "NFTs & Digital Assets",
    emoji: "🎨",
    subtitle: "Create and collect digital art on Base",
    modules: [
      {
        title: "NFT Standards on Base",
        points: [
          "**ERC-721** — each token is unique with a distinct ID, used for 1/1 art, PFPs, and collectibles",
          "**ERC-1155** — multi-token standard that supports both fungible and non-fungible tokens in one contract",
          "**ERC-6551** — Token Bound Accounts (TBAs) allow NFTs to **own their own wallet** and hold assets",
          "Minting an NFT on Base costs **under $0.01** compared to **$20–100** on Ethereum L1",
          "✅ Base is the #1 chain for affordable NFT creation — perfect for creators, artists, and builders"
        ],
        code: '// ERC-721 NFT Contract:\npragma solidity ^0.8.20;\n\nimport \"@openzeppelin/contracts/token/\n  ERC721/ERC721.sol\";\nimport \"@openzeppelin/contracts/utils/\n  Counters.sol\";\n\ncontract BasedArt is ERC721 {\n    uint256 private _nextId;\n    string private _baseURI_;\n\n    constructor(string memory uri)\n        ERC721(\"Based Art\", \"BART\") {\n        _baseURI_ = uri;\n    }\n\n    function mint() external {\n        _safeMint(msg.sender, _nextId++);\n    }\n}\n// Mint cost: ~$0.005 on Base! 🔥'
      },
      {
        title: "Marketplaces & Minting Platforms",
        points: [
          "**Zora** — the leading platform for minting and collecting art directly on Base with minimal fees",
          "**OpenSea** — the world's largest NFT marketplace fully supports Base collections",
          "**Mint.fun** — a discovery tool for trending mints and new collections launching on Base",
          "**Highlight** — create generative art and edition drops with a no-code minting tool on Base",
          "✅ On-chain NFTs can store art **directly on the blockchain** — truly permanent, no IPFS dependency"
        ],
        code: '// NFT Metadata Standard:\nconst metadata = {\n  name: \"Based Art #42\",\n  description: \"My first Base NFT\",\n  image: \"ipfs://QmXyz123...\",\n  attributes: [\n    {\n      trait_type: \"Rarity\",\n      value: \"Legendary\"\n    },\n    {\n      trait_type: \"Background\",\n      value: \"Cosmic Blue\"\n    }\n  ],\n  external_url: \"https://myapp.com/nft/42\"\n};\n\n// Upload to IPFS → get CID\n// Set as tokenURI in contract'
      },
      {
        title: "Token-Gating & NFT Utility",
        points: [
          "**Token-gating** restricts access to content, communities, or features based on NFT ownership",
          "Common uses: exclusive Discord channels, premium content, event tickets, and loyalty programs",
          "Frontend check: `balanceOf(address) > 0` = the user owns the NFT, show exclusive content",
          "**Always verify ownership on-chain** — never trust frontend-only checks for security-critical features",
          "✅ Combine with **ERC-6551** to give NFTs their own on-chain identity and asset portfolio"
        ],
        code: '// Token-gating in your dApp:\n\nconst balance = await nftContract\n  .read.balanceOf([userAddress]);\n\nif (balance > 0n) {\n  // ✅ Show exclusive content\n  showPremiumDashboard();\n  unlockSpecialFeatures();\n} else {\n  // ❌ Show mint call-to-action\n  showMintButton();\n}\n\n// ⚠️ Server-side verification:\n// ALWAYS verify ownership onchain\n// in your API/backend too!\n// Never trust frontend-only checks'
      }
    ]
  },
  {
    id: 6,
    title: "Wallets & Security",
    emoji: "🔐",
    subtitle: "Best practices for protecting your onchain assets",
    modules: [
      {
        title: "Wallet Security Fundamentals",
        points: [
          "**NEVER** share your seed phrase (12/24 words) or private key with anyone — not support, not friends, nobody",
          "Use a **hardware wallet** (Ledger, Trezor) for any holdings over ~$500 — it keeps keys offline",
          "Create **separate wallets** for: daily use, DeFi, testing, and long-term storage (cold wallet)",
          "Enable **2FA** on all exchange and dApp accounts — prefer authenticator apps over SMS",
          "✅ Bookmark official URLs (`base.org`, `basescan.org`) — never click links from DMs, emails, or ads"
        ],
        code: '// Security Checklist:\n\n// ✅ Seed phrase stored OFFLINE\n//    (metal plate or paper in safe)\n\n// ✅ Hardware wallet for > $500\n//    (Ledger Nano X or Trezor)\n\n// ✅ Separate wallets:\n//    Hot wallet  → daily txns\n//    Warm wallet → DeFi\n//    Cold wallet → long-term hold\n\n// ✅ Verify URLs before connecting\n// ✅ Use revoke.cash monthly\n// ✅ Never sign blindly\n\n// ❌ NEVER share seed phrase\n// ❌ NEVER click DM links\n// ❌ NEVER use public WiFi for crypto'
      },
      {
        title: "Smart Contract Safety",
        points: [
          "Always **verify contracts on Basescan** before interacting — check if source code is published and audited",
          "Use `approve()` with **specific amounts** only — never give unlimited (`MAX_UINT256`) approval unless absolutely necessary",
          "Regularly review and **revoke old token approvals** at `revoke.cash` — stale approvals are a major attack vector",
          "Check for **security audits** from reputable firms: Trail of Bits, OpenZeppelin, Certora, Spearbit",
          "✅ **Permit2** (Uniswap's standard) is the safest approval method — uses signed messages instead of persistent approvals"
        ],
        code: '// Token Approval Best Practices:\n\n// ❌ BAD: Unlimited approval\nawait token.approve(\n  spender,\n  ethers.MaxUint256  // DANGEROUS!\n);\n\n// ✅ GOOD: Exact amount only\nawait token.approve(\n  spender,\n  parseUnits(\"100\", 6)  // 100 USDC\n);\n\n// ✅ BEST: Permit2 (signed message)\n// One-time signature per action\n// No persistent approval needed\n// Automatically expires\n\n// Monthly cleanup:\n// Visit revoke.cash\n// Revoke old approvals'
      },
      {
        title: "Avoiding Common Scams",
        points: [
          "**Phishing sites** clone real dApps pixel-perfectly — always check the URL before connecting your wallet",
          "**Rug pulls**: developers drain the liquidity pool after collecting investments — check if liquidity is locked",
          "**Fake airdrops**: \"Claim your free tokens\" links almost always contain wallet drainer contracts",
          "**Approval scams**: malicious dApps request unlimited token approval, then drain your wallet later",
          "✅ Golden rule: If it sounds **too good to be true**, it's a scam. Real projects never DM you first"
        ],
        code: `// 🚩 Red Flags Checklist:\n\n// 1. "Connect wallet to claim airdrop"\n//    → Almost always a drainer\n\n// 2. "Send 1 ETH, receive 2 back"\n//    → Classic scam, NEVER works\n\n// 3. "DM from support/admin"\n//    → No real project does this\n\n// 4. Token with 99% buy tax\n//    → Honeypot: buy but can't sell\n\n// 5. Unverified contract on Basescan\n//    → Hidden malicious code\n\n// ✅ Always verify on basescan.org\n// ✅ Check community on Farcaster\n// ✅ Start with small test amounts`
      }
    ]
  },
  {
    id: 7,
    title: "Identity & Social",
    emoji: "👤",
    subtitle: "Build your onchain reputation and social presence",
    modules: [
      {
        title: "Farcaster & Decentralized Social",
        points: [
          "**Farcaster** is the leading decentralized social protocol, hugely popular in the Base community",
          "**Warpcast** is the most popular Farcaster client — think of it as \"Twitter but onchain and decentralized\"",
          "Your **FID** (Farcaster ID) is a unique onchain number that represents your verified social identity",
          "All your posts (\"casts\") are stored in a decentralized network — no single company controls your data",
          "✅ Farcaster is where Base builders, developers, and community members connect — it's the town square of Web3"
        ],
        code: '// Farcaster Key Concepts:\n\n// FID (Farcaster ID)\nconst myFID = 12345;\n// Unique, onchain, permanent\n\n// Cast (post)\nconst cast = {\n  text: \"Building on Base! 🔵\",\n  author: { fid: 12345 },\n  timestamp: Date.now(),\n  channel: \"/base\"\n};\n\n// Channels = topic communities\n// /base, /dev, /design, /art\n\n// Clients:\n// Warpcast (main)\n// Supercast (power users)\n// Farcord (Discord-like)'
      },
      {
        title: "Frames — Interactive Mini-Apps",
        points: [
          "**Frames** are interactive mini-applications embedded directly inside Farcaster posts (casts)",
          "Users can **click buttons**, view images, and perform actions **without leaving** their Farcaster feed",
          "Frames can trigger onchain actions: minting NFTs, swapping tokens, voting in DAOs — all in-feed",
          "Built with simple **HTML meta tags** — any web developer can create Frames with basic knowledge",
          "✅ Frames are like **App Clips** for Web3 — lightweight, instant, and incredibly engaging"
        ],
        code: '// Farcaster Frame (HTML meta tags):\n\n<meta property=\"fc:frame\"\n  content=\"vNext\" />\n\n<meta property=\"fc:frame:image\"\n  content=\"https://app.com/img.png\" />\n\n<meta property=\"fc:frame:button:1\"\n  content=\"Mint NFT\" />\n\n<meta property=\"fc:frame:button:2\"\n  content=\"Learn More\" />\n\n<meta property=\"fc:frame:post_url\"\n  content=\"https://app.com/api/action\" />\n\n// Users see image + buttons\n// Click → action happens\n// No app download needed!'
      },
      {
        title: "Attestations & Onchain Reputation",
        points: [
          "**EAS** (Ethereum Attestation Service) creates verifiable onchain proofs — \"this person completed X\"",
          "Attestations are like **digital certificates** that can never be faked or deleted from the blockchain",
          "Use cases: course completion, KYC verification, skill badges, event attendance, peer endorsements",
          "**Soulbound Tokens** (SBTs) are non-transferable NFTs used as permanent credentials tied to your wallet",
          "✅ Over time, your onchain attestations become your **decentralized resume** — portable and verifiable"
        ],
        code: '// Creating an attestation with EAS:\n\nconst attestation = await eas.attest({\n  schema: SCHEMA_UID,\n  data: {\n    recipient: userAddress,\n    expirationTime: 0n, // permanent\n    revocable: true,\n    data: encodeData({\n      course: \"Base Builder Bootcamp\",\n      score: 95,\n      completedAt: Date.now(),\n      issuer: \"Jazzmini Academy\"\n    })\n  }\n});\n\n// This attestation lives onchain\n// forever — verifiable by anyone ✨'
      }
    ]
  },
  {
    id: 8,
    title: "Bridging & Cross-Chain",
    emoji: "🌉",
    subtitle: "Moving assets safely between blockchains",
    modules: [
      {
        title: "Bridging to Base",
        points: [
          "**Bridging** is the process of moving tokens from one blockchain to another (e.g., Ethereum L1 → Base L2)",
          "The official **Base Bridge** (`bridge.base.org`) is the safest way to move ETH between Ethereum and Base",
          "**L1 → L2 deposits** are fast: your ETH arrives on Base within **1–10 minutes** after confirmation",
          "**L2 → L1 withdrawals** take **7 days** due to the optimistic rollup challenge period — plan ahead!",
          "✅ **Always use the official bridge** — never trust random bridge links shared in DMs or social media"
        ],
        code: '// Bridging Flow:\n\n// ─── L1 → L2 (Deposit) ───\n// 1. Go to bridge.base.org\n// 2. Connect wallet on Ethereum\n// 3. Enter ETH amount\n// 4. Confirm transaction\n// 5. Wait 1-10 minutes\n// ✅ ETH arrives on Base!\n\n// ─── L2 → L1 (Withdrawal) ───\n// 1. Initiate withdrawal on Base\n// 2. Wait 7 days (challenge period)\n// 3. Prove withdrawal on L1\n// 4. Claim ETH on Ethereum\n// ⏱️ Total: ~7 days\n\n// Alternative: Use third-party\n// bridges for faster withdrawals\n// (Across, Hop, Stargate)'
      },
      {
        title: "Third-Party Bridges & Fast Exits",
        points: [
          "**Across Protocol** — fast bridge with 1-3 minute transfers between chains, powered by liquidity pools",
          "**Stargate** — LayerZero-powered bridge supporting multiple chains and token types",
          "**Hop Protocol** — specializes in bridging between L2s (Base ↔ Optimism ↔ Arbitrum)",
          "Third-party bridges are faster but carry **additional smart contract risk** — verify and audit before using",
          "✅ For large amounts, always use the **official Base Bridge** — for small/fast transfers, third-party options are convenient"
        ],
        code: '// Bridge Comparison:\n\n// Official Base Bridge:\n// ✅ Most secure\n// ⏱️ L1→L2: ~10 min\n// ⏱️ L2→L1: ~7 days\n// 💰 Gas only (no extra fee)\n\n// Across Protocol:\n// ✅ Very fast (1-3 min)\n// ✅ Multi-chain support\n// 💰 Small relay fee (~0.1%)\n\n// Stargate (LayerZero):\n// ✅ Many chains supported\n// ✅ Native asset transfers\n// 💰 Bridge fee varies\n\n// Hop Protocol:\n// ✅ L2 ↔ L2 specialist\n// ✅ Decentralized bonders\n// 💰 Variable fee'
      },
      {
        title: "Superchain Interoperability",
        points: [
          "The **Superchain** vision is a world where all OP Stack L2s can communicate natively — no bridges needed",
          "**Cross-chain messaging** will let contracts on Base call contracts on OP Mainnet (and vice versa) directly",
          "This means seamlessly moving tokens, NFTs, and data between Base, Optimism, Zora, and other OP Stack chains",
          "Currently being developed by the **Optimism Collective** as part of the shared Superchain roadmap",
          "✅ The future: one wallet, one identity, assets flowing freely across all Superchain networks"
        ],
        code: '// Superchain Vision:\n\n// Today (separate bridges):\n// Base ←bridge→ Ethereum\n// Base ←bridge→ Optimism\n// Base ←bridge→ Zora\n\n// Future (native messaging):\n// Base ←→ Optimism (instant)\n// Base ←→ Zora (instant)\n// Base ←→ Mode (instant)\n// All through shared OP Stack!\n\n// Impact:\n// ✅ No bridge fees between L2s\n// ✅ Instant cross-chain txns\n// ✅ Unified liquidity\n// ✅ One identity everywhere\n// ✅ True chain abstraction'
      }
    ]
  },
  {
    id: 9,
    title: "Building on Base",
    emoji: "⚒️",
    subtitle: "Developer tools and SDKs for shipping dApps",
    modules: [
      {
        title: "OnchainKit — Build Fast",
        points: [
          "**OnchainKit** is Coinbase's official React component library for building on Base — it handles the hard parts",
          "Pre-built components: `<ConnectWallet>`, `<FundButton>`, `<SwapWidget>`, `<NFTMintButton>`, and more",
          "Handles wallet connection, identity resolution, transaction management, and onramps out of the box",
          "Works with **Next.js** and **Vite** — drop components in and start building immediately",
          "✅ Go from zero to a working dApp in **under 30 minutes** with OnchainKit"
        ],
        code: '// OnchainKit Quick Start:\n\nnpm install @coinbase/onchainkit\n\n// In your React app:\nimport {\n  ConnectWallet,\n  FundButton,\n  Identity\n} from \"@coinbase/onchainkit\";\n\nfunction App() {\n  return (\n    <OnchainKitProvider\n      chain={base}\n      apiKey={COINBASE_API_KEY}\n    >\n      <ConnectWallet />\n      <Identity address={user} />\n      <FundButton />\n    </OnchainKitProvider>\n  );\n}'
      },
      {
        title: "CDP SDK & Basescan",
        points: [
          "**CDP** (Coinbase Developer Platform) provides APIs for wallets, transactions, staking, and data",
          "**Basescan** (`basescan.org`) is the block explorer for Base — essential for debugging transactions and contracts",
          "Use Basescan to: verify contracts, check transaction status, view event logs, and inspect token transfers",
          "**RPC Providers**: Use Alchemy, Infura, or QuickNode for reliable, rate-limited access to Base nodes",
          "✅ Always **verify your contracts** on Basescan — publishing source code builds community trust"
        ],
        code: '// Deploying & Verifying on Base:\n\n// 1. Deploy with Foundry:\nforge create src/MyContract.sol \\\n  --rpc-url https://mainnet.base.org \\\n  --private-key $KEY\n\n// 2. Verify on Basescan:\nforge verify-contract \\\n  <CONTRACT_ADDRESS> \\\n  src/MyContract.sol:MyContract \\\n  --chain base \\\n  --etherscan-api-key $BASESCAN_KEY\n\n// 3. Check on Basescan:\n// basescan.org/address/0x...\n// ✅ Source code visible\n// ✅ ABI auto-generated\n// ✅ Community can audit'
      },
      {
        title: "Testing on Base Sepolia",
        points: [
          "**Base Sepolia** is the free testnet for developers — it mirrors mainnet behavior without real money",
          "Chain ID: `84532` — RPC: `https://sepolia.base.org` — Explorer: `sepolia.basescan.org`",
          "Get free testnet ETH from the **Coinbase Faucet** or **Alchemy Faucet** — no payment needed",
          "**Always test thoroughly on Sepolia** before deploying to mainnet — fix bugs when they're free to fix",
          "✅ Pro tip: Set up automated tests with **Foundry's `forge test`** for comprehensive contract coverage"
        ],
        code: '// Base Sepolia Configuration:\n\nconst baseSepolia = {\n  chainId: 84532,\n  name: \"Base Sepolia\",\n  rpcUrl: \"https://sepolia.base.org\",\n  explorer: \"https://sepolia.basescan.org\",\n  faucet: \"https://www.coinbase.com/\n    faucets/base-ethereum-goerli-faucet\"\n};\n\n// Testing with Foundry:\nforge test              // Run all tests\nforge test -vvv         // Verbose output\nforge test --gas-report // Gas analysis\n\n// Deploy to testnet first:\nforge script Deploy.s.sol \\\n  --rpc-url $BASE_SEPOLIA_RPC \\\n  --broadcast'
      }
    ]
  },
  {
    id: 10,
    title: "Future & Advanced Topics",
    emoji: "🚀",
    subtitle: "Where Base is headed and how to be part of it",
    modules: [
      {
        title: "Scaling with Blobs (EIP-4844)",
        points: [
          "**EIP-4844** introduced \"blobs\" — a new, cheaper way for L2s to post data to Ethereum L1",
          "Before blobs, L2 data was posted as expensive **calldata** — blobs reduced costs by **10x or more**",
          "This is why Base gas fees dropped from ~$0.10 to **under $0.001** in early 2024",
          "**Full Danksharding** (the next upgrade) will make blob space even cheaper — potentially 100x more capacity",
          "✅ The trend is clear: L2 fees are heading toward **near-zero**, making onchain activity free for everyday users"
        ],
        code: '// Fee Reduction Timeline:\n\n// 2023: Calldata era\n//   Avg Base tx: ~$0.10-0.50\n//   Data posted as calldata\n\n// 2024: EIP-4844 (Blobs)\n//   Avg Base tx: ~$0.001-0.01\n//   10x cheaper data posting\n\n// 2025+: Full Danksharding\n//   Avg Base tx: ~$0.0001?\n//   100x more blob capacity\n\n// Base Growth Impact:\n// Lower fees → More users\n// More users → More builders\n// More builders → Better apps\n// Better apps → Even more users\n// 🔄 Flywheel effect!'
      },
      {
        title: "AI Agents on Base",
        points: [
          "**AI Agents** are autonomous programs that can hold wallets, make decisions, and transact on Base independently",
          "**CDP AgentKit** from Coinbase gives developers tools to create AI agents with their own onchain wallets",
          "Use cases: automatic portfolio rebalancing, smart DCA (Dollar Cost Averaging), social trading, DAO governance",
          "Agents can be **verified onchain** — their identity, capabilities, and track record are publicly auditable",
          "✅ The intersection of **AI + crypto** is one of the fastest-growing areas — Base is positioning at the center of it"
        ],
        code: '// AI Agent with CDP AgentKit:\n\nimport { CdpAgentkit } from\n  \"@coinbase/cdp-agentkit-core\";\n\nconst agent = await CdpAgentkit\n  .configure({\n    networkId: \"base-mainnet\"\n  });\n\n// Agent capabilities:\n// ✅ Create wallets\n// ✅ Send transactions\n// ✅ Deploy contracts\n// ✅ Swap on DEXs\n// ✅ Manage NFTs\n\n// Example: Auto-DCA agent\nif (price < targetPrice) {\n  await agent.swap(USDC, ETH, amount);\n  console.log(\"Bought ETH at\", price);\n}'
      },
      {
        title: "Getting Started & Community",
        points: [
          "Join the **Base Discord** (`discord.gg/buildonbase`) and follow **@base** on X and Farcaster",
          "Apply for **Base grants** and **retroactive funding** programs — they actively fund builders",
          "Explore the curriculum at **base.org/camp** — Coinbase's official builder bootcamp",
          "Build with **OnchainKit**, deploy on **Base Sepolia**, and launch your first dApp on mainnet",
          "✅ You're **early** — building on Base now puts you years ahead of mass adoption. Start today! 🔵"
        ],
        code: '// Your Base Builder Roadmap:\n\n// Week 1-2: Learn Fundamentals\n//   Solidity, EVM, Remix IDE\n\n// Week 3-4: Build & Test\n//   Deploy on Base Sepolia\n//   Test with Foundry/Hardhat\n\n// Week 5-6: Frontend\n//   viem/wagmi + OnchainKit\n//   Connect wallet, read/write\n\n// Week 7-8: Ship to Mainnet\n//   Deploy, verify on Basescan\n//   Share on Farcaster!\n\n// Resources:\n// 📖 docs.base.org\n// 🎓 base.org/camp\n// 💬 discord.gg/buildonbase\n// 🐦 @base on X & Farcaster'
      }
    ]
  }
];
