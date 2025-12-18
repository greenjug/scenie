import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface GameConfig {
  game: {
    title: string;
    containerAspectRatio: number;
    requires: any[];
    requiredCoreVersion: string;
  };
  scenes: Scene[];
}

interface Scene {
  name: string;
  initial?: boolean;
  elements: Element[];
  pageBackground?: any[];
}

interface Element {
  id: string;
  type: string;
  x?: number;
  y?: number;
  width?: string | number;
  height?: string | number;
  clickable?: boolean;
  [key: string]: any;
}

interface EditorState {
  gameConfig: GameConfig | null;
  validatedGameConfig: GameConfig | null; // Memoized validated config
  selectedScene: string | null;
  selectedElement: string | null;
  isPreviewMode: boolean;

  // Getters
  getValidatedGameConfig: () => GameConfig | null;

  // Internal helper
  updateValidatedConfig: () => void;

  // Actions
  setGameConfig: (config: GameConfig) => void;
  setSelectedScene: (sceneId: string) => void;
  setSelectedElement: (elementId: string | null) => void;
  togglePreviewMode: () => void;

  // Scene management
  addScene: (sceneName: string) => void;
  deleteScene: (sceneName: string) => void;
  updateScene: (sceneName: string, updates: Partial<Scene>) => void;

  // Element management
  addElement: (sceneName: string, element: Element) => void;
  updateElement: (sceneName: string, elementId: string, updates: Partial<Element>) => void;
  deleteElement: (sceneName: string, elementId: string) => void;
}

export const useEditorStore = create<EditorState>()(
  devtools(
    (set, get) => ({
      gameConfig: null,
      validatedGameConfig: null, // Initialize memoized config
      selectedScene: null,
      selectedElement: null,
      isPreviewMode: false,

      getValidatedGameConfig: () => {
        const state = get();
        return state.validatedGameConfig;
      },

      // Helper function to update validated config
      updateValidatedConfig: () => {
        const state = get();
        if (!state.gameConfig) {
          set({ validatedGameConfig: null });
          return;
        }

        try {
          const validated = {
            ...state.gameConfig,
            scenes: (state.gameConfig.scenes || [])
              .filter(scene => scene && typeof scene === 'object') // Filter out undefined/null scenes
              .map(scene => ({
                ...scene,
                pageBackground: scene.pageBackground || [],
                elements: scene.elements || []
              }))
          };
          set({ validatedGameConfig: validated });
        } catch (error) {
          console.error('Store: Error updating validated config:', error);
          set({ validatedGameConfig: null });
        }
      },

      setGameConfig: (config) => {
        set({ gameConfig: config });
        // Update validated config whenever gameConfig changes
        get().updateValidatedConfig();
      },
      setSelectedScene: (sceneId) => set({ selectedScene: sceneId }),
      setSelectedElement: (elementId) => set({ selectedElement: elementId }),
      togglePreviewMode: () => set((state) => ({ isPreviewMode: !state.isPreviewMode })),

      addScene: (sceneName) => set((state) => {
        if (!state.gameConfig) return state;

        const newScene: Scene = {
          name: sceneName,
          elements: [],
          pageBackground: []
        };

        const existingScenes = (state.gameConfig.scenes || []).filter(scene => scene && typeof scene === 'object');
        const updatedScenes = [...existingScenes, newScene].map(scene => ({
          ...scene,
          pageBackground: scene.pageBackground || []
        }));

        const newState = {
          gameConfig: {
            ...state.gameConfig,
            scenes: updatedScenes
          }
        };

        // Update validated config after state change
        setTimeout(() => get().updateValidatedConfig(), 0);
        return newState;
      }),

      deleteScene: (sceneName) => set((state) => {
        if (!state.gameConfig) return state;

        const newState = {
          gameConfig: {
            ...state.gameConfig,
            scenes: (state.gameConfig.scenes || []).filter(scene => scene.name !== sceneName)
          },
          selectedScene: state.selectedScene === sceneName ? null : state.selectedScene
        };

        // Update validated config after state change
        setTimeout(() => get().updateValidatedConfig(), 0);
        return newState;
      }),

      updateScene: (sceneName, updates) => set((state) => {
        if (!state.gameConfig) return state;

        const newState = {
          gameConfig: {
            ...state.gameConfig,
            scenes: (state.gameConfig.scenes || []).map(scene =>
              scene.name === sceneName ? { ...scene, ...updates } : scene
            )
          }
        };

        // Update validated config after state change
        setTimeout(() => get().updateValidatedConfig(), 0);
        return newState;
      }),

      addElement: (sceneName, element) => set((state) => {
        if (!state.gameConfig) return state;

        const newState = {
          gameConfig: {
            ...state.gameConfig,
            scenes: (state.gameConfig.scenes || []).map(scene =>
              scene.name === sceneName
                ? { ...scene, elements: [...scene.elements, element] }
                : scene
            )
          }
        };

        // Update validated config after state change
        setTimeout(() => get().updateValidatedConfig(), 0);
        return newState;
      }),

      updateElement: (sceneName, elementId, updates) => set((state) => {
        if (!state.gameConfig) return state;

        const newState = {
          gameConfig: {
            ...state.gameConfig,
            scenes: (state.gameConfig.scenes || []).map(scene =>
              scene.name === sceneName
                ? {
                    ...scene,
                    elements: scene.elements.map(element =>
                      element.id === elementId ? { ...element, ...updates } : element
                    )
                  }
                : scene
            )
          }
        };

        // Update validated config after state change
        setTimeout(() => get().updateValidatedConfig(), 0);
        return newState;
      }),

      deleteElement: (sceneName, elementId) => set((state) => {
        if (!state.gameConfig) return state;

        const newState = {
          gameConfig: {
            ...state.gameConfig,
            scenes: (state.gameConfig.scenes || []).map(scene =>
              scene.name === sceneName
                ? { ...scene, elements: scene.elements.filter(element => element.id !== elementId) }
                : scene
            )
          },
          selectedElement: state.selectedElement === elementId ? null : state.selectedElement
        };

        // Update validated config after state change
        setTimeout(() => get().updateValidatedConfig(), 0);
        return newState;
      }),
    }),
    { name: 'editor-store' }
  )
);