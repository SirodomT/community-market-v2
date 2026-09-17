"use client";
import { useFormStatus } from "react-dom";
import { LoaderCircle } from "lucide-react";
import { Button } from "./primitives";
import type { ComponentProps } from "react";
export default function SubmitButton({
  children,
  disabled,
  ...props
}: ComponentProps<typeof Button>) {
  const { pending } = useFormStatus();
  return (
    <Button
      {...props}
      type="submit"
      disabled={disabled || pending}
      aria-busy={pending}
    >
      {pending && (
        <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
      )}
      {pending ? "กำลังดำเนินการ…" : children}
    </Button>
  );
}
