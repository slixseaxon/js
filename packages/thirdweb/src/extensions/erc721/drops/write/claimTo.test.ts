import { type Abi, toFunctionSelector } from "viem";
import { describe, expect, it } from "vitest";
import { ANVIL_CHAIN } from "~test/chains.js";
import { TEST_CONTRACT_URI } from "~test/ipfs-uris.js";
import { TEST_CLIENT } from "~test/test-clients.js";
import { TEST_ACCOUNT_B } from "~test/test-wallets.js";
import { resolveContractAbi } from "../../../../contract/actions/resolve-abi.js";
import { getContract } from "../../../../contract/contract.js";
import { deployERC721Contract } from "../../../../extensions/prebuilts/deploy-erc721.js";
import { isClaimToSupported } from "./claimTo.js";

describe.runIf(process.env.TW_SECRET_KEY)("ERC721: claimTo", () => {
  it("isClaimToSupported should work", async () => {
    const contract = getContract({
      address: await deployERC721Contract({
        chain: ANVIL_CHAIN,
        client: TEST_CLIENT,
        type: "DropERC721",
        params: {
          name: "",
          contractURI: TEST_CONTRACT_URI,
        },
        account: TEST_ACCOUNT_B,
      }),
      chain: ANVIL_CHAIN,
      client: TEST_CLIENT,
    });

    const abi = await resolveContractAbi<Abi>(contract);
    const selectors = abi
      .filter((f) => f.type === "function")
      .map((f) => toFunctionSelector(f));
    expect(isClaimToSupported(selectors)).toBe(true);
  });
});
