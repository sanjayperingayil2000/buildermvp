import type { PageDescriptor, ActionElement } from '../../types/store';

export interface PagesState {
  pages: PageDescriptor[];
}

export const initialPagesState: PagesState = {
  pages: [],
};

export function setPages(state: PagesState, pages: PageDescriptor[]): PagesState {
  return { ...state, pages };
}

export function hideActionElement(
  state: PagesState,
  pageId: string,
  elementId: string
): PagesState {
  return {
    ...state,
    pages: state.pages.map((p) =>
      p.id === pageId
        ? {
            ...p,
            actionElements: p.actionElements.map((el) =>
              el.id === elementId ? { ...el, isHidden: true } : el
            ),
          }
        : p
    ),
  };
}

export function restoreActionElement(
  state: PagesState,
  pageId: string,
  elementId: string
): PagesState {
  return {
    ...state,
    pages: state.pages.map((p) =>
      p.id === pageId
        ? {
            ...p,
            actionElements: p.actionElements.map((el) =>
              el.id === elementId ? { ...el, isHidden: false } : el
            ),
          }
        : p
    ),
  };
}

export function updateActionElement(
  state: PagesState,
  pageId: string,
  elementId: string,
  updates: Partial<ActionElement>
): PagesState {
  return {
    ...state,
    pages: state.pages.map((p) =>
      p.id === pageId
        ? {
            ...p,
            actionElements: p.actionElements.map((el) =>
              el.id === elementId ? { ...el, ...updates } : el
            ),
          }
        : p
    ),
  };
}