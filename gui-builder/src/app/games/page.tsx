import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Settings, Share, Trash2, User, Package, Target } from "lucide-react";

export default async function GamesPage() {
  const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const isClerkConfigured = clerkPublishableKey && clerkPublishableKey !== 'your_clerk_publishable_key';

  let userId = null;

  if (isClerkConfigured) {
    try {
      const authResult = await auth();
      userId = authResult.userId;

      if (!userId) {
        redirect("/sign-in");
      }
    } catch (error) {
      // Clerk not properly configured, continue without authentication
      console.warn("Clerk authentication failed, continuing without auth");
    }
  }

  // Mock data - will be replaced with real data from Supabase
  const games = [
    {
      id: "1",
      title: "Parliament Learning Module",
      client: "Government Education Dept",
      product: "Civics Education",
      campaign: "Parliament 101",
      description: "Interactive quiz about parliamentary procedures and democratic processes. Covers voting systems, legislative roles, and government structure.",
      thumbnail: "/api/placeholder/300/200",
      lastModified: "2 hours ago",
      status: "published",
      role: "owner"
    },
    {
      id: "2",
      title: "Math Adventure",
      client: "ABC Learning",
      product: "Mathematics",
      campaign: "Grade 5 Challenge",
      description: "Fun math challenges for kids covering multiplication, division, fractions, and basic geometry. Designed for 5th grade students.",
      thumbnail: "/api/placeholder/300/200",
      lastModified: "1 day ago",
      status: "draft",
      role: "editor"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Scenie</h1>
            <Link
              href="/games/new"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Game
            </Link>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="bg-gray-50">
        <div className="container mx-auto px-4 py-3">
          <nav className="text-sm text-gray-600">
            <span className="font-medium text-gray-900">My Games</span>
          </nav>
        </div>
      </div>

      {/* Games Grid */}
      <main className="container mx-auto px-4 py-8">
        {games.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Plus className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No games yet</h3>
            <p className="text-gray-600 mb-4">Create your first interactive game</p>
            <Link
              href="/games/new"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
            >
              Create Game
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {games.map((game) => (
              <div
                key={game.id}
                className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow"
              >
                <div className="flex h-64">
                  {/* Thumbnail - Left side */}
                  <div className="w-2/5 relative overflow-hidden rounded-l-lg">
                    <div className="aspect-[9/16] bg-gray-200 relative h-full">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                        {/* Status Badge */}
                        <div className="absolute top-2 right-2">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              game.status === 'published'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {game.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Content - Right side */}
                  <div className="w-3/5 p-4 flex flex-col">
                    <h3 className="font-semibold text-gray-900 mb-2 truncate">
                      {game.title}
                    </h3>
                    
                    <div className="space-y-1 mb-3 flex-1">
                      <div className="flex items-center text-sm">
                        <User className="w-4 h-4 text-gray-500 mr-2 flex-shrink-0" />
                        <span className="text-gray-900 truncate">{game.client}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Package className="w-4 h-4 text-gray-500 mr-2 flex-shrink-0" />
                        <span className="text-gray-900 truncate">{game.product}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Target className="w-4 h-4 text-gray-500 mr-2 flex-shrink-0" />
                        <span className="text-gray-900 truncate">{game.campaign}</span>
                      </div>
                    </div>

                    <div className="mb-3 flex-1">
                      <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
                        {game.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                      <span>Modified {game.lastModified}</span>
                      <span className="capitalize">{game.role}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between">
                      <Link
                        href={`/games/${game.id}/edit`}
                        className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-blue-700 transition-colors flex-1 mr-2 text-center relative z-10 pointer-events-auto"
                      >
                        Edit
                      </Link>
                      <div className="flex items-center gap-1">
                        <button className="p-1 text-gray-400 hover:text-gray-600">
                          <Share className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-gray-600">
                          <Settings className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}