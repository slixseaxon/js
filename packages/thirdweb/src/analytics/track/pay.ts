import type { ThirdwebClient } from "../../client/client.js";
import { track } from "./index.js";

/**
 * @internal
 */
export function trackPayEvent(args: {
  client: ThirdwebClient;
  event: string;
  walletAddress?: string;
  walletType?: string;
  fromToken?: string;
  fromAmount?: string;
  toToken?: string;
  toAmount?: string;
  chainId?: number;
  dstChainId?: number;
}) {
  track(args.client, {
    source: "pay",
    action: args.event,
    clientId: args.client.clientId,
    chainId: args.chainId,
    walletAddress: args.walletAddress,
    walletType: args.walletType,
    tokenAddress: args.fromToken,
    amountWei: args.fromAmount,
    dstTokenAddress: args.toToken,
    dstChainId: args.chainId,
  });
}
