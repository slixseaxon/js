import type { ThirdwebClient } from "../../client/client.js";
import { stringify } from "../../utils/json.js";
import { track } from "./index.js";

type SiweEvent = {
  client: ThirdwebClient;
  walletAddress?: string;
  walletType?: string;
  chainId?: number;
  error?: {
    message: string;
    code: string;
  };
};

type SiweSuccessEvent = SiweEvent & {
  error?: undefined;
};

/**
 * @internal
 */
export function trackLogin(event: SiweSuccessEvent) {
  trackSiweEvent({
    ...event,
    type: "login:success",
  });
}

type SiweErrorEvent = SiweEvent & {
  error: {
    message: string;
    code: string;
  };
};

/**
 * @internal
 */
export function trackLoginError(event: SiweErrorEvent) {
  trackSiweEvent({
    ...event,
    type: "login:error",
  });
}

/**
 * @internal
 */
function trackSiweEvent(
  event: SiweEvent & {
    type: "login:success" | "login:error";
  },
) {
  track(event.client, {
    action: event.type,
    clientId: event.client.clientId,
    chainId: event.chainId,
    walletAddress: event.walletAddress,
    walletType: event.walletType,
    errorCode: stringify(event.error),
  });
}
