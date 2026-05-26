export {};

declare global {
  interface Window {
    AuthManagerReady?: boolean;
    showLoginModal?: () => void;
  }
}
