# Wallet Integration Quick Reference

## Supported Wallets

| Wallet | Detection Flag | Auto-Detected |
|--------|---|---|
| MetaMask | `ethereum.isMetaMask` | ✅ Yes |
| Coinbase Wallet | `ethereum.isCoinbaseBrowser` | ✅ Yes |
| Base App | `ethereum.isBase` | ✅ Yes |
| Farcaster | SDK integration | ✅ Yes (via Farcaster SDK) |
| Other EIP-1193 Compatible | Generic request method | ✅ Yes (as "Browser Wallet") |

## Connection Flow

1. **App Mount** - Automatically detects available wallets
2. **User Clicks Connect** - Triggers `eth_requestAccounts` RPC call
3. **Wallet Confirmation** - User approves connection in wallet UI
4. **Address Stored** - Connected address displayed in UI
5. **Transaction Ready** - User can now complete levels and send transactions

## Transaction Flow

1. **Level Completed** - User passes quiz (score ≥ 7/10)
2. **Send Transaction** - User clicks "Send Transaction" button
3. **Wallet Approval** - MetaMask/wallet prompts user to confirm
4. **Transaction Hash** - On approval, transaction sent to Base contract
5. **Status Update** - UI shows transaction hash and BaseScan link
6. **Next Level** - User can proceed to next level after success

## Error Codes & Meanings

| Code | Meaning | User Message |
|------|---------|--------------|
| 4001 | User rejected | "Transaction rejected by user" |
| -32002 | Pending request | "Connection request already pending" |
| N/A | No funds | "Insufficient ETH for gas fees" |
| N/A | No wallet | "No Web3 wallet detected" |

## Contract Details

```
Network: Base Mainnet (0x2105)
Contract: 0x2315d55F06E19D21Ebda68Aa1E54F9aF6924dcE5
Function: completeLevel(uint256 level)
Gas Limit: 150,000
```

## Environment Setup

### For Development

```bash
# 1. Install MetaMask extension
# 2. Create/import a wallet
# 3. Switch to Base Mainnet
# 4. Use a faucet to get test funds if needed
# 5. npm run dev
# 6. Visit http://localhost:3000
```

### For Production

1. Ensure contract is deployed on Base Mainnet
2. Set correct `QUIZ_CONTRACT_ADDRESS` in Jazzmini.tsx
3. Update image URLs (og-pro.png, splash-pro.png, icon-pro.png)
4. Set Firebase credentials in `.env.local`
5. Deploy to production

## Testing Wallet Connections

### MetaMask
```javascript
// Check in browser console
window.ethereum.isMetaMask // true if installed
window.ethereum.request({ method: 'eth_accounts' })
```

### Coinbase Wallet
```javascript
window.ethereum.isCoinbaseBrowser // true if installed
```

### Testing Locally
```bash
npm run dev
# Visit http://localhost:3000
# Open Developer Tools > Console
# Should see "Running outside Farcaster environment" if not in Farcaster
```

## Security Considerations

### What We Validate
- ✅ Contract address format (0x + 40 hex chars)
- ✅ Level parameter (1-10 only)
- ✅ Chain ID (Base Mainnet/Sepolia only)
- ✅ Wallet provider existence and functionality
- ✅ Account availability after connection

### What We Don't Store
- ❌ Private keys (stored in wallet only)
- ❌ Seed phrases (stored in wallet only)
- ❌ Passwords (not needed)

### Gas Optimization
- Single contract call per level
- Fixed 150k gas limit (no overpayment)
- Transactions are write-only (no state reads)

## Troubleshooting

### "No Web3 wallet detected"
- Install MetaMask or compatible wallet
- Refresh the page
- Check that wallet extension is enabled

### "Insufficient ETH for gas fees"
- Add more ETH to your wallet
- Check you're on Base Mainnet (not testnet)
- Ensure gas price isn't extremely high

### Transaction shows "Null: 0x0..."
- This is normal for custom contracts in MetaMask
- Contract address in tx params is correct
- Safe to approve the transaction

### Wallet connection pending
- Check wallet extension (may be showing approval dialog)
- Reject and try again if needed
- Make sure only one connection request is active

## API Reference

### Wallet Detection
```typescript
const provider = getWalletProvider(); // Get EthereumProvider
const wallets = getAvailableWallets(); // Get ["MetaMask", "Coinbase Wallet", ...]
```

### Address Validation
```typescript
const valid = isValidAddress("0x2315d55F06E19D21Ebda68Aa1E54F9aF6924dcE5");
```

### Function Encoding
```typescript
const encoded = encodeFunctionCall('completeLevel', [3]);
// Returns: "0x3ccfd60b0000000000000000000000000000000000000000000000000000000000000003"
```

## Links

- [Base Network RPC Endpoints](https://docs.base.org/network-information)
- [BaseScan Block Explorer](https://basescan.org)
- [MetaMask Setup Guide](https://support.metamask.io/en)
- [Coinbase Wallet Docs](https://www.coinbase.com/wallet/docs)
- [Farcaster Miniapps](https://docs.farcaster.xyz/developers/frames/guides/miniapps)
