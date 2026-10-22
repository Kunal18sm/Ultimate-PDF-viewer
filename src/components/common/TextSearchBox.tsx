import React, { useEffect, useRef } from 'react';
import { usePDF } from '../../context/PDFContext';
import { Search, ChevronUp, ChevronDown, X, Loader2 } from 'lucide-react';

interface TextSearchBoxProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TextSearchBox: React.FC<TextSearchBoxProps> = ({ isOpen, onClose }) => {
  const { 
    searchQuery, 
    setSearchQuery, 
    performSearch, 
    searchResults, 
    currentSearchMatchIndex, 
    nextSearchMatch, 
    prevSearchMatch, 
    clearSearch,
    isSearching,
    isFullscreen,
  } = usePDF();

  const inputRef = useRef<HTMLInputElement>(null);
  const searchDebounceRef = useRef<any>(null);
  const lastSubmittedQueryRef = useRef('');

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

      if (e.shiftKey) {
        if (searchResults.length > 0) {
          prevSearchMatch();
        } else {
          performSearch(searchQuery);
        }
      } else {
        if (searchQuery.trim() !== lastSubmittedQueryRef.current.trim() || searchResults.length === 0) {
          lastSubmittedQueryRef.current = searchQuery;
          performSearch(searchQuery);
        } else {
          nextSearchMatch();
        }
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

    if (!val.trim()) {
      lastSubmittedQueryRef.current = '';
      clearSearch();
    } else {
      searchDebounceRef.current = setTimeout(() => {
        lastSubmittedQueryRef.current = val;
        performSearch(val);
      }, 200);
    }
  };

  return (
    <div
      className={`fixed top-3 sm:top-4 z-50 bg-slate-900/98 border border-slate-700/80 rounded-2xl shadow-2xl p-1.5 sm:p-2 flex items-center justify-between gap-1.5 sm:gap-2 backdrop-blur-xl animate-in slide-in-from-top-2 duration-150 max-w-[calc(100vw-1.5rem)] ${
        isFullscreen ? 'right-3 sm:right-36 md:right-40' : 'right-3 sm:right-6'
      }`}
    >
      <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1.5 bg-slate-800/80 rounded-xl border border-slate-700/50 flex-1 min-w-0">
        {isSearching ? (
          <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin shrink-0" />
        ) : (
          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        )}
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          onKeyDown={handleKeyDown}
          placeholder="Find text..."
          className="bg-transparent border-0 text-xs text-white placeholder-slate-500 focus:outline-hidden w-full min-w-0"
        />
        {searchQuery && (
          <button
            onClick={clearSearch}
            className="text-slate-500 hover:text-slate-300 p-0.5 cursor-pointer shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Counter */}
      {searchResults.length > 0 ? (
        <span className="text-[11px] font-mono text-slate-300 px-1 whitespace-nowrap">
          {currentSearchMatchIndex + 1} of {searchResults.length}
        </span>
      ) : searchQuery.trim() && !isSearching ? (
        <span className="text-[11px] text-slate-400 px-1 whitespace-nowrap">
          No matches
        </span>
      ) : null}

      {/* Navigation arrows */}
      <div className="flex items-center gap-0.5 border-l border-slate-800 pl-1.5">
        <button
          onClick={prevSearchMatch}
          disabled={searchResults.length === 0}
          className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
          title="Previous Match (Shift+Enter)"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
        <button
          onClick={nextSearchMatch}
          disabled={searchResults.length === 0}
          className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
          title="Next Match (Enter)"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      <button
        onClick={() => {
          clearSearch();
          onClose();
        }}
        className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer ml-1"
        title="Close Search"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
