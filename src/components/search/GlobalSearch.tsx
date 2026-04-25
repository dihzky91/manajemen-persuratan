"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Filter, X, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { globalSearch, getSearchSuggestions, type SearchFilters, type SearchResult } from "@/server/actions/search";
import { jenisSuratEnum } from "@/server/db/schema";
import { formatTanggalWaktuJakarta } from "@/lib/utils";

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<SearchFilters>({});
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const jenisSuratOptions = jenisSuratEnum.enumValues;

  const performSearch = useCallback(async () => {
    if (!query.trim() && !filters.jenisSurat && !filters.status) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const searchResults = await globalSearch({
        ...filters,
        query: query.trim() || undefined,
      }, 20);
      setResults(searchResults);
    } finally {
      setLoading(false);
    }
  }, [query, filters]);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      performSearch();
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [performSearch]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.length >= 2) {
        const data = await getSearchSuggestions(query);
        setSuggestions(data);
      } else {
        setSuggestions([]);
      }
    };

    fetchSuggestions();
  }, [query]);

  const handleResultClick = (result: SearchResult) => {
    router.push(result.url);
    onOpenChange(false);
    setQuery("");
    setResults([]);
  };

  const getTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      surat_keluar: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      surat_masuk: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      disposisi: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
    };
    return styles[type] || "bg-gray-100 text-gray-800";
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      surat_keluar: "Surat Keluar",
      surat_masuk: "Surat Masuk",
      disposisi: "Disposisi",
    };
    return labels[type] || type;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0">
        <DialogHeader className="px-4 pt-4 pb-0">
          <DialogTitle className="sr-only">Pencarian Global</DialogTitle>
        </DialogHeader>

        <div className="p-4 space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari surat, disposisi, atau perihal..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 pr-10"
              autoFocus
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>

          {/* Filters Toggle */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? "bg-muted" : ""}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            {(filters.jenisSurat || filters.status) && (
              <Badge variant="secondary">
                {Object.keys(filters).filter(k => filters[k as keyof SearchFilters]).length} filter aktif
              </Badge>
            )}
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="grid grid-cols-2 gap-3 p-3 bg-muted/50 rounded-lg">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Jenis Surat</label>
                <Select
                  value={filters.jenisSurat || "all"}
                  onValueChange={(v) => setFilters(f => ({ ...f, jenisSurat: v === "all" ? undefined : v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Semua jenis" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua jenis</SelectItem>
                    {jenisSuratOptions.map((jenis) => (
                      <SelectItem key={jenis} value={jenis}>
                        {jenis.charAt(0).toUpperCase() + jenis.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Status</label>
                <Select
                  value={filters.status || "all"}
                  onValueChange={(v) => setFilters(f => ({ ...f, status: v === "all" ? undefined : v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Semua status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="diterima">Diterima</SelectItem>
                    <SelectItem value="diproses">Diproses</SelectItem>
                    <SelectItem value="selesai">Selesai</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Results */}
          <ScrollArea className="h-72">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : results.length > 0 ? (
              <div className="space-y-2">
                {results.map((result) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleResultClick(result)}
                    className="w-full text-left p-3 rounded-lg hover:bg-muted transition-colors border border-transparent hover:border-border"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={getTypeBadge(result.type)} variant="secondary">
                            {getTypeLabel(result.type)}
                          </Badge>
                          {result.status && (
                            <span className="text-xs text-muted-foreground">{result.status}</span>
                          )}
                        </div>
                        <p className="font-medium text-sm truncate">{result.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                      </div>
                      {result.date && (
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatTanggalWaktuJakarta(result.date)}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : query ? (
              <div className="text-center py-8 text-muted-foreground">
                Tidak ada hasil untuk &quot;{query}&quot;
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Ketik untuk mencari surat, disposisi, atau perihal</p>
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
