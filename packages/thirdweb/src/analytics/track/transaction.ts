import type { ThirdwebClient } from "../../client/client.js";
import { stringify } from "../../utils/json.js";
import type { WalletId } from "../../wallets/wallet-types.js";
import { track } from "./index.js";

type TransactionEvent = {
  client: ThirdwebClient;
  transactionHash?: string;
  walletAddress?: string;
  walletType?: WalletId;
  chainId?: number;
  contractAddress?: string;
  functionName?: string;
  gasPrice?: bigint;
  error?: {
    message: string;
    code: string;
  };
};

type TransactionSuccessEvent = TransactionEvent & {
  error?: undefined;
};

/**
 * @internal
 */
export function trackTransaction(args: TransactionSuccessEvent) {
  trackTransactionEvent({
    ...args,
    event: "transaction:success",
  });
}

type TransactionFailureEvent = TransactionEvent & {
  error: {
    message: string;
    code: string;
  };
};

/**
 * @internal
 */
export function trackTransactionError(args: TransactionFailureEvent) {
  trackTransactionEvent({
    ...args,
    event: "transaction:error",
  });
}

/**
 * @internal
 */
function trackTransactionEvent(
  args: TransactionEvent & {
    event: "transaction:success" | "transaction:error";
  },
) {
  track(args.client, {
    action: args.event,
    clientId: args.client.clientId,
    chainId: args.chainId,
    transactionHash: args.transactionHash,
    walletAddress: args.walletAddress,
    walletType: args.walletType,
    contractAddress: args.contractAddress,
    functionName: args.functionName,
    gasPrice: args.gasPrice,
    errorCode: stringify(args.error),
  });
}
