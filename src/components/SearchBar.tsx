'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
import Image from 'next/image';

type Result = {
  id: string;
  name: string;
  category: string;
  location_name: string;
  city: string;
  logo_url: string | null;
  slug: string;
  type: 'store' | 'restaurant';
};

interface Props {
  variant?: 'mobile' | 'desktop-inline';
  onClose?: () => void;
}

export function SearchBar({ variant = 'mobile', onClose }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const router = useRouter();

  // Derived — avoids synchronous setState in effect body
  const trimmed = query.trim();
  const showResults = isOpen && trimmed.length >= 2 && results.length > 0;
  const showEmpty =
    isOpen && trimmed.length >= 2 && results.length === 0 && !loading;

  useEffect(() => {
    if (variant === 'desktop-inline') inputRef.current?.focus();
  }, [variant]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (trimmed.length < 2) return;
    debounceRef.current = setTimeout(async () => {
      setResults([]);
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          setResults(await res.json());
          setIsOpen(true);
        }
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [trimmed]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        if (variant === 'desktop-inline') onClose?.();
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [variant, onClose]);

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      setIsOpen(false);
      onClose?.();
    }
  }

  function clear() {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  }

  function handleSelect(result: Result) {
    const slug = result.slug || result.id;
    const path =
      result.type === 'restaurant' ? `/dining/${slug}` : `/stores/${slug}`;
    setQuery('');
    setResults([]);
    setIsOpen(false);
    onClose?.();
    router.push(path);
  }

  function renderItem(r: Result) {
    return (
      <li
        key={r.id}
        className='border-b border-gray-50 last:border-0'
      >
        <button
          type='button'
          onClick={() => handleSelect(r)}
          className='flex items-center gap-3 w-full px-4 py-3 hover:bg-gray-50 text-left transition-colors'
        >
          <div className='w-9 h-9 rounded-full bg-gray-100 shrink-0 overflow-hidden'>
            {r.logo_url && (
              <Image
                src={r.logo_url}
                alt=''
                width={36}
                height={36}
                className='object-cover w-full h-full'
              />
            )}
          </div>
          <div className='min-w-0 flex-1'>
            <p className='text-[13px] font-semibold text-gray-900 truncate'>
              {r.name}
            </p>
            <p className='text-[11px] text-gray-400 truncate'>
              {r.category} · {r.location_name}, {r.city}
            </p>
          </div>
        </button>
      </li>
    );
  }

  const stores = results.filter((r) => r.type === 'store');
  const restaurants = results.filter((r) => r.type === 'restaurant');

  if (variant === 'desktop-inline') {
    return (
      <div
        ref={containerRef}
        className='flex flex-1 items-center gap-2 relative border border-gray-200 rounded-full px-3 h-9 bg-white'
      >
        <Search
          className='w-4 h-4 text-gray-400 shrink-0'
          aria-hidden='true'
        />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKey}
          placeholder='Search stores, categories, locations…'
          className='flex-1 text-[14px] text-gray-900 placeholder-gray-400 outline-none bg-transparent'
          autoComplete='off'
          aria-label='Search'
        />
        <button
          type='button'
          aria-label='Close search'
          onClick={onClose}
          className='p-1 rounded-full hover:bg-gray-100 shrink-0'
        >
          <X className='w-4 h-4 text-gray-400' />
        </button>

        {showResults && (
          <div className='fixed left-0 right-0 top-16 z-40 bg-white border-t border-gray-100 shadow-lg'>
            <div className='max-w-7xl mx-auto px-6 py-3 space-y-3'>
              {stores.length > 0 && (
                <div>
                  <p className='text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1'>
                    Stores
                  </p>
                  <ul className='grid grid-cols-2 gap-x-4'>
                    {stores.map(renderItem)}
                  </ul>
                </div>
              )}
              {restaurants.length > 0 && (
                <div>
                  <p className='text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1'>
                    Restaurants
                  </p>
                  <ul className='grid grid-cols-2 gap-x-4'>
                    {restaurants.map(renderItem)}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
        {showEmpty && (
          <div className='fixed left-0 right-0 top-16 z-40 bg-white border-t border-gray-100 shadow-lg px-6 py-6 text-center'>
            <p className='text-[13px] text-gray-400'>
              No results for &quot;{query}&quot;
            </p>
          </div>
        )}
      </div>
    );
  }

  // Mobile: inline pill with absolute dropdown
  return (
    <div
      ref={containerRef}
      className='relative'
    >
      <div className='flex items-center gap-2 bg-gray-100 rounded-full px-4 h-9'>
        <Search
          className='w-3.5 h-3.5 text-gray-400 shrink-0'
          aria-hidden='true'
        />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKey}
          placeholder='Search stores, events, restaurants'
          className='flex-1 bg-transparent text-[12px] text-gray-700 placeholder-gray-400 outline-none min-w-0'
          autoComplete='off'
          aria-label='Search'
        />
        {query && (
          <button
            type='button'
            aria-label='Clear search'
            onClick={clear}
            className='shrink-0'
          >
            <X className='w-3.5 h-3.5 text-gray-400' />
          </button>
        )}
      </div>

      {showResults && (
        <div className='absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden z-50 max-h-72 overflow-y-auto overscroll-contain'>
          {stores.length > 0 && (
            <>
              <div className='px-4 pt-2.5 pb-1'>
                <span className='text-[10px] font-semibold text-gray-400 uppercase tracking-wide'>
                  Stores
                </span>
              </div>
              <ul>{stores.map(renderItem)}</ul>
            </>
          )}
          {restaurants.length > 0 && (
            <>
              <div className='px-4 pt-2.5 pb-1 border-t border-gray-50'>
                <span className='text-[10px] font-semibold text-gray-400 uppercase tracking-wide'>
                  Restaurants
                </span>
              </div>
              <ul>{restaurants.map(renderItem)}</ul>
            </>
          )}
        </div>
      )}
      {showEmpty && (
        <div className='absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden z-50 px-4 py-5 text-center'>
          <p className='text-[12px] text-gray-400'>
            No results for &quot;{query}&quot;
          </p>
        </div>
      )}
    </div>
  );
}
