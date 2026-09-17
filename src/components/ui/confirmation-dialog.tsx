"use client";
import * as Dialog from "@radix-ui/react-dialog";
import { TriangleAlert } from "lucide-react";
import { useState } from "react";
import { Button } from "./primitives";
import SubmitButton from "./submit-button";
export default function ConfirmationDialog({
  action,
  name,
  value,
  title,
  description,
  label,
}: {
  action: (formData: FormData) => void | Promise<void>;
  name: string;
  value: number;
  title: string;
  description: string;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button type="button" variant="danger">
          {label}
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-foreground/35" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[61] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-white p-6 shadow-xl">
          <span className="mb-4 inline-flex rounded-xl bg-rose-50 p-3 text-rose-800">
            <TriangleAlert aria-hidden="true" className="size-6" />
          </span>
          <Dialog.Title className="text-xl font-bold">{title}</Dialog.Title>
          <Dialog.Description className="mt-3 text-sm leading-7 text-muted-foreground">
            {description}
          </Dialog.Description>
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <Dialog.Close asChild>
              <Button type="button" variant="secondary" autoFocus>
                กลับ
              </Button>
            </Dialog.Close>
            <form action={action}>
              <input type="hidden" name={name} value={value} />
              <SubmitButton variant="danger">{label}</SubmitButton>
            </form>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
