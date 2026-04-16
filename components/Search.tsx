
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2 } from 'lucide-react';
import { Input } from './ui/Input';
import { User, Artwork } from '../data/mock';
import { db } from '../services/db';
import { createUrl } from '../utils';

export const SearchComponent = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<{ users: User[], artworks: Artwork[] } | null>(null);
    const searchRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setSearchResults(null);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery.trim().length > 1) {
                setIsSearching(true);
                const results = await db.general.search(searchQuery);
                setSearchResults(results);
                setIsSearching(false);
            } else {
                setSearchResults(null);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleSearchResultClick = (path: string) => {
        navigate(path);
        setSearchResults(null);
        setSearchQuery('');
    };
    
    return (
        <div className="relative w-full" ref={searchRef}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
                placeholder="Search artists, artworks..."
                className="pl-10 bg-gray-50 border-0 rounded-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
            
            {(searchResults || isSearching) && searchQuery.length > 1 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-zoom-in z-50">
                    {isSearching ? (
                        <div className="p-4 text-center text-gray-500 flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" /> Searching...
                        </div>
                    ) : (
                        <>
                            {searchResults?.users && searchResults.users.length > 0 && (
                                <div className="py-2">
                                    <div className="px-4 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Artists & Users</div>
                                    {searchResults.users.map(user => (
                                        <div 
                                            key={user.id}
                                            className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center gap-3"
                                            onClick={() => handleSearchResultClick(createUrl('/profile/:username', { username: user.username }))}
                                        >
                                            <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                                                <p className="text-xs text-gray-500">@{user.username}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {searchResults?.artworks && searchResults.artworks.length > 0 && (
                                <div className="py-2 border-t border-gray-100">
                                    <div className="px-4 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Artworks</div>
                                    {searchResults.artworks.map(art => (
                                        <div 
                                            key={art.id}
                                            className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center gap-3"
                                            onClick={() => handleSearchResultClick(createUrl('/artwork/:artworkId', { artworkId: art.id }))}
                                        >
                                            <div className="w-8 h-8 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                                                <img src={art.image} alt={art.title} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="overflow-hidden">
                                                <p className="text-sm font-medium text-gray-900 truncate">{art.title}</p>
                                                <p className="text-xs text-gray-500 truncate">by {(art as any).artistName || 'Artist'}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {(searchResults?.users.length === 0 && searchResults?.artworks.length === 0) && (
                                <div className="p-4 text-center text-gray-500 text-sm">No results found</div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};
