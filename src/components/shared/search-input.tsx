'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useCallback } from 'react';

interface SearchInputProps {
  placeholder?: string;
  paramName?: string;
  className?: string;
}

export function SearchInput({ 
  placeholder = "Buscar...", 
  paramName = "query",
  className = ""
}: SearchInputProps) {
  const searchParams = useSearchParams();
  const { replace } = useRouter();
  const pathname = usePathname();

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set(paramName, term);
    } else {
      params.delete(paramName);
    }
    replace(`${pathname}?${params.toString()}`);
  }, 300);

  const getValue = useCallback(() => {
    return searchParams.get(paramName)?.toString() || "";
  }, [searchParams, paramName]);

  return (
    <div className={`relative flex-1 group ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
      <Input
        type="search"
        placeholder={placeholder}
        className="w-full h-10 rounded-xl bg-secondary/30 border-white/5 pl-10 focus-visible:ring-1 focus-visible:ring-primary/30 transition-all font-medium placeholder:font-normal placeholder:italic text-sm"
        onChange={(e) => handleSearch(e.target.value)}
        defaultValue={getValue()}
      />
    </div>
  );
}
