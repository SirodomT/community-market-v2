"use client";
import { useEffect } from "react";
import { toast, Toaster } from "sonner";
export function ToastProvider() {
  return (
    <Toaster
      position="top-center"
      richColors
      closeButton
      toastOptions={{ style: { fontFamily: "inherit" } }}
    />
  );
}
export function SuccessToast({ message }: { message: string }) {
  useEffect(() => {
    toast.success(message, { id: message });
  }, [message]);
  return null;
}
