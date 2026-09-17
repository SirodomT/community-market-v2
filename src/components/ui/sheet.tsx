"use client";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
export default function Sheet({
  title,
  description,
  trigger,
  children,
  open,
  onOpenChange,
}: {
  title: string;
  description: string;
  trigger: ReactNode;
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const reduced = useReducedMotion();
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-foreground/35" />
        <Dialog.Content
          className="fixed inset-y-0 right-0 z-[61] w-full max-w-sm border-l border-border bg-surface shadow-xl"
          asChild
        >
          <motion.div
            initial={{ x: reduced ? 0 : 24, opacity: reduced ? 1 : 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex h-full flex-col">
              <div className="border-b border-border p-5 pr-16">
                <Dialog.Title className="text-xl font-bold">
                  {title}
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                  {description}
                </Dialog.Description>
              </div>
              <div className="flex-1 overflow-y-auto overscroll-contain p-5">
                {children}
              </div>
            </div>
            <Dialog.Close
              className="absolute right-4 top-4 flex size-11 items-center justify-center rounded-xl hover:bg-muted"
              aria-label="ปิด"
            >
              <X aria-hidden="true" className="size-5" />
            </Dialog.Close>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
