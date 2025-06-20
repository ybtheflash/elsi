import { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, LayoutGrid, List, Archive, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface PaginationControlsProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    itemsPerPage: number;
    onItemsPerPageChange: (items: number) => void;
    totalItems: number;
    isCompactView: boolean;
    onToggleView: () => void;
    searchTerm: string;
    onSearchChange: (term: string) => void;
    showArchiveToggle?: boolean;
    showArchived?: boolean;
    onToggleArchive?: () => void;
    children?: React.ReactNode; // For additional filters
}

export function PaginationControls({
    currentPage,
    totalPages,
    onPageChange,
    itemsPerPage,
    onItemsPerPageChange,
    totalItems,
    isCompactView,
    onToggleView,
    searchTerm,
    onSearchChange,
    showArchiveToggle = false,
    showArchived = false,
    onToggleArchive,
    children
}: PaginationControlsProps) {
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    return (
        <div className="glass-container p-4 space-y-4">
            {/* Top Row: Search and View Controls */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex-1 max-w-md">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="pl-10 bg-white/50 border-white/20 focus:border-lilac-400"
                        />
                    </div>
                </div>
                
                <div className="flex gap-2 items-center">
                    {/* View Toggle */}
                    <Button
                        onClick={onToggleView}
                        size="sm"
                        variant="outline"
                        className="flex items-center gap-2 bg-white/20 border-white/30 text-gray-700 hover:bg-white/30"
                    >
                        {isCompactView ? <List size={16} /> : <LayoutGrid size={16} />}
                        {isCompactView ? 'List' : 'Grid'}
                    </Button>

                    {/* Archive Toggle */}
                    {showArchiveToggle && (
                        <Button
                            onClick={onToggleArchive}
                            size="sm"
                            variant={showArchived ? "default" : "outline"}
                            className={`flex items-center gap-2 ${
                                showArchived 
                                    ? 'bg-lilac-500 text-white hover:bg-lilac-600' 
                                    : 'bg-white/20 border-white/30 text-gray-700 hover:bg-white/30'
                            }`}
                        >
                            <Archive size={16} />
                            {showArchived ? 'Hide Archived' : 'Show Archived'}
                        </Button>
                    )}

                    {/* Items per page */}
                    <select
                        value={itemsPerPage}
                        onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
                        className="px-3 py-2 rounded-xl bg-white/50 border border-white/20 text-gray-700 text-sm focus:outline-none focus:border-lilac-400"
                    >
                        <option value={10}>10 per page</option>
                        <option value={20}>20 per page</option>
                        <option value={50}>50 per page</option>
                        <option value={100}>100 per page</option>
                    </select>
                </div>
            </div>

            {/* Additional Filters Row */}
            {children && (
                <div className="flex flex-wrap gap-2 items-center">
                    <Filter className="text-gray-500 w-4 h-4" />
                    {children}
                </div>
            )}

            {/* Bottom Row: Pagination */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <p className="text-sm text-gray-600">
                    Showing {startItem} to {endItem} of {totalItems} results
                </p>
                
                <div className="flex items-center gap-2">
                    <Button
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        size="sm"
                        variant="outline"
                        className="bg-white/20 border-white/30 text-gray-700 hover:bg-white/30 disabled:opacity-50"
                    >
                        <ChevronLeft size={16} />
                        Previous
                    </Button>

                    {/* Page numbers */}
                    <div className="flex gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                                pageNum = i + 1;
                            } else if (currentPage <= 3) {
                                pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i;
                            } else {
                                pageNum = currentPage - 2 + i;
                            }

                            return (
                                <Button
                                    key={pageNum}
                                    onClick={() => onPageChange(pageNum)}
                                    size="sm"
                                    variant={currentPage === pageNum ? "default" : "outline"}
                                    className={
                                        currentPage === pageNum
                                            ? "bg-lilac-500 text-white hover:bg-lilac-600"
                                            : "bg-white/20 border-white/30 text-gray-700 hover:bg-white/30"
                                    }
                                >
                                    {pageNum}
                                </Button>
                            );
                        })}
                    </div>

                    <Button
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        size="sm"
                        variant="outline"
                        className="bg-white/20 border-white/30 text-gray-700 hover:bg-white/30 disabled:opacity-50"
                    >
                        Next
                        <ChevronRight size={16} />
                    </Button>
                </div>
            </div>
        </div>
    );
}

// Custom hook for pagination logic
export function usePagination<T>(
    items: T[],
    searchTerm: string,
    searchFields: (keyof T)[],
    initialItemsPerPage = 20,
    autoArchiveDays = 30
) {
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);
    const [isCompactView, setIsCompactView] = useState(false);
    const [showArchived, setShowArchived] = useState(false);

    // Filter and search logic
    const { filteredItems, archivedItems } = useMemo(() => {
        const now = new Date();
        const archiveDate = new Date(now.getTime() - autoArchiveDays * 24 * 60 * 60 * 1000);

        const filtered: T[] = [];
        const archived: T[] = [];

        items.forEach(item => {
            // Check if item should be archived based on date
            const itemDate = (item as any).submittedAt?.toDate?.() || 
                           (item as any).createdAt?.toDate?.() || 
                           new Date((item as any).timestamp || 0);
            
            const isOld = itemDate < archiveDate;
            
            // Apply search filter
            const matchesSearch = !searchTerm || searchFields.some(field => {
                const value = item[field];
                return value && String(value).toLowerCase().includes(searchTerm.toLowerCase());
            });

            if (matchesSearch) {
                if (isOld) {
                    archived.push(item);
                } else {
                    filtered.push(item);
                }
            }
        });

        return { filteredItems: filtered, archivedItems: archived };
    }, [items, searchTerm, searchFields, autoArchiveDays]);

    // Select which items to show based on archive toggle
    const displayItems = showArchived ? archivedItems : filteredItems;
    
    // Pagination logic
    const totalPages = Math.ceil(displayItems.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedItems = displayItems.slice(startIndex, startIndex + itemsPerPage);

    // Reset to first page when search changes
    useMemo(() => {
        setCurrentPage(1);
    }, [searchTerm, showArchived]);

    return {
        currentPage,
        setCurrentPage,
        itemsPerPage,
        setItemsPerPage,
        isCompactView,
        setIsCompactView,
        showArchived,
        setShowArchived,
        paginatedItems,
        totalPages,
        totalItems: displayItems.length,
        archivedCount: archivedItems.length,
        filteredItems,
        archivedItems
    };
}
