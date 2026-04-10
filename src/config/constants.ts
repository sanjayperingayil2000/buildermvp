export const ITEMS_PER_ROW = 3;
export const NODE_WIDTH = 280;
export const H_GAP = 80;
export const V_GAP = 100;

export const HANDLE_COLORS = {
  navigate: '#10b981',
  apiCall: '#f59e0b',
  secureEntry: '#ec4899',
  saturated: '#6b7280',
  entry: '#10b981',
} as const;

export const MAX_CONNECTIONS = {
  navigate: 1,
  apiCall: 3,
  secureEntry: 1,
} as const;

export const GRID_CONSTANTS = {
  NODE_HEIGHT: 200,
  MIN_ZOOM: 0.3,
  MAX_ZOOM: 1.5,
  FIT_VIEW_PADDING: 0.2,
} as const;