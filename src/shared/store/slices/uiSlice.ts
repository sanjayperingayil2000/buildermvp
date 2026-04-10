export interface UIState {
  isLoading: boolean;
  toastMessage: string | null;
  toastType: 'success' | 'error' | 'info';
}

export const initialUIState: UIState = {
  isLoading: false,
  toastMessage: null,
  toastType: 'info',
};

export function setLoading(state: UIState, isLoading: boolean): UIState {
  return { ...state, isLoading };
}

export function showToast(state: UIState, message: string, type: UIState['toastType'] = 'info'): UIState {
  return { ...state, toastMessage: message, toastType: type };
}

export function hideToast(state: UIState): UIState {
  return { ...state, toastMessage: null };
}