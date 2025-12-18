import { useState } from 'react';
import { X, Settings, Eye, EyeOff } from 'lucide-react';

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

interface PropertyInspectorProps {
  selectedElement: Element | null;
  onElementUpdate: (elementId: string, updates: Partial<Element>) => void;
  onClose: () => void;
}

export function PropertyInspector({ selectedElement, onElementUpdate, onClose }: PropertyInspectorProps) {
  const [activeTab, setActiveTab] = useState<'basic' | 'advanced' | 'actions'>('basic');

  if (!selectedElement) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4">
          <h2 className="font-semibold text-gray-900">Properties</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center text-gray-500">
            <Settings className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Select an element to edit its properties</p>
          </div>
        </div>
      </div>
    );
  }

  const updateElement = (updates: Partial<Element>) => {
    onElementUpdate(selectedElement.id, updates);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div>
          <h2 className="font-semibold text-gray-900">Properties</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {selectedElement.type}
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-1">#{selectedElement.id}</p>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {[
          { id: 'basic', label: 'Basic' },
          { id: 'advanced', label: 'Advanced' },
          { id: 'actions', label: 'Actions' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'basic' && (
          <div className="p-4 space-y-4">
            {/* Position */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Position
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">X (%)</label>
                  <input
                    type="number"
                    value={selectedElement.x || 0}
                    onChange={(e) => updateElement({ x: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Y (%)</label>
                  <input
                    type="number"
                    value={selectedElement.y || 0}
                    onChange={(e) => updateElement({ y: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Size
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Width</label>
                  <input
                    type="text"
                    value={selectedElement.width || '100%'}
                    onChange={(e) => updateElement({ width: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Height</label>
                  <input
                    type="text"
                    value={selectedElement.height || '100%'}
                    onChange={(e) => updateElement({ height: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Clickable */}
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedElement.clickable || false}
                  onChange={(e) => updateElement({ clickable: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">Clickable</span>
              </label>
            </div>
          </div>
        )}

        {activeTab === 'advanced' && (
          <div className="p-4 space-y-4">
            {/* Picture-specific properties */}
            {selectedElement.type === 'picture' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image Source
                  </label>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Location</label>
                      <select
                        value={selectedElement.location || 'local'}
                        onChange={(e) => updateElement({ location: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="local">Local</option>
                        <option value="remote">Remote</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">URL</label>
                      <input
                        type="text"
                        value={selectedElement.url || ''}
                        onChange={(e) => updateElement({ url: e.target.value })}
                        placeholder="Enter image URL"
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Aspect Ratio</label>
                      <input
                        type="text"
                        value={selectedElement.aspectRatio || ''}
                        onChange={(e) => updateElement({ aspectRatio: e.target.value })}
                        placeholder="e.g., 16/9"
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Container-specific properties */}
            {selectedElement.type === 'container' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Layout
                  </label>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Variant</label>
                    <select
                      value={selectedElement.variant || 'vflex'}
                      onChange={(e) => updateElement({ variant: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="vflex">Vertical Flex</option>
                      <option value="hflex">Horizontal Flex</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* Default message for other element types */}
            {!['picture', 'container'].includes(selectedElement.type) && (
              <div className="text-sm text-gray-500">
                Advanced properties for {selectedElement.type} elements
              </div>
            )}
          </div>
        )}

        {activeTab === 'actions' && (
          <div className="p-4 space-y-4">
            {/* Click actions would be configured here */}
            <div className="text-sm text-gray-500">
              Click actions configuration
            </div>
          </div>
        )}
      </div>
    </div>
  );
}