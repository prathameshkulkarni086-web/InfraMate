/**
 * InfraSync Feature Configuration & Flags
 * 
 * Centralized feature flags for toggling optional or temporarily disabled modules.
 * Set `visualizer2D3D` to `true` to immediately restore 2D / 3D Visualizer navigation,
 * routes, and components without data loss or structural redesign.
 */
export const FEATURES = {
  /**
   * 2D / 3D Building Visualizer (Three.js / WebGL / 2D Floor Plans)
   * Status: Temporarily disabled per system governance.
   * Toggle to `true` to re-enable in sidebar, dashboard, permissions, and routes.
   */
  visualizer2D3D: false,
} as const;

export type FeatureKey = keyof typeof FEATURES;

/**
 * Helper to safely check if a feature is enabled
 */
export const isFeatureEnabled = (featureKey: FeatureKey): boolean => {
  return Boolean(FEATURES[featureKey]);
};
