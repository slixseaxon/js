"use client";

import { WalletAddress } from "@/components/blocks/wallet-address";
import { CopyAddressButton } from "@/components/ui/CopyAddressButton";
import { ScrollShadow } from "@/components/ui/ScrollShadow/ScrollShadow";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ToolTipLabel } from "@/components/ui/tooltip";
import { useMutation } from "@tanstack/react-query";
import { TransactionButton } from "components/buttons/TransactionButton";
import { CircleSlash, TrashIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  type ContractOptions,
  getContract,
  sendTransaction,
  waitForReceipt,
} from "thirdweb";
import { uninstallModuleByProxy } from "thirdweb/modules";
import type { Account } from "thirdweb/wallets";
import { useModuleContractInfo } from "./moduleContractInfo";

export const InstalledModulesTable = (props: {
  contract: ContractOptions;
  installedModules: {
    data?: string[];
    isPending: boolean;
  };
  refetchModules: () => void;
  ownerAccount?: Account;
}) => {
  const { installedModules, ownerAccount } = props;

  const sectionTitle = (
    <h2 className="mb-3 text-2xl font-bold tracking-tight">
      Installed Modules
    </h2>
  );

  if (!installedModules.isPending && installedModules.data?.length === 0) {
    return (
      <>
        {sectionTitle}
        <Alert variant="destructive">
          <div className="flex items-center gap-3">
            <CircleSlash className="size-6 text-red-400" />
            <AlertTitle className="mb-0">No modules installed</AlertTitle>
          </div>
        </Alert>
      </>
    );
  }

  return (
    <>
      {sectionTitle}
      <ScrollShadow scrollableClassName="rounded-lg">
        <div className="flex flex-col gap-6">
          {installedModules.data?.map((e, i) => (
            <ModuleTemplate
              // biome-ignore lint/suspicious/noArrayIndexKey: FIXME
              key={i}
              moduleAddress={e}
              contract={props.contract}
              onRemoveModule={props.refetchModules}
              ownerAccount={ownerAccount}
            />
          ))}
        </div>
      </ScrollShadow>
    </>
  );
};

function SkeletonModule() {
  return (
    <div className="h-[400px] w-full" />
  )
}


function ModuleTemplate(props: {
  moduleAddress: string;
  contract: ContractOptions;
  onRemoveModule: () => void;
  ownerAccount?: Account;
}) {
  const { contract, moduleAddress, ownerAccount } = props;
  const [isUninstallModalOpen, setIsUninstallModalOpen] = useState(false);

  const contractInfo = useModuleContractInfo(
    getContract({
      address: moduleAddress,
      chain: contract.chain,
      client: contract.client,
    }),
  );

  const uninstallMutation = useMutation({
    mutationFn: async (account: Account) => {
      const uninstallTransaction = uninstallModuleByProxy({
        contract,
        chain: contract.chain,
        client: contract.client,
        moduleProxyAddress: moduleAddress,
        moduleData: "0x",
      });

      const txResult = await sendTransaction({
        transaction: uninstallTransaction,
        account,
      });

      await waitForReceipt(txResult);
    },
    onSuccess() {
      toast.success("Module Removed successfully");
      props.onRemoveModule();
    },
    onError(error) {
      toast.error("Failed to remove module");
      console.error("Error during uninstallation:", error);
    },
  });

  const handleRemove = async () => {
    if (!ownerAccount) {
      return;
    }

    setIsUninstallModalOpen(false);
    uninstallMutation.mutate(ownerAccount);
  };

  if (!contractInfo) {
    return <SkeletonModule />;
  }

  return (
    <section>
      <div className="rounded-lg border border-border bg-muted/50 p-4 lg:p-6">
        {/* Title */}
        <div className="flex justify-between">
          <h3 className="text-xl font-semibold tracking-tight">
            {contractInfo.name || "..."}
          </h3>

          <ToolTipLabel label="Remove Module">
            <Button
              onClick={() => setIsUninstallModalOpen(true)}
              variant="outline"
              className="rounded-xl p-3 text-red-500"
            >
              {uninstallMutation.isPending ? (
                <Spinner className="size-4" />
              ) : (
                <TrashIcon className="size-4" />
              )}
            </Button>
          </ToolTipLabel>
        </div>

        {/* Description */}
        <p className="text-muted-foreground">
          {contractInfo.description || "..."}
        </p>

        <div className="h-5" />

        <div className="flex flex-col gap-x-8 gap-y-4 md:flex-row">
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">
              Published by:{" "}
            </p>
            <WalletAddress address={contractInfo.publisher || ""} />
          </div>

          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">
              Module Address:{" "}
            </p>
            <CopyAddressButton
              className="text-xs"
              address={props.moduleAddress || ""}
              copyIconPosition="left"
              variant="outline"
            />
          </div>
        </div>

        <div className="h-5" />

        <Dialog
          open={isUninstallModalOpen}
          onOpenChange={setIsUninstallModalOpen}
        >
          <DialogContent className="z-[10001]" dialogOverlayClassName="z-[10000]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleRemove();
              }}
            >
              <DialogHeader>
                <DialogTitle>Uninstall Module</DialogTitle>
                <DialogDescription>
                  Are you sure you want to uninstall{" "}
                  <span className="font-medium text-foreground ">
                    {contractInfo.name}
                  </span>{" "}
                  ?
                </DialogDescription>
              </DialogHeader>

              <DialogFooter className="mt-10 flex-row justify-end gap-3 md:gap-1">
                <Button
                  type="button"
                  onClick={() => setIsUninstallModalOpen(false)}
                  variant="outline"
                >
                  Cancel
                </Button>

                <TransactionButton
                  txChainID={contract.chain.id}
                  transactionCount={1}
                  isLoading={uninstallMutation.isPending}
                  type="submit"
                  colorScheme="red"
                  className="flex"
                >
                  Uninstall
                </TransactionButton>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </section >
  )
}

