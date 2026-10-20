"use client";

import { useCallback } from "react";

declare global {
  interface Window {
    Razorpay: any;
  }
}

/**
 * Loads Razorpay checkout script dynamically if not already loaded.
 */
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }

    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.error("Failed to load Razorpay SDK");
      resolve(false);
    };

    document.body.appendChild(script);
  });
}

export interface RazorpaySubscriptionOptions {
  key: string;
  subscription_id: string;
  name: string;
  description: string;
  image?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
  handler: (response: {
    razorpay_payment_id: string;
    razorpay_subscription_id: string;
    razorpay_signature: string;
  }) => void;
  modal?: {
    ondismiss?: () => void;
  };
}

export interface RazorpayOrderOptions {
  key: string;
  order_id: string;
  amount: number; // in paise
  currency: string;
  name: string;
  description: string;
  image?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
  handler: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
  modal?: {
    ondismiss?: () => void;
  };
}

export function useRazorpay() {
  const openSubscriptionCheckout = useCallback(
    async (options: RazorpaySubscriptionOptions) => {
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        throw new Error("Unable to load Razorpay checkout SDK. Please check your internet connection.");
      }

      const rzp = new window.Razorpay({
        ...options,
        theme: {
          color: options.theme?.color || "#00412E",
        },
      });

      rzp.on("payment.failed", (response: any) => {
        console.warn("Razorpay payment failed:", response.error);
      });

      rzp.open();
    },
    []
  );

  const openOrderCheckout = useCallback(
    async (options: RazorpayOrderOptions) => {
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        throw new Error("Unable to load Razorpay checkout SDK. Please check your internet connection.");
      }

      const rzp = new window.Razorpay({
        ...options,
        theme: {
          color: options.theme?.color || "#00412E",
        },
      });

      rzp.on("payment.failed", (response: any) => {
        console.warn("Razorpay order payment failed:", response.error);
      });

      rzp.open();
    },
    []
  );

  return { openSubscriptionCheckout, openOrderCheckout };
}
