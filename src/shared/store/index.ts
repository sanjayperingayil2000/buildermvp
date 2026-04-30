'use client';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Node, Edge } from '@xyflow/react';
import type { PageDescriptor, ActionElement } from '../types/store';

export interface ProjectConfig {
  initialRoute: string | null;
  baseUrl: string;
}

export interface Project {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  pages: PageDescriptor[];
  flowNodes: Node[];
  flowEdges: Edge[];
  startingPageId: string | null;
  config: ProjectConfig;
}

interface AppState {
  projects: Project[];
  activeProjectId: string | null;

  getActiveProject: () => Project | null;
  getProjectById: (id: string) => Project | null;

  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => string;
  deleteProject: (id: string) => void;
  setActiveProject: (id: string) => void;
  updateProjectName: (id: string, name: string) => void;

  setPages: (pages: PageDescriptor[]) => void;
  addPagesToProject: (newPages: PageDescriptor[], newNodes: Node[]) => void;
  setFlowNodes: (nodes: Node[]) => void;
  setFlowEdges: (edges: Edge[]) => void;
  setStartingPage: (pageId: string | null) => void;

  hideActionElement: (pageId: string, elementId: string) => void;
  restoreActionElement: (pageId: string, elementId: string) => void;
  updateActionElement: (pageId: string, elementId: string, updates: Partial<ActionElement>) => void;

  injectProject: (project: Project) => void;
  clearAll: () => void;
}

function generateId(): string {
  return `proj_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

const DEFAULT_PROJECT_CONFIG: ProjectConfig = {
  initialRoute: null,
  baseUrl: 'https://api.example.com',
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      projects: [],
      activeProjectId: null,

      getActiveProject: () => {
        const state = get();
        if (!state.activeProjectId) return null;
        return state.projects.find(p => p.id === state.activeProjectId) ?? null;
      },

      getProjectById: (id: string) => {
        return get().projects.find(p => p.id === id) ?? null;
      },

      addProject: (projectData) => {
        const id = generateId();
        const now = new Date().toISOString();
        const newProject: Project = {
          ...projectData,
          id,
          name: projectData.name || 'Unnamed Project',
          createdAt: now,
          updatedAt: now,
          pages: projectData.pages || [],
          flowNodes: projectData.flowNodes || [],
          flowEdges: projectData.flowEdges || [],
          startingPageId: projectData.startingPageId || null,
          config: projectData.config || { ...DEFAULT_PROJECT_CONFIG },
        };

        set((state) => ({
          projects: [...state.projects, newProject],
          activeProjectId: id,
        }));

        return id;
      },

      deleteProject: (id) => {
        set((state) => {
          const filtered = state.projects.filter(p => p.id !== id);
          return {
            projects: filtered,
            activeProjectId: state.activeProjectId === id
              ? (filtered.length > 0 ? filtered[0].id : null)
              : state.activeProjectId,
          };
        });
      },

      setActiveProject: (id) => {
        set({ activeProjectId: id });
      },

      updateProjectName: (id, name) => {
        set((state) => ({
          projects: state.projects.map(p =>
            p.id === id ? { ...p, name, updatedAt: new Date().toISOString() } : p
          ),
        }));
      },

      addPagesToProject: (newPages, newNodes) => {
        set((state) => {
          const project = state.projects.find(p => p.id === state.activeProjectId);
          if (!project) return {};

          // Deduplicate: skip pages whose id already exists
          const existingPageIds = new Set(project.pages.map(p => p.id));
          const uniqueNewPages = newPages.filter(p => !existingPageIds.has(p.id));
          const uniqueNewNodes = newNodes.filter(n => !existingPageIds.has(n.id));

          if (uniqueNewPages.length === 0) return {};

          return {
            projects: state.projects.map(p =>
              p.id === state.activeProjectId
                ? {
                  ...p,
                  pages: [...p.pages, ...uniqueNewPages],
                  flowNodes: [...p.flowNodes, ...uniqueNewNodes],
                  updatedAt: new Date().toISOString(),
                }
                : p
            ),
          };
        });
      },

      setPages: (pages) => {
        set((state) => {
          const project = state.projects.find(p => p.id === state.activeProjectId);
          if (!project) return {};

          const validPageIds = new Set(pages.map(p => p.id));
          const nextNodes = project.flowNodes.filter(n => validPageIds.has(n.id));
          const nextEdges = project.flowEdges.filter(e => validPageIds.has(e.source) && validPageIds.has(e.target));
          const nextStartingPageId = project.startingPageId && !validPageIds.has(project.startingPageId) ? null : project.startingPageId;

          // Scrub stale targetPageId references inside every surviving page's actionElements.
          // This handles three places where a deleted page's id may be stored:
          //   1. jsonConditions[].targetPageId  — used by api-call and conditionalNavigate
          //   3. navigateTo                     — used by simple navigate
          const scrubbedPages = pages.map((page) => ({
            ...page,
            actionElements: page.actionElements.map((el) => ({
              ...el,
              // Remove jsonConditions that point to the deleted page
              jsonConditions: (el.jsonConditions ?? []).filter(
                (c) => validPageIds.has(c.targetPageId)
              ),
              // Clear navigateTo if it pointed to the deleted page
              navigateTo: el.navigateTo && validPageIds.has(el.navigateTo)
                ? el.navigateTo
                : null,
            })),
          }));

          return {
            projects: state.projects.map(p =>
              p.id === state.activeProjectId
                ? {
                  ...p,
                  pages: scrubbedPages,
                  flowNodes: nextNodes,
                  flowEdges: nextEdges,
                  startingPageId: nextStartingPageId,
                  updatedAt: new Date().toISOString(),
                }
                : p
            ),
          };
        });
      },

      setFlowNodes: (nodes) => {
        set((state) => ({
          projects: state.projects.map(p =>
            p.id === state.activeProjectId
              ? { ...p, flowNodes: nodes, updatedAt: new Date().toISOString() }
              : p
          ),
        }));
      },

      setFlowEdges: (edges) => {
        set((state) => ({
          projects: state.projects.map(p =>
            p.id === state.activeProjectId
              ? { ...p, flowEdges: edges, updatedAt: new Date().toISOString() }
              : p
          ),
        }));
      },

      setStartingPage: (pageId) => {
        set((state) => ({
          projects: state.projects.map(p =>
            p.id === state.activeProjectId
              ? {
                ...p,
                startingPageId: pageId,
                config: { ...p.config, initialRoute: pageId },
                flowNodes: p.flowNodes.map(n => ({
                  ...n,
                  data: { ...n.data, startingPage: n.id === pageId },
                })),
                updatedAt: new Date().toISOString(),
              }
              : p
          ),
        }));
      },

      hideActionElement: (pageId, elementId) => {
        set((state) => {
          const project = state.projects.find(p => p.id === state.activeProjectId);
          if (!project) return {};

          const cleanedEdges: Edge[] = project.flowEdges.filter(e =>
            !(e.source === pageId && e.sourceHandle === elementId)
          );

          return {
            projects: state.projects.map(p =>
              p.id === state.activeProjectId
                ? {
                  ...p,
                  pages: p.pages.map(page =>
                    page.id === pageId
                      ? {
                        ...page,
                        actionElements: page.actionElements.map(el =>
                          el.id === elementId ? { ...el, isHidden: true } : el
                        ),
                      }
                      : page
                  ),
                  flowEdges: cleanedEdges,
                  updatedAt: new Date().toISOString(),
                }
                : p
            ),
          };
        });
      },

      restoreActionElement: (pageId, elementId) => {
        set((state) => ({
          projects: state.projects.map(p =>
            p.id === state.activeProjectId
              ? {
                ...p,
                pages: p.pages.map(page =>
                  page.id === pageId
                    ? {
                      ...page,
                      actionElements: page.actionElements.map(el =>
                        el.id === elementId ? { ...el, isHidden: false } : el
                      ),
                    }
                    : page
                ),
                updatedAt: new Date().toISOString(),
              }
              : p
          ),
        }));
      },

      updateActionElement: (pageId, elementId, updates) => {
        set((state) => ({
          projects: state.projects.map(p =>
            p.id === state.activeProjectId
              ? {
                ...p,
                pages: p.pages.map(page =>
                  page.id === pageId
                    ? {
                      ...page,
                      actionElements: page.actionElements.map(el =>
                        el.id === elementId ? { ...el, ...updates } : el
                      ),
                    }
                    : page
                ),
                updatedAt: new Date().toISOString(),
              }
              : p
          ),
        }));
      },

      injectProject: (project) => {
        set((state) => {
          // Skip if already in store (prevents duplicates on re-sync)
          if (state.projects.find((p) => p.id === project.id)) return {};
          return { projects: [...state.projects, project] };
        });
      },

      clearAll: () => {
        set({ projects: [], activeProjectId: null });
      },
    }),
    {
      name: 'kiosk-builder-store',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        projects: state.projects,
        activeProjectId: state.activeProjectId,
      }),
      migrate: (persistedState: unknown, version: number) => {
        if (version === 0) {
          const oldState = persistedState as {
            pages?: PageDescriptor[];
            flowNodes?: Node[];
            flowEdges?: Edge[];
            startingPageId?: string | null;
          };

          const now = new Date().toISOString();
          const existingProject: Project = {
            id: generateId(),
            name: 'Imported Project',
            createdAt: now,
            updatedAt: now,
            pages: oldState.pages || [],
            flowNodes: oldState.flowNodes || [],
            flowEdges: oldState.flowEdges || [],
            startingPageId: oldState.startingPageId || null,
            config: {
              initialRoute: oldState.startingPageId || null,
              baseUrl: 'https://api.example.com',
            },
          };

          return {
            projects: [existingProject],
            activeProjectId: existingProject.id,
          };
        }
        return persistedState as AppState;
      },
    }
  )
);