import { writeFile } from "node:fs/promises";
import { mkdir, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { format } from "prettier";
import sharp from "sharp";

const walletConnectWallets = await fetch(
  "https://explorer-api.walletconnect.com/w3m/v1/getAllListings?projectId=145769e410f16970a79ff77b2d89a1e0",
).then(async (res) => {
  const wallets: { listings: Record<string, Wallet> } = await res.json();

  // Remove duplicated wallets by wallet RDNS
  const filteredWallets: Wallet[] = [];
  for (const _w of Object.values(wallets.listings)) {
    if (_w.rdns && filteredWallets.find((w) => w.rdns === _w.rdns)) {
      continue;
    }
    filteredWallets.push(_w);
  }

  return filteredWallets;
});

const extraWalletsJson = JSON.parse(
  await readFile(join(__dirname, "./extra-wallets.json"), "utf-8"),
);

const deepLinkSupportedWalletsRecord: Record<
  string,
  {
    mobile: string;
  }
> = {
  "io.metamask": {
    mobile: "https://metamask.app.link/dapp/",
  },
};

type Wallet = {
  id: string;
  name: string;
  homepage: string;
  image_id: string;
  order: number;
  app: {
    browser: string | null;
    ios: string | null;
    android: string | null;
    mac: string | null;
    windows: string | null;
    linux: string | null;
    chrome: string | null;
    firefox: string | null;
    safari: string | null;
    edge: string | null;
    opera: string | null;
  };
  injected: Array<{
    injected_id: string;
    namespace: string;
  }> | null;
  rdns: string | null;
  mobile: {
    native: string | null;
    universal: string | null;
  };
  desktop: {
    native: string | null;
    universal: string | null;
  };
  _type: "wc" | "extra";
  deepLink?: {
    mobile: string;
  };
};

const allWalletsArray = Object.values(walletConnectWallets)
  .map((w) => ({ ...(w as Omit<Wallet, "type">), _type: "wc" }))
  .concat(
    extraWalletsJson.map((w: Wallet) => ({
      ...(w as Omit<Wallet, "type">),
      _type: "extra",
    })),
  ) as Wallet[];

function rdns(wallet: Wallet) {
  // prefer the rdns if it exists
  if (wallet.rdns) {
    return wallet.rdns;
  }
  // otherwise compute it from the homepage
  return new URL(wallet.homepage).hostname
    .split(".")
    .filter((s) => s !== "www")
    .reverse()
    .join(".");
}

const allWalletsWithIds = allWalletsArray.map((wallet) => {
  // biome-ignore lint/performance/noDelete: aware it's bad but it's OK in generate script
  // biome-ignore lint/suspicious/noExplicitAny: aware it's bad but it's OK in generate script
  delete (wallet as any).order;
  // biome-ignore lint/performance/noDelete: aware it's bad but it's OK in generate script
  // biome-ignore lint/suspicious/noExplicitAny: aware it's bad but it's OK in generate script
  delete (wallet as any).injected;

  const id = rdns(wallet);

  if (id && id in deepLinkSupportedWalletsRecord) {
    wallet.deepLink = {
      mobile: deepLinkSupportedWalletsRecord[id].mobile,
    };
  }

  return { ...wallet, id: id };
});

// filter duplicate ids, we'll keep the first ones

// generate walletInfos

const walletConnectSupportedWallets = allWalletsWithIds.filter((w) => {
  // TODO bring back desktop wallets once supported
  return w.mobile.universal || w.mobile.native;
});

const injectedSupportedWallets = allWalletsWithIds.filter((w) => {
  return !!(w.rdns || w.injected);
});

const deepLinkSupportedWallets = allWalletsWithIds.filter((w) => {
  return !!w.deepLink;
});

const allSupportedWallets = walletConnectSupportedWallets
  .concat(injectedSupportedWallets)
  .filter(
    (wallet, index, self) =>
      index === self.findIndex((t) => t.id === wallet.id),
  );

const walletInfos = allSupportedWallets.map((wallet) => {
  return {
    id: wallet.id,
    name: wallet.name,
    hasMobileSupport: !!wallet.mobile.universal || !!wallet.mobile.native,
  };
});

const customWalletInfos = [
  {
    id: "smart",
    name: "Smart Wallet",
    hasMobileSupport: true,
  },
  {
    id: "inApp",
    name: "In-App Wallet",
    hasMobileSupport: true,
  },
  {
    id: "embedded",
    name: "In-App Wallet",
    hasMobileSupport: true,
  },
  {
    id: "walletConnect",
    name: "WalletConnect",
    hasMobileSupport: false,
  },
];

// clean the __geneated__ folder within `src/wallets/` directory
const OUT_PATH = join(__dirname, "../../src/wallets/__generated__");

await rm(OUT_PATH, { recursive: true });
await mkdir(OUT_PATH, { recursive: true });

// generate a typescript file with all the wallet ids

await writeFile(
  join(OUT_PATH, "wallet-ids.ts"),
  await format(
    `// This file is auto-generated by the \`scripts/wallets/generate.ts\` script.
// Do not modify this file manually.

// ${walletConnectSupportedWallets.length} wallets
export type WCSupportedWalletIds = ${walletConnectSupportedWallets
      .map((w) => {
        return `"${w.id}"`;
      })
      .join(" | ")};

// ${injectedSupportedWallets.length} wallets
export type InjectedSupportedWalletIds = ${injectedSupportedWallets
      .map((w) => {
        return `"${w.id}"`;
      })
      .join(" | ")};

export type DeepLinkSupportedWalletIds = ${deepLinkSupportedWallets
      .map((w) => {
        return `"${w.id}"`;
      })
      .join(" | ")};
`,
    {
      parser: "babel-ts",
    },
  ),
);

// write wallet infos to a typescript file
await writeFile(
  join(OUT_PATH, "wallet-infos.ts"),
  await format(
    `// This file is auto-generated by the \`scripts/wallets/generate.ts\` script.
// Do not modify this file manually.

/**
 * @internal
 */
export type MinimalWalletInfo = {
  id: string;
  name: string;
  hasMobileSupport: boolean;
};

/**
 * @internal
 */
const ALL_MINIMAL_WALLET_INFOS = <const>${JSON.stringify(
      [...walletInfos, ...customWalletInfos],
      null,
      2,
    )} satisfies MinimalWalletInfo[];

export default ALL_MINIMAL_WALLET_INFOS;
`,
    {
      parser: "babel-ts",
    },
  ),
);
function stripType(wallet: Wallet) {
  const copy = { ...wallet };
  // biome-ignore lint/performance/noDelete: aware it's bad but it's OK in generate script
  // biome-ignore lint/suspicious/noExplicitAny: aware it's bad but it's OK in generate script
  delete (copy as any)._type;
  return copy;
}

// for each wallet, generate a folder within the `src/wallets/__generated__` directory
// and write a `index.ts` file with the wallet's information
// biome-ignore lint/suspicious/noExplicitAny: is ok in this script
const p: Promise<any>[] = [];
for (const wallet of allSupportedWallets) {
  p.push(
    (async () => {
      const walletDir = join(OUT_PATH, "wallet", wallet.id);
      await mkdir(walletDir, { recursive: true });
      await writeFile(
        join(walletDir, "index.ts"),
        await format(
          `// This file is auto-generated by the \`scripts/wallets/generate.ts\` script.
// Do not modify this file manually.

export const wallet = ${JSON.stringify(stripType(wallet), null, 2)} as const;
`,
          {
            parser: "babel-ts",
          },
        ),
      );

      // download the wallet's image
      let resized: Buffer;
      if (wallet._type === "extra") {
        // directly fetch, this will be a URL always

        resized = await sharp(
          await readFile(
            join(__dirname, `./extra-wallet-icons/${wallet.image_id}`),
          ),
        )
          .resize(128, 128)
          .webp()
          .toBuffer();
      } else {
        // fetch from the explorer api
        const imageRes = await fetch(
          `https://explorer-api.walletconnect.com/w3m/v1/getWalletImage/${wallet.image_id}?projectId=145769e410f16970a79ff77b2d89a1e0&`,
        );
        if (!imageRes.ok) {
          console.error(`Failed to fetch image for ${wallet.id}`);
          return;
        }
        resized = await sharp(await imageRes.arrayBuffer())
          .resize(128, 128)
          .webp()
          .toBuffer();
      }

      // arrayBuffer to base64 webp

      const base64Flag = "data:image/webp;base64,";

      // write the image to the wallet's folder in a typescript file
      await writeFile(
        join(walletDir, "image.ts"),
        await format(
          `// This file is auto-generated by the \`scripts/wallets/generate.ts\` script.
  // Do not modify this file manually.

  const image = "${base64Flag}${resized.toString("base64")}";

  export default image;
  `,
          {
            parser: "babel-ts",
          },
        ),
      );
    })(),
  );
}

await Promise.all(p);

// generate a switch case file of lazy imports

const walletImports = allSupportedWallets
  .map(
    (wallet) =>
      `case "${wallet.id}": {
        return (
          image
            ? import("./wallet/${wallet.id}/image.js").then((img) => img.default)
            : import("./wallet/${wallet.id}/index.js").then((w) => w.wallet)
        ) as Promise<[TImage] extends [true] ? string : any>;
}`,
  )
  .join("\n");

const customWalletImports = [
  "smart",
  "inApp",
  "walletConnect",
  "embedded",
  "adapter",
]
  .map(
    (walletId) =>
      `case "${walletId}": {
        return (
          image
            ? import("../custom/${walletId}/image.js").then((img) => img.default)
            : import("../custom/${walletId}/index.js").then((w) => w.wallet)
        ) as Promise<[TImage] extends [true] ? string : any>;
}`,
  )
  .join("\n");

await writeFile(
  join(OUT_PATH, "getWalletInfo.ts"),
  await format(
    `// This file is auto-generated by the \`scripts/wallets/generate.ts\` script.
// Do not modify this file manually.
import { isEcosystemWallet } from "../ecosystem/is-ecosystem-wallet.js"
import type { WalletInfo } from "../wallet-info.js";
import type { WalletId } from "../wallet-types.js";

/**
 * Retrieves the wallet based on the provided ID.
 * @param id - The ID of the wallet.
 * @returns A promise that resolves to the wallet.
 * @internal
 */
export async function getWalletInfo<TImage extends boolean>(id: WalletId, image?: TImage): Promise<[TImage] extends [true] ? string : WalletInfo> {
  if (isEcosystemWallet(id)) {
    const { getEcosystemWalletInfo } = await import("../ecosystem/get-ecosystem-wallet-info.js");
    return (image
      ? getEcosystemWalletInfo(id).then((info) => info.image_id)
      : getEcosystemWalletInfo(id)) as Promise<[TImage] extends [true] ? string : WalletInfo>;
  }

  switch (id) {
    ${customWalletImports}
    ${walletImports}
    default: {
      throw new Error(\`Wallet with id \${id} not found\`);
    }
  }
}
`,
    {
      parser: "babel-ts",
    },
  ),
);
