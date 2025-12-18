import { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Smartphone, Tablet, Monitor, Settings, Bug, Ruler } from 'lucide-react';
import { useEditorStore } from '@/lib/store';

// Add global types for Scenie
declare global {
  interface Window {
    Game: any;
  }
}

interface GamePreviewProps {
  selectedScene: string | null;
  selectedElement: string | null;
  onSceneSelect: (sceneName: string) => void;
  onElementAdd: (elementType: string, position?: { x: number; y: number }) => void;
  onElementSelect: (elementId: string | null) => void;
  showProperties: boolean;
  onToggleProperties: () => void;
}

export function GamePreview({ 
  selectedScene, 
  selectedElement,
  onSceneSelect, 
  onElementAdd,
  onElementSelect,
  showProperties,
  onToggleProperties
}: GamePreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [zoom, setZoom] = useState<number | 'auto'>('auto');
  const [gameInstance, setGameInstance] = useState<any>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [rulerHoverX, setRulerHoverX] = useState<number | null>(null);
  const [showRulers, setShowRulers] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(false);
  // Persisted UI toggles
  useEffect(() => {
    try {
      const s = localStorage.getItem('scenie.showRulers');
      if (s !== null) setShowRulers(s === 'true');
      const g = localStorage.getItem('scenie.showGrid');
      if (g !== null) setShowGrid(g === 'true');
    } catch (e) {
      // ignore (SSR or storage blocked)
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('scenie.showRulers', showRulers ? 'true' : 'false');
    } catch (e) {}
  }, [showRulers]);

  useEffect(() => {
    try {
      localStorage.setItem('scenie.showGrid', showGrid ? 'true' : 'false');
    } catch (e) {}
  }, [showGrid]);
  const [autoZoom, setAutoZoom] = useState<number>(100);
  const containerRef = useRef<HTMLDivElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const topRulerRef = useRef<HTMLDivElement>(null);
  const bottomRulerRef = useRef<HTMLDivElement>(null);

  const gameConfig = useEditorStore(state => state.validatedGameConfig);

  const deviceSizes = {
    mobile: { width: 375, height: 667 },
    tablet: { width: 768, height: 1024 },
    desktop: { width: 1024, height: 768 }
  };

  const currentDevice = deviceSizes[deviceType];

  // Calculate auto zoom to fit device in available space
  const calculateAutoZoom = () => {
    if (!previewContainerRef.current) return 100;
    
    const container = previewContainerRef.current;
    const containerRect = container.getBoundingClientRect();
    
    // Available space accounts for padding (p-4 = 16px on each side)
    const availableWidth = containerRect.width - 32; // 16px padding on each side
    let availableHeight = containerRect.height - 32; // 16px padding on each side

    // If rulers are visible, subtract their heights (including margins) from available height
    if (showRulers) {
      const measureWithMargins = (el: HTMLDivElement | null) => {
        if (!el) return 0;
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        const marginTop = parseFloat(style.marginTop || '0');
        const marginBottom = parseFloat(style.marginBottom || '0');
        return rect.height + marginTop + marginBottom;
      };

      availableHeight -= measureWithMargins(topRulerRef.current as HTMLDivElement);
      availableHeight -= measureWithMargins(bottomRulerRef.current as HTMLDivElement);
    }
    
    const widthRatio = availableWidth / currentDevice.width;
    const heightRatio = availableHeight / currentDevice.height;
    
    // Use the smaller ratio to ensure the device fits completely
    const autoZoom = Math.min(widthRatio, heightRatio) * 100;
    
    // Clamp between 10% and 200% to prevent extreme zooming
    return Math.max(10, Math.min(200, autoZoom));
  };

  // Get the effective zoom value (use precomputed autoZoom when in 'auto')
  const effectiveZoom = zoom === 'auto' ? autoZoom : zoom;

  // Recalculate auto zoom when relevant dependencies change (wait a frame so DOM updates render first)
  useEffect(() => {
    if (zoom !== 'auto') return;

    let raf = 0;
    const recalc = () => {
      try {
        const z = calculateAutoZoom();
        setAutoZoom(z);
      } catch (e) {
        // ignore
      }
    };

    // Wait for layout to reflect any recent DOM changes (like toggling rulers)
    raf = requestAnimationFrame(() => {
      // do another frame in case elements are still being inserted
      requestAnimationFrame(recalc);
    });

    const onResize = () => {
      // debounce with rAF
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(recalc);
    };

    window.addEventListener('resize', onResize);
    // initial recalc
    recalc();

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }, [zoom, showRulers, deviceType, previewContainerRef.current, topRulerRef.current, bottomRulerRef.current]);

  // Load and initialize Scenie game
  useEffect(() => {
    if (!gameConfig || !containerRef.current || !gameConfig.scenes || gameConfig.scenes.length === 0) {
      return;
    }

    const loadAndInitGame = async () => {
      try {
        // Clean up previous game instance
        if (gameInstance) {
          try {
            if (typeof gameInstance.destroy === 'function') {
              gameInstance.destroy();
            }
          } catch (cleanupError) {
            console.warn('GamePreview: Error cleaning up previous game instance:', cleanupError);
          }
          setGameInstance(null);
        }

        // Clear previous game container
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
        }

        // Load Scenie styles if not already loaded
        if (!document.querySelector('link[data-scenie-styles]')) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = '/styles.css';
          link.setAttribute('data-scenie-styles', 'true');
          document.head.appendChild(link);
        }

        // Load Scenie core if not already loaded
        if (!(window as any).Game) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = '/core.js';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load Scenie core'));
            document.head.appendChild(script);
          });
        }

        // Create game container
        const gameContainer = document.createElement('div');
        gameContainer.id = 'game-container';
        gameContainer.style.width = '100%';
        gameContainer.style.height = '100%';
        gameContainer.style.position = 'relative';
        gameContainer.style.overflow = 'hidden';

        if (containerRef.current) {
          containerRef.current.appendChild(gameContainer);
        }

        // Initialize Scenie game
        let game: any = null;
        try {
          if (!gameConfig) {
            console.warn('GamePreview: gameConfig is null, skipping Game instantiation');
            return;
          }
          game = new (window as any).Game(gameConfig);
          setGameInstance(game);
        } catch (error) {
          console.error('GamePreview: Error creating Game instance:', error);
          return;
        }

        // Add element selection handlers after a short delay to ensure DOM is ready
        setTimeout(() => {
          if (game) {
            setupElementSelection(game);
          }
        }, 200);

        // Navigate to selected scene if specified
        if (selectedScene) {
          setTimeout(() => {
            if (game && typeof game.switchScene === 'function') {
              game.switchScene(selectedScene);
            }
          }, 100);
        }

      } catch (error) {
        console.error('Failed to initialize game:', error);
        if (containerRef.current) {
          containerRef.current.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: red;">
              <div style="text-align: center;">
                <h3>Error Loading Game</h3>
                <p>${error instanceof Error ? error.message : 'Unknown error'}</p>
              </div>
            </div>
          `;
        }
      }
    };

    loadAndInitGame();

    // Cleanup function
    return () => {
      if (gameInstance) {
        // Clean up game instance if needed
        setGameInstance(null);
      }
    };
  }, [gameConfig]);

  // Switch scene when selectedScene changes
  useEffect(() => {
    if (gameInstance && selectedScene && typeof gameInstance.switchScene === 'function') {
      gameInstance.switchScene(selectedScene);
      // Re-setup element selection after scene change
      setTimeout(() => {
        setupElementSelection(gameInstance);
      }, 200);
    }
  }, [selectedScene, gameInstance]);

  // Update visual selection feedback when selectedElement changes
  useEffect(() => {
    updateElementSelectionVisual(selectedElement);
  }, [selectedElement]);

  const setupElementSelection = (game: any) => {
    if (!game) return;

    // Find all game elements and add selection handlers
    const gameElements = document.querySelectorAll('.game-element');
    gameElements.forEach((element) => {
      const el = element as HTMLElement;
      
      // Remove existing selection handlers to avoid duplicates
      el.removeEventListener('click', handleElementClick);
      el.removeEventListener('mouseenter', handleElementMouseEnter);
      el.removeEventListener('mouseleave', handleElementMouseLeave);
      
      // Add selection handler
      el.addEventListener('click', handleElementClick);
      
      // Add hover effects for better discoverability
      el.addEventListener('mouseenter', handleElementMouseEnter);
      el.addEventListener('mouseleave', handleElementMouseLeave);
      
      // Add visual selection styling
      el.style.transition = el.style.transition ? el.style.transition + ', box-shadow 0.2s ease, border 0.2s ease' : 'box-shadow 0.2s ease, border 0.2s ease';
      el.style.cursor = 'pointer';
    });

    // Add click handler to deselect when clicking on empty space
    const gameContainer = document.getElementById('game-container');
    if (gameContainer) {
      gameContainer.addEventListener('click', (e) => {
        // Only deselect if clicking on the container itself, not on elements
        if (e.target === gameContainer) {
          onElementSelect(null);
        }
      });
    }
  };

  const handleElementClick = (e: Event) => {
    e.stopPropagation(); // Prevent container click
    const element = e.target as HTMLElement;
    const elementId = element.id;
    
    if (elementId) {
      onElementSelect(elementId);
    }
  };

  const handleElementMouseEnter = (e: Event) => {
    const element = e.target as HTMLElement;
    if (element.id !== selectedElement) {
      element.style.boxShadow = '0 0 0 2px #94a3b8, 0 0 0 4px rgba(148, 163, 184, 0.2)';
      element.style.border = '1px solid #94a3b8';
    }
  };

  const handleElementMouseLeave = (e: Event) => {
    const element = e.target as HTMLElement;
    if (element.id !== selectedElement) {
      element.style.boxShadow = '';
      element.style.border = '';
    }
  };

  const updateElementSelectionVisual = (selectedElementId: string | null) => {
    // Remove selection styling from all elements
    const gameElements = document.querySelectorAll('.game-element');
    gameElements.forEach((element) => {
      const el = element as HTMLElement;
      el.style.boxShadow = '';
      el.style.outline = '';
      el.style.border = '';
    });

    // Add selection styling to selected element
    if (selectedElementId) {
      const selectedEl = document.getElementById(selectedElementId);
      if (selectedEl) {
        selectedEl.style.boxShadow = '0 0 0 3px #3b82f6, 0 0 0 6px rgba(59, 130, 246, 0.3)';
        selectedEl.style.outline = '2px solid #ffffff';
        selectedEl.style.border = '2px solid #3b82f6';
        selectedEl.style.borderRadius = '4px';
      }
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 relative">
      {/* Fixed Toolbar Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <h2 className="font-semibold text-gray-900">Preview</h2>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Scene:</span>
                <div className="relative">
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-500 z-20">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  <select
                    value={selectedScene || ''}
                    onChange={(e) => onSceneSelect(e.target.value)}
                    className="text-sm text-gray-900 bg-transparent border-none focus:outline-none focus:ring-0 cursor-pointer relative z-10 appearance-none pl-6"
                    style={{
                      WebkitAppearance: 'none',
                      MozAppearance: 'none'
                    }}
                  >
                    {gameConfig?.scenes?.map((scene) => (
                      <option key={scene.name} value={scene.name}>
                        {scene.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {selectedScene && gameConfig?.scenes?.find(scene => scene.name === selectedScene)?.initial && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Initial
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Device Switcher */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setDeviceType('mobile')}
                className={`p-2 rounded ${deviceType === 'mobile' ? 'bg-white shadow' : ''}`}
              >
                <Smartphone className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDeviceType('tablet')}
                className={`p-2 rounded ${deviceType === 'tablet' ? 'bg-white shadow' : ''}`}
              >
                <Tablet className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDeviceType('desktop')}
                className={`p-2 rounded ${deviceType === 'desktop' ? 'bg-white shadow' : ''}`}
              >
                <Monitor className="w-4 h-4" />
              </button>
            </div>

            {/* Zoom */}
            <select
              value={zoom}
              onChange={(e) => {
                const value = e.target.value;
                setZoom(value === 'auto' ? 'auto' : Number(value));
              }}
              className="px-3 py-1 border border-gray-300 rounded text-sm"
            >
              <option value="auto">Auto</option>
              <option value={50}>50%</option>
              <option value={75}>75%</option>
              <option value={100}>100%</option>
              <option value={125}>125%</option>
              <option value={150}>150%</option>
            </select>

            {/* Controls */}
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>

            <button
              onClick={() => window.location.reload()}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
              title="Refresh"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={onToggleProperties}
              className={`p-2 rounded ${showProperties ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'}`}
              title="Toggle Properties Panel"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Ruler Toggle */}
            <button
              onClick={() => setShowRulers(s => !s)}
              className={`p-2 rounded ${showRulers ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'}`}
              title="Toggle Rulers"
            >
              <Ruler className="w-4 h-4" />
            </button>

            {/* Grid Toggle */}
            <button
              onClick={() => setShowGrid(s => !s)}
              className={`p-2 rounded ${showGrid ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'}`}
              title="Toggle Grid"
            >
              {/* Simple grid SVG */}
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M8 3v18M16 3v18M3 8h18M3 16h18" />
              </svg>
            </button>

            <button
              onClick={() => setShowDebugPanel(true)}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
              title="Debug Panel"
            >
              <Bug className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Game Preview Area - Takes space between header and footer */}
      <div
        ref={previewContainerRef}
        className="absolute top-20 bottom-4 left-0 right-0 flex flex-col items-center justify-start p-4 overflow-auto"
      >
        {/* Top Ruler */}
        {showRulers && (
          <div 
            ref={topRulerRef}
            className="flex items-center mb-2 mt-2" 
            style={{ width: `${(currentDevice.width * effectiveZoom) / 100}px` }}
          >
          <div className="flex-1 h-px bg-gray-400 relative">
            <div className="absolute left-0 top-0 w-full h-full">
              {Array.from({ length: Math.ceil(currentDevice.width / 20) + 1 }, (_, i) => {
                const position = Math.min(i * 20, currentDevice.width);
                const isMajorMark = position % 100 === 0;
                const isLastMark = position === currentDevice.width;
                const shouldShowNumber = (isMajorMark || isLastMark) && (isLastMark || position <= currentDevice.width - 40);
                return (
                  <div key={i} className={`absolute top-0 border-l ${isMajorMark ? 'h-3 border-gray-600' : 'h-2 border-gray-500'}`} style={{ left: `${(position * effectiveZoom) / 100}px` }}>
                    {shouldShowNumber && (
                      <span className="absolute -top-5 left-0 text-xs text-gray-600 transform -translate-x-1/2">
                        {position}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            {/* Transparent overlay to capture hover across the entire ruler (expanded hit area) */}
            <div
              className="absolute left-0 -top-6 w-full h-8 z-20 bg-transparent"
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setRulerHoverX(e.clientX - rect.left);
              }}
              onMouseLeave={() => setRulerHoverX(null)}
            />
          </div>
        </div>
        )}

        {/* GamePreview with Rulers Wrapper */}
        <div className="relative inline-block">
          {/* Grid overlay */}
          {showGrid && (
            <>
              {/* Vertical grid: 25%, 33.333% (dashed), 50%, 66.666% (dashed), 75% */}
              <div className="absolute top-0 bottom-0 left-1/4 w-px bg-blue-300 opacity-70 z-10 pointer-events-none" style={{ left: '25%' }} />
              <div className="absolute top-0 bottom-0 z-10 pointer-events-none" style={{ left: '33.333333%', borderLeft: '1px dashed rgba(59,130,246,0.7)', position: 'absolute', top: 0, bottom: 0 }} />
              <div className="absolute top-0 bottom-0 left-1/2 w-px bg-blue-300 opacity-70 z-10 pointer-events-none" style={{ left: '50%' }} />
              <div className="absolute top-0 bottom-0 z-10 pointer-events-none" style={{ left: '66.666667%', borderLeft: '1px dashed rgba(59,130,246,0.7)', position: 'absolute', top: 0, bottom: 0 }} />
              <div className="absolute top-0 bottom-0 left-3/4 w-px bg-blue-300 opacity-70 z-10 pointer-events-none" style={{ left: '75%' }} />

              {/* Horizontal grid: 25%, 33.333% (dashed), 50%, 66.666% (dashed), 75% */}
              <div className="absolute left-0 right-0 top-1/4 h-px bg-blue-300 opacity-70 z-10 pointer-events-none" style={{ top: '25%' }} />
              <div className="absolute left-0 right-0 z-10 pointer-events-none" style={{ top: '33.333333%', borderTop: '1px dashed rgba(59,130,246,0.7)', position: 'absolute', left: 0, right: 0 }} />
              <div className="absolute left-0 right-0 top-1/2 h-px bg-blue-300 opacity-70 z-10 pointer-events-none" style={{ top: '50%' }} />
              <div className="absolute left-0 right-0 z-10 pointer-events-none" style={{ top: '66.666667%', borderTop: '1px dashed rgba(59,130,246,0.7)', position: 'absolute', left: 0, right: 0 }} />
              <div className="absolute left-0 right-0 top-3/4 h-px bg-blue-300 opacity-70 z-10 pointer-events-none" style={{ top: '75%' }} />
            </>
          )}

          {/* Ruler Hover Line */}
          {showRulers && rulerHoverX !== null && (
            <div
              className="absolute top-0 bottom-0 w-px bg-blue-500 z-10 pointer-events-none"
              style={{ left: `${rulerHoverX}px` }}
            />
          )}

          <div
            className="bg-white border-2 border-gray-200 rounded-lg shadow-lg overflow-hidden transition-all duration-200 ease-in-out"
            style={{
              width: `${(currentDevice.width * effectiveZoom) / 100}px`,
              height: `${(currentDevice.height * effectiveZoom) / 100}px`
            }}
          >
          <div
            ref={containerRef}
            className={`w-full h-full relative transition-colors ${
              isDragOver ? 'bg-blue-50 border-2 border-blue-300 border-dashed' : ''
            }`}
            style={{ backgroundColor: isDragOver ? '#eff6ff' : '#f3f4f6' }}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'copy';
              setIsDragOver(true);
            }}
            onDragLeave={(e) => {
              // Only set drag over to false if we're actually leaving the element
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setIsDragOver(false);
              }
            }}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOver(false);
              try {
                const data = JSON.parse(e.dataTransfer.getData('application/json'));
                if (data.type === 'element') {
                  // Calculate position relative to the container
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = ((e.clientX - rect.left) / rect.width) * 100;
                  const y = ((e.clientY - rect.top) / rect.height) * 100;
                  
                  onElementAdd(data.elementType, { x: Math.round(x), y: Math.round(y) });
                }
              } catch (error) {
                console.error('Failed to parse drop data:', error);
              }
            }}
          >
            {/* Drag overlay */}
            {isDragOver && (
              <div className="absolute inset-0 bg-blue-500 bg-opacity-10 border-2 border-blue-500 border-dashed rounded-lg flex items-center justify-center z-10">
                <div className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Drop element here
                  </div>
                </div>
              </div>
            )}

            {/* Scenie game will be rendered here */}
            {!gameConfig && (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <Monitor className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No game loaded</p>
                  <p className="text-sm mt-2">Create a game to see the preview</p>
                </div>
              </div>
            )}
          </div>
        </div>

        </div>

        {/* Bottom Ruler */}
        {showRulers && (
          <div 
            ref={bottomRulerRef}
            className="flex items-center mt-2" 
            style={{ width: `${(currentDevice.width * effectiveZoom) / 100}px` }}
          >
          <div className="flex-1 h-px bg-gray-400 relative">
            <div className="absolute left-0 bottom-0 w-full h-full">
              {Array.from({ length: Math.ceil(currentDevice.width / 20) + 1 }, (_, i) => {
                const position = Math.min(i * 20, currentDevice.width);
                const isMajorMark = position % 100 === 0;
                const isLastMark = position === currentDevice.width;
                const shouldShowNumber = (isMajorMark || isLastMark) && (isLastMark || position <= currentDevice.width - 40);
                return (
                  <div key={i} className={`absolute bottom-0 border-l ${isMajorMark ? 'h-3 border-gray-600' : 'h-2 border-gray-500'}`} style={{ left: `${(position * effectiveZoom) / 100}px` }}>
                    {shouldShowNumber && (
                      <span className="absolute -bottom-5 left-0 text-xs text-gray-600 transform -translate-x-1/2">
                        {position}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            {/* Transparent overlay to capture hover across the entire ruler (expanded hit area) */}
            <div
              className="absolute left-0 -bottom-6 w-full h-8 z-20 bg-transparent"
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setRulerHoverX(e.clientX - rect.left);
              }}
              onMouseLeave={() => setRulerHoverX(null)}
            />
          </div>
        </div>
        )}
      </div>

      {/* Debug Panel Overlay */}
      {showDebugPanel && (
        <div className="absolute inset-0 z-50 flex items-end pointer-events-none">
          <div className="w-full bg-white border-t border-gray-200 shadow-lg transform transition-transform duration-300 ease-in-out pointer-events-auto">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900">Debug Panel</h3>
              <button
                onClick={() => setShowDebugPanel(false)}
                className="text-gray-400 hover:text-gray-600 pointer-events-auto"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto">
              <div className="text-xs text-gray-600 space-y-2">
                <div><strong>Selected Scene:</strong> {selectedScene || 'None'}</div>
                <div><strong>Selected Element:</strong> {selectedElement || 'None'}</div>
                <div><strong>Device:</strong> {deviceType}</div>
                <div><strong>Zoom:</strong> {zoom === 'auto' ? `Auto (${effectiveZoom.toFixed(1)}%)` : `${zoom}%`}</div>
                <div><strong>Is Playing:</strong> {isPlaying ? 'Yes' : 'No'}</div>
                <div><strong>Game Instance:</strong> {gameInstance ? 'Loaded' : 'Not loaded'}</div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}