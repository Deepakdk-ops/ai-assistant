export function useDemoMode() {
  return import.meta.env.VITE_DEMO_MODE === "true";
}
