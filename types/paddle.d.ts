export {};

declare global {
  interface Window {
    Paddle?: {
      Environment: {
        set: (environment: "sandbox" | "production") => void;
      };
      Initialize: (options: { token: string }) => void;
      Checkout: {
        open: (options: {
          items?: Array<{ priceId: string; quantity: number }>;
          transactionId?: string;
          customData?: Record<string, unknown>;
          customer?: {
            email?: string;
          };
          settings?: {
            displayMode?: "overlay" | "inline";
            variant?: "multi-page" | "one-page";
            successUrl?: string;
          };
        }) => void;
      };
    };
  }
}
