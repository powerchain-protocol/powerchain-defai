"use client";

import { useCallback } from "react";
import { toast, type ToastMessage } from "@/lib/toast";
import type { ProductNotice } from "@/lib/notices";

export function useToast() {
  const show = useCallback((input: Omit<ToastMessage, "id" | "durationMs"> & { durationMs?: number }) => toast(input), []);
  const notice = useCallback((input: ProductNotice) => toast({ tone: input.tone, title: input.title, description: input.description }), []);
  return { show, notice };
}
