import { createConfig, http } from "wagmi";
import { base, hardhat } from "wagmi/chains";
import { injected } from "wagmi/connectors";
import { Attribution } from "ox/erc8021";

// Get your Builder Code from base.dev > Settings > Builder Codes
export const DATA_SUFFIX = Attribution.toDataSuffix({
  codes: ["bc_92dq8ffn"],
});

export const config = createConfig({
  chains: [base, hardhat],
  connectors: [injected()],
  transports: {
    [base.id]: http(),
    [hardhat.id]: http(),
  },
  // @ts-ignore - dataSuffix is not in wagmi types but supported by the runtime
  dataSuffix: DATA_SUFFIX,
});
