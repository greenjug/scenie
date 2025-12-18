import { useState } from 'react';
import { Search, Image, Type, Square, Play, HelpCircle, FileText } from 'lucide-react';

interface ElementType {
  type: string;
  label: string;
  icon: React.ReactNode;
  category: string;
  description: string;
}

const elementTypes: ElementType[] = [
  // Layout
  { type: 'container', label: 'Container', icon: <Square className="w-4 h-4" />, category: 'Layout', description: 'Group elements together' },
  // Media
  { type: 'picture', label: 'Picture', icon: <Image className="w-4 h-4" />, category: 'Media', description: 'Display images and graphics' },
  // Interactive
  { type: 'slider', label: 'Slider', icon: <Play className="w-4 h-4" />, category: 'Interactive', description: 'Swipe through content slides' },
  { type: 'quiz', label: 'Quiz', icon: <HelpCircle className="w-4 h-4" />, category: 'Interactive', description: 'Interactive quiz questions' },
  // Other
  { type: 'exploration', label: 'Exploration', icon: <FileText className="w-4 h-4" />, category: 'Interactive', description: 'Interactive exploration areas' },
];

const categories = ['All', 'Layout', 'Media', 'Interactive'];

interface ElementPaletteProps {
  onElementAdd: (elementType: string) => void;
}

export function ElementPalette({ onElementAdd }: ElementPaletteProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isDragging, setIsDragging] = useState(false);

  const filteredElements = elementTypes.filter(element => {
    const matchesSearch = element.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         element.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || element.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="font-semibold text-gray-900 mb-3">Elements</h2>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search elements..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex gap-1 overflow-x-auto">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1 text-xs rounded-full whitespace-nowrap ${
                selectedCategory === category
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Element Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 gap-3">
          {filteredElements.map((element) => (
            <div
              key={element.type}
              className="group relative"
            >
              <button
                draggable
                onDragStart={(e) => {
                  setIsDragging(true);
                  e.dataTransfer.setData('application/json', JSON.stringify({
                    type: 'element',
                    elementType: element.type
                  }));
                  e.dataTransfer.effectAllowed = 'copy';
                }}
                onDragEnd={() => {
                  setIsDragging(false);
                }}
                onClick={() => onElementAdd(element.type)}
                className={`w-full p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left cursor-grab active:cursor-grabbing ${
                  isDragging ? 'opacity-50 scale-95' : ''
                }`}
                title={element.description}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-blue-100 transition-colors">
                    {element.icon}
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium text-gray-900">
                      {element.label}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {element.category}
                    </div>
                  </div>
                </div>
              </button>

              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                {element.description}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>
          ))}
        </div>

        {filteredElements.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No elements found</p>
            <p className="text-xs mt-1">Try adjusting your search or category</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">
          Drag elements to add them to your scene
        </div>
      </div>
    </div>
  );
}