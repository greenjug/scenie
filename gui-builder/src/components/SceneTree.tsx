import { useState } from 'react';
import { Plus, Eye, EyeOff, Settings, Trash2 } from 'lucide-react';

interface Scene {
  name: string;
  initial?: boolean;
  elements: any[];
}

interface SceneTreeProps {
  scenes: Scene[];
  selectedScene: string | null;
  selectedElement: string | null;
  onSceneSelect: (sceneName: string) => void;
  onSceneAdd: () => void;
  onSceneDelete: (sceneName: string) => void;
  onSceneToggle: (sceneName: string) => void;
  onElementSelect: (elementId: string | null) => void;
}

export function SceneTree({
  scenes,
  selectedScene,
  selectedElement,
  onSceneSelect,
  onSceneAdd,
  onSceneDelete,
  onSceneToggle,
  onElementSelect
}: SceneTreeProps) {
  const [expandedScenes, setExpandedScenes] = useState<Set<string>>(new Set());

  // Filter out invalid scenes
  const validScenes = scenes.filter(scene => scene && typeof scene === 'object' && scene.name);

  const toggleSceneExpansion = (sceneName: string) => {
    const newExpanded = new Set(expandedScenes);
    if (newExpanded.has(sceneName)) {
      newExpanded.delete(sceneName);
    } else {
      newExpanded.add(sceneName);
    }
    setExpandedScenes(newExpanded);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="font-semibold text-gray-900">Scenes</h2>
        <button
          onClick={onSceneAdd}
          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
          title="Add Scene"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Scene List */}
      <div className="flex-1 overflow-y-auto">
        {validScenes.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <p className="text-sm">No scenes yet</p>
            <button
              onClick={onSceneAdd}
              className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
            >
              Create your first scene
            </button>
          </div>
        ) : (
          <div className="p-2">
            {validScenes.map((scene) => (
              <div key={scene.name} className="mb-1">
                {/* Scene Header */}
                <div
                  className={`flex items-center p-2 rounded cursor-pointer hover:bg-gray-100 ${
                    selectedScene === scene.name ? 'bg-blue-50 border border-blue-200' : ''
                  }`}
                  onClick={() => onSceneSelect(scene.name)}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSceneExpansion(scene.name);
                    }}
                    className="mr-2 text-gray-400 hover:text-gray-600"
                  >
                    {expandedScenes.has(scene.name) ? '▼' : '▶'}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {scene.name}
                      </span>
                      {scene.initial && (
                        <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">
                          Initial
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {scene.elements.length} elements
                    </div>
                  </div>

                  <div className="flex items-center gap-1 ml-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSceneToggle(scene.name);
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      title="Toggle Visibility"
                    >
                      <Eye className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Scene settings
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      title="Scene Settings"
                    >
                      <Settings className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSceneDelete(scene.name);
                      }}
                      className="p-1 text-gray-400 hover:text-red-600"
                      title="Delete Scene"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Elements List */}
                {expandedScenes.has(scene.name) && (
                  <div className="ml-6 mt-1 space-y-1">
                    {scene.elements.map((element, index) => (
                      <div
                        key={element.id || index}
                        className={`flex items-center p-2 text-sm hover:bg-gray-50 rounded cursor-pointer ${
                          selectedElement === element.id ? 'bg-blue-50 border border-blue-200' : 'text-gray-600'
                        }`}
                        onClick={() => onElementSelect(element.id)}
                      >
                        <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
                        <span className="capitalize">{element.type}</span>
                        <span className="ml-2 text-gray-400">#{element.id}</span>
                      </div>
                    ))}
                    {scene.elements.length === 0 && (
                      <div className="text-xs text-gray-400 italic p-2">
                        No elements
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          {scenes.length} scene{scenes.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
}