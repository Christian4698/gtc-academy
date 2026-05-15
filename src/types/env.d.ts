declare namespace NodeJS {
  interface ProcessEnv {
    EXPO_PUBLIC_SUPABASE_URL?: string;
    EXPO_PUBLIC_SUPABASE_ANON_KEY?: string;
    EXPO_PUBLIC_ANTHROPIC_KEY?: string;
    EXPO_PUBLIC_ADMIN_EMAILS?: string;
    EXPO_PUBLIC_EAS_PROJECT_ID?: string;
    EXPO_PUBLIC_STRIPE_MONTHLY_PRICE_ID?: string;
    EXPO_PUBLIC_STRIPE_ANNUAL_PRICE_ID?: string;
  }
}

declare const process: {
  env: NodeJS.ProcessEnv;
};

declare function require(name: string): any;
