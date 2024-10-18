import type { ThirdwebClient } from "../../client/client.js";
import { track } from "./index.js";

/**
 * @internal
 */
export function trackConnect(args: {
  client: ThirdwebClient;
  walletType: string;
  walletAddress: string;
}) {
  const { client, walletType, walletAddress } = args;
  track(client, {
    source: "connectWallet",
    action: "connect",
    walletType,
    walletAddress,
  });
}
