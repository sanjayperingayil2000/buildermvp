'use client';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Node, Edge } from '@xyflow/react';
import type { PageDescriptor, ActionElement, NavMapEntry } from '../types/store';

export interface RawManifestWidget {
  uuid: string;
  id: string;
  type: string;
  props: Record<string, unknown>;
  state_variants?: Record<string, Record<string, unknown>>;
}

export interface RawManifestPage {
  id: string;
  uuid?: string;
  name: string;
  route?: string;
  widgets: RawManifestWidget[];
}

export interface BuildConfig {
  theme_light: Record<string, string>;
  theme_dark: Record<string, string>;
  typography: Record<string, {
    size: number;
    weight: number;
    line_height: number;
    letter_spacing: number;
  }> & { font_family: string };
}

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
  navMap: NavMapEntry[];
  rawManifestPages: RawManifestPage[];
  buildConfig: BuildConfig | null;
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
  updateProjectConfig: (id: string, config: Partial<ProjectConfig>) => void;

  setPages: (pages: PageDescriptor[]) => void;
  addPagesToProject: (newPages: PageDescriptor[], newNodes: Node[]) => void;
  setFlowNodes: (nodes: Node[]) => void;
  setFlowEdges: (edges: Edge[]) => void;
  setNavMap: (navMap: NavMapEntry[]) => void;
  setRawManifestPages: (pages: RawManifestPage[]) => void;
  setBuildConfig: (config: BuildConfig) => void;
  updateNode: (nodeId: string, data: unknown) => void;
  setStartingPage: (pageId: string | null) => void;

  hideActionElement: (pageId: string, elementId: string) => void;
  restoreActionElement: (pageId: string, elementId: string) => void;
  updateActionElement: (pageId: string, elementId: string, updates: Partial<ActionElement>) => void;

  hydrateFromStorage: () => void;
  clearAll: () => void;
}

function touchProject(state: AppState, projectId: string): void {
  const project = state.projects.find(p => p.id === projectId);
  if (project) {
    project.updatedAt = new Date().toISOString();
  }
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
          navMap: projectData.navMap || [],
          rawManifestPages: projectData.rawManifestPages || [],
          buildConfig: projectData.buildConfig || null,
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

      updateProjectConfig: (id, config) => {
        set((state) => ({
          projects: state.projects.map(p => 
            p.id === id 
              ? { 
                  ...p, 
                  config: { ...p.config, ...config },
                  startingPageId: 'initialRoute' in config && config.initialRoute !== undefined 
                    ? config.initialRoute 
                    : p.startingPageId,
                  updatedAt: new Date().toISOString(),
                } 
              : p
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
          const nextNavMap = project.navMap.filter(e => validPageIds.has(e.sourcePageId) && validPageIds.has(e.targetPageId));
          const nextStartingPageId = project.startingPageId && !validPageIds.has(project.startingPageId) ? null : project.startingPageId;

          // Scrub stale targetPageId references inside every surviving page's actionElements.
          // This handles three places where a deleted page's id may be stored:
          //   1. jsonConditions[].targetPageId  — used by api-call and conditionalNavigate
          //   2. outcomes[].targetPageId        — used by secure_entry_routing
          //   3. navigateTo                     — used by simple navigate
          const scrubbedPages = pages.map((page) => ({
            ...page,
            actionElements: page.actionElements.map((el) => ({
              ...el,
              // Remove jsonConditions that point to the deleted page
              jsonConditions: (el.jsonConditions ?? []).filter(
                (c) => validPageIds.has(c.targetPageId)
              ),
              // Remove outcomes that point to the deleted page
              outcomes: (el.outcomes ?? []).filter(
                (o) => validPageIds.has(o.targetPageId)
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
                    navMap: nextNavMap,
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
        console.log("setFlowEdges ACTION - activeProjectId:", get().activeProjectId);
        console.log("setFlowEdges ACTION - writing edges:", edges.length);
        set((state) => ({
          projects: state.projects.map(p => 
            p.id === state.activeProjectId
              ? { ...p, flowEdges: edges, updatedAt: new Date().toISOString() }
              : p
          ),
        }));
      },

      setNavMap: (navMap) => {
        set((state) => ({
          projects: state.projects.map(p => 
            p.id === state.activeProjectId
              ? { ...p, navMap, updatedAt: new Date().toISOString() }
              : p
          ),
        }));
      },

      setRawManifestPages: (pages) => {
        set((state) => ({
          projects: state.projects.map(p => 
            p.id === state.activeProjectId
              ? { ...p, rawManifestPages: pages, updatedAt: new Date().toISOString() }
              : p
          ),
        }));
      },

      setBuildConfig: (config) => {
        set((state) => ({
          projects: state.projects.map(p => 
            p.id === state.activeProjectId
              ? { ...p, buildConfig: config, updatedAt: new Date().toISOString() }
              : p
          ),
        }));
      },

      updateNode: (nodeId, data) => {
        set((state) => ({
          projects: state.projects.map(p => 
            p.id === state.activeProjectId
              ? { 
                  ...p, 
                  flowNodes: p.flowNodes.map(n => 
                    n.id === nodeId 
                      ? { ...n, data: { ...(n.data as Record<string, unknown>), ...(data as Record<string, unknown>) }}
                      : n
                  ),
                  updatedAt: new Date().toISOString(),
                }
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
                    navMap: p.navMap.filter(
                      entry => !(entry.sourcePageId === pageId && (entry.sourceHandleId === elementId || entry.sourceHandleId?.startsWith(`${elementId}__`)))
                    ),
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

      hydrateFromStorage: () => {},

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
            navMap?: NavMapEntry[];
            rawManifestPages?: RawManifestPage[] | null;
            buildConfig?: BuildConfig | null;
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
            navMap: oldState.navMap || [],
            rawManifestPages: oldState.rawManifestPages || [],
            buildConfig: oldState.buildConfig || null,
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