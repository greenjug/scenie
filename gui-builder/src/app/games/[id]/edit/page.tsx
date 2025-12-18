'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { SceneTree } from '@/components/SceneTree';
import { ElementPalette } from '@/components/ElementPalette';
import { PropertyInspector } from '@/components/PropertyInspector';
import { GamePreview } from '@/components/GamePreview';
import { useEditorStore } from '@/lib/store';
import { Layout, Plus, Palette, Image, Loader2 } from 'lucide-react';

export default function EditorPage({ params }: { params: { id: string } }) {
  const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const isClerkConfigured = clerkPublishableKey && clerkPublishableKey !== 'your_clerk_publishable_key';

  const { isLoaded, userId } = useAuth();
  const router = useRouter();
  const [activeAside, setActiveAside] = useState<'scenes' | 'add' | 'variables' | 'assets' | null>(null);
  const [showProperties, setShowProperties] = useState(false);

  const {
    gameConfig,
    selectedScene,
    selectedElement,
    setGameConfig,
    setSelectedScene,
    setSelectedElement,
    addScene,
    deleteScene,
    addElement,
    updateElement,
    deleteElement
  } = useEditorStore();

  // Load game config (mock data for now)
  useEffect(() => {
      const mockConfig = {
        game: {
          title: "Sample Game",
          containerAspectRatio: 0.5625,
          mobileSize: 320,
          tabletSize: 768,
          desktopSize: 1024,
          resizeDebounce: 100,
          fadeDuration: 300,
          defaultScaleDuration: 500,
          preloadImages: false,
          requires: [],
          requiredCoreVersion: "0.1.16",
          useCDN: false,
          pageBackground: [],
          containerBackground: []
        },
        scenes: [
          {
            name: "landing",
            initial: true,
            pageBackground: [],
            elements: [
              {
                id: "welcome_image",
                type: "picture",
                location: "local",
                url: "https://via.placeholder.com/400x200/4f46e5/ffffff?text=Welcome",
                x: 50,
                y: 30,
                width: "80%",
                clickable: false,
                aspectRatio: "2/1"
              }
            ]
          },
          {
            name: "gameplay",
            pageBackground: [],
            elements: []
          }
        ]
      };
    setGameConfig(mockConfig);
    setSelectedScene("landing");
  }, [setGameConfig, setSelectedScene]);

  useEffect(() => {
    if (isClerkConfigured && isLoaded && !userId) {
      router.push('/sign-in');
    }
  }, [isLoaded, userId, router, isClerkConfigured]);

  // If Clerk is not configured, allow access without authentication
  if (!isClerkConfigured) {
    // Continue with the rest of the component logic
  } else if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  } else if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Redirecting to sign in...</p>
        </div>
      </div>
    );
  }

  const handleSceneSelect = (sceneName: string) => {
    setSelectedScene(sceneName);
  };

  const handleSceneAdd = () => {
    try {
      const sceneName = `scene_${Date.now()}`;
      addScene(sceneName);
      setSelectedScene(sceneName);
    } catch (error) {
      console.error('Error in handleSceneAdd:', error);
    }
  };

  const handleSceneDelete = (sceneName: string) => {
    deleteScene(sceneName);
  };

  const handleSceneToggle = (sceneName: string) => {
    // TODO: Implement scene visibility toggle
  };

  const handleElementAdd = (elementType: string, position?: { x: number; y: number }) => {
    if (!selectedScene) return;

    const baseElement = {
      id: `${elementType}_${Date.now()}`,
      type: elementType,
      x: position?.x ?? 50,
      y: position?.y ?? 50,
      width: elementType === 'text' ? '80%' : 100,
      height: elementType === 'text' ? 'auto' : 100,
      clickable: false
    };

    // Add element-specific defaults
    let newElement: any = { ...baseElement };
    
    if (elementType === 'picture') {
      newElement.location = 'local';
      newElement.url = 'https://via.placeholder.com/200x100/cccccc/666666?text=Image';
      newElement.aspectRatio = '2/1';
    } else if (elementType === 'container') {
      newElement.variant = 'vflex';
    }

    addElement(selectedScene, newElement);
    setSelectedElement(newElement.id);
  };

  const handleElementUpdate = (elementId: string, updates: any) => {
    if (!selectedScene) return;
    updateElement(selectedScene, elementId, updates);
  };

  const handleElementSelect = (elementId: string | null) => {
    setSelectedElement(elementId);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Scenie</h1>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Auto-saved</span>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                Publish
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="bg-gray-50 border-b border-gray-200 relative z-20 pointer-events-auto">
        <div className="container mx-auto px-4 py-3">
          <div className="text-sm text-gray-600">
            <Link href="/games" className="text-gray-600 hover:text-gray-900 underline decoration-transparent hover:decoration-gray-900 transition-colors cursor-pointer pointer-events-auto">My Games</Link>
            <span className="mx-2">/</span>
            <span className="font-medium text-gray-900">{gameConfig?.game?.title || 'Game'}</span>
            <span className="mx-2">/</span>
            <span className="font-medium text-gray-900">Game Editor</span>
          </div>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Vertical Icon Bar */}
        <div className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-4 space-y-4">
          <button
            onClick={() => setActiveAside(activeAside === 'scenes' ? null : 'scenes')}
            className={`p-3 rounded-lg transition-colors ${
              activeAside === 'scenes' 
                ? 'bg-blue-100 text-blue-600' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            title="Scenes"
          >
            <Layout className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => setActiveAside(activeAside === 'add' ? null : 'add')}
            className={`p-3 rounded-lg transition-colors ${
              activeAside === 'add' 
                ? 'bg-blue-100 text-blue-600' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            title="Add Elements"
          >
            <Plus className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => setActiveAside(activeAside === 'variables' ? null : 'variables')}
            className={`p-3 rounded-lg transition-colors ${
              activeAside === 'variables' 
                ? 'bg-blue-100 text-blue-600' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            title="Variables"
          >
            <Palette className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => setActiveAside(activeAside === 'assets' ? null : 'assets')}
            className={`p-3 rounded-lg transition-colors ${
              activeAside === 'assets' 
                ? 'bg-blue-100 text-blue-600' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            title="Assets"
          >
            <Image className="w-5 h-5" />
          </button>
        </div>

        {/* Overlay Asides */}
        {/* Scenes Aside */}
        {activeAside === 'scenes' && (
          <aside className="absolute left-16 top-0 h-full w-80 bg-white border-r border-gray-200 shadow-lg z-30 flex flex-col animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="font-medium text-gray-900">Scenes</h3>
              <button
                onClick={() => setActiveAside(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <SceneTree
                scenes={gameConfig?.scenes || []}
                selectedScene={selectedScene}
                selectedElement={selectedElement}
                onSceneSelect={handleSceneSelect}
                onSceneAdd={handleSceneAdd}
                onSceneDelete={handleSceneDelete}
                onSceneToggle={handleSceneToggle}
                onElementSelect={setSelectedElement}
              />
            </div>
          </aside>
        )}

        {/* Add Elements Aside */}
        {activeAside === 'add' && (
          <aside className="absolute left-16 top-0 h-full w-80 bg-white border-r border-gray-200 shadow-lg z-30 flex flex-col animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="font-medium text-gray-900">Add Elements</h3>
              <button
                onClick={() => setActiveAside(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <ElementPalette onElementAdd={handleElementAdd} />
            </div>
          </aside>
        )}

        {/* Variables Aside */}
        {activeAside === 'variables' && (
          <aside className="absolute left-16 top-0 h-full w-80 bg-white border-r border-gray-200 shadow-lg z-30 flex flex-col animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="font-medium text-gray-900">Variables</h3>
              <button
                onClick={() => setActiveAside(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Colors Section */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Colors</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">Primary</span>
                    <div className="w-6 h-6 bg-blue-600 rounded"></div>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">Secondary</span>
                    <div className="w-6 h-6 bg-gray-600 rounded"></div>
                  </div>
                  <button className="w-full py-2 px-3 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                    Add Color
                  </button>
                </div>
              </div>

              {/* Fonts Section */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Fonts</h4>
                <div className="space-y-2">
                  <div className="p-2 bg-gray-50 rounded">
                    <span className="text-sm font-medium">Arial</span>
                    <p className="text-xs text-gray-600">System font</p>
                  </div>
                  <div className="p-2 bg-gray-50 rounded">
                    <span className="text-sm font-medium">Helvetica</span>
                    <p className="text-xs text-gray-600">System font</p>
                  </div>
                  <button className="w-full py-2 px-3 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                    Upload Font
                  </button>
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* Assets Aside */}
        {activeAside === 'assets' && (
          <aside className="absolute left-16 top-0 h-full w-80 bg-white border-r border-gray-200 shadow-lg z-30 flex flex-col animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="font-medium text-gray-900">Assets</h3>
              <button
                onClick={() => setActiveAside(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                <button className="w-full py-3 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors">
                  <div className="flex flex-col items-center">
                    <Image className="w-8 h-8 mb-2" />
                    <span className="text-sm font-medium">Upload Assets</span>
                    <span className="text-xs">Drag & drop or click to browse</span>
                  </div>
                </button>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Project Assets</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="aspect-square bg-gray-100 rounded border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:bg-gray-50">
                      <Image className="w-6 h-6 text-gray-400" />
                    </div>
                    <div className="aspect-square bg-gray-100 rounded border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:bg-gray-50">
                      <Image className="w-6 h-6 text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* Middle Pane - Preview */}
        <div className="flex-1">
          <GamePreview
            selectedScene={selectedScene}
            selectedElement={selectedElement}
            onSceneSelect={handleSceneSelect}
            onElementAdd={handleElementAdd}
            onElementSelect={handleElementSelect}
            showProperties={showProperties}
            onToggleProperties={() => setShowProperties(!showProperties)}
          />
        </div>

        {/* Overlay Properties Panel */}
        {showProperties && (
          <div className="absolute top-0 right-0 h-full w-80 bg-white border-l border-gray-200 shadow-lg z-40">
            <PropertyInspector
              selectedElement={selectedElement ? gameConfig?.scenes
                .find(s => s.name === selectedScene)
                ?.elements.find(e => e.id === selectedElement) || null : null}
              onElementUpdate={handleElementUpdate}
              onClose={() => setShowProperties(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}