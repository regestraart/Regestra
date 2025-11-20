import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { createUrl } from '../utils';
import { searchUsersAndArtworks, User, Artwork } from '../data/mock';
import { LoaderCircle } from 'lucide-react';

export default function Search() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState<{ users: User[], artworks: Artwork[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      if (query) {
        const data = await searchUsersAndArtworks(query);
        setResults(data);
      } else {
        setResults({ users: [], artworks: [] });
      }
      setLoading(false);
    };
    fetchResults();
  }, [query]);

  if (loading) return <div className="flex justify-center items-center h-96"><LoaderCircle className="w-10 h-10 text-purple-600 animate-spin" /></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
      <h1 className="text-3xl font-bold mb-8">Search Results for "{query}"</h1>

      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">Users</h2>
        {results?.users.length === 0 ? (
          <p className="text-gray-500">No users found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {results?.users.map(user => (
              <Link key={user.id} to={createUrl('/profile/:userId', { userId: user.id })} className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full object-cover" />
                <div>
                  <p className="font-bold text-gray-900">{user.name}</p>
                  <p className="text-sm text-gray-500">@{user.username}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">Artworks</h2>
        {results?.artworks.length === 0 ? (
          <p className="text-gray-500">No artworks found.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {results?.artworks.map(art => (
              <div key={art.id} className="group">
                <div className="aspect-[3/4] bg-gray-100 rounded-xl overflow-hidden mb-2">
                  <img src={art.image} alt={art.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                </div>
                <p className="font-medium text-gray-900 truncate">{art.title}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}