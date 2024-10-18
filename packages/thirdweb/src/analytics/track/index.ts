import type { ThirdwebClient } from "../../client/client.js";
import { getClientFetch } from "../../utils/fetch.js";
import { stringify } from "../../utils/json.js";

const ANALYTICS_ENDPOINT = "https://c.thirdweb.com/event";

/**
 * @internal
 */
export function track(client: ThirdwebClient, data: object) {
  const fetch = getClientFetch(client);
  const event = {
    source: "sdk",
    ...data,
  };

  fetch(ANALYTICS_ENDPOINT, {
    method: "POST",
    body: stringify(event),
  }).catch(() => {});
}
