// global custom type declarations

declare global {
  interface ImportMeta {
    env: Record<string, any>;
  }
}

type BeforeInstallPromptEvent = any;

export {};
