import type { Meta, StoryObj } from "@storybook/react";
import { useForm, useFieldArray } from "react-hook-form";

import { BadgeContainer } from "../../../stories/utils";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form";

const meta = {
  title: "Modules/Transferrable",
  component: Component,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof Component>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllVariants: Story = {
  args: {},
};

function Component() {

  return (
    <div className="flex min-h-screen flex-col gap-6 bg-background p-6 text-foregroun">
      <Transferrable />
    </div>
  );
}

function Transferrable() {
  const { handleSubmit, watch, formState: { errors }, control } = useForm({
    defaultValues: {
      transferAllowlist: [{ address: "" }],
      limitTransfers: false,
    }
  });
  const { fields, append, prepend, remove, swap, move, insert } = useFieldArray({
    control, // control props comes from useForm (optional: if you are using FormProvider)
    name: "transferAllowlist", // unique name for your Field Array
  });

  const onSubmit = (data: any) => {
  }

  const limitTransfers = watch("limitTransfers");

  return (
    <form className="flex flex-col p-6 border rounded-xl gap-y-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">Transferrable</h1>

        <div className="flex gap-4 items-center">
          <p>Limit Transfers</p>
          <FormField
            control={control}
            name="limitTransfers"
            render={({ field }) => (
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
        </div>
      </div>

      <div className={`flex flex-col gap-y-4 ${limitTransfers ? "opacity-50" : ""}`}>
        <p>Allow the following accounts to transfer assets</p>
        <div className="flex flex-col gap-y-6">
          <div className="flex flex-col gap-y-2">
            {fields.map((field, index) => (
              <div className="flex gap-2 items-center" key={field.id}>
                <FormField
                  control={control}
                  name={`transferAllowlist.${index}.address`}
                  disabled={limitTransfers}
                  render={({ field: { name, ..._field } }) => (
                    <Input placeholder="0x..." name={`transferAllowlist.${index}.address`} {..._field} />
                  )}
                />
                <Button variant="outline" onClick={() => remove(index)} disabled={limitTransfers}>
                  Remove
                </Button>
              </div>
            ))}
          </div>
          <div className="flex flex-col justify-center items-center">
            <Button variant="outline" onClick={() => append({ address: "" })} disabled={limitTransfers}>
              Add Address
            </Button>
            <Button variant="ghost" size="sm" className="text-xs hover:bg-inherit" disabled={limitTransfers}>
              Upload CSV
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-end gap-y-2">
        <Button type="submit" className="self-end" >
          Submit
        </Button>
        {Object.keys(errors).length > 0 && (
          <p className="text-red-500 font-light">
            An has occured, please contact support
          </p>
        )}
      </div>
    </form >
  )
}

