import React, { useState, useMemo, useEffect } from 'react';
import { cn } from '../../lib/utils/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Checkbox } from '../ui/checkbox';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

function descendingComparator(a, b, orderBy) {
  const aValue = a[orderBy];
  const bValue = b[orderBy];

  // Handle null/undefined values - treat them as lowest priority
  if (aValue == null && bValue == null) return 0;
  if (aValue == null) return 1; // null values go to the end
  if (bValue == null) return -1; // null values go to the end

  // For date strings, convert to Date objects for proper comparison
  if (typeof aValue === 'string' && typeof bValue === 'string') {
    const aDate = new Date(aValue);
    const bDate = new Date(bValue);

    // Check if both are valid dates
    if (!isNaN(aDate.getTime()) && !isNaN(bDate.getTime())) {
      if (bDate < aDate) return -1;
      if (bDate > aDate) return 1;
      return 0;
    }
  }

  // Standard comparison for other types
  if (bValue < aValue) {
    return -1;
  }
  if (bValue > aValue) {
    return 1;
  }
  return 0;
}

function getComparator(order, orderBy) {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

function getPageNumbers(currentPage, lastPage) {
  const delta = 1;
  const range = [];
  const rangeWithDots = [];
  let l;

  range.push(1);

  if (lastPage <= 1) return range;

  for (let i = currentPage - delta; i <= currentPage + delta; i++) {
    if (i < lastPage && i > 1) {
      range.push(i);
    }
  }

  range.push(lastPage);

  for (const i of range) {
    if (l) {
      if (i - l === 2) {
        rangeWithDots.push(l + 1);
      } else if (i - l !== 1) {
        rangeWithDots.push('...');
      }
    }
    rangeWithDots.push(i);
    l = i;
  }

  return rangeWithDots;
}

export default function ReusableDataTable({
  columns,
  rows,
  loading = false,
  checkboxSelection = false,
  pageSize = 10,
  onRowClick,
  handlePageChange,
  handlePerPageChange,
  onRowSelectionModelChange,
  rowSelectionModel,
  title,
  emptyMessage = 'No data available',
  pagination,
  getRowClassName,
  resetSortTrigger,
  handleSortChange,
  sortConfig,
}) {
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('');
  const [selected, setSelected] = useState(rowSelectionModel || []);
  const [selectedPageJump, setSelectedPageJump] = useState('');
  const [pageJumpError, setPageJumpError] = useState('');

  const stableSelectionModel = useMemo(
    () => rowSelectionModel || [],
    [rowSelectionModel],
  );

  // Sync external sort configuration with internal state
  useEffect(() => {
    if (sortConfig) {
      setOrderBy(sortConfig.sortBy || '');
      setOrder(sortConfig.sortOrder?.toLowerCase() || 'asc');
    }
  }, [sortConfig]);

  // Sync external selection with internal state
  useEffect(() => {
    setSelected(stableSelectionModel);
  }, [stableSelectionModel]);

  // Reset sort when resetSortTrigger changes
  useEffect(() => {
    if (resetSortTrigger !== undefined) {
      setOrder('asc');
      setOrderBy('');
    }
  }, [resetSortTrigger]);

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    const newOrder = isAsc ? 'desc' : 'asc';
    setOrder(newOrder);
    setOrderBy(property);
    handleSortChange?.(property, newOrder);
  };

  // Use API pagination data
  const currentPage = pagination?.current_page || 1;
  const perPage = pagination?.per_page || pageSize;
  const totalItems = pagination?.total || 0;
  const lastPage = pagination?.last_page || 1;

  // Derived total pages
  const totalPages = lastPage;

  const handleSelectAllClick = (e) => {
    const checked = e.target.checked;
    if (checked) {
      const newSelected = rows.map((n) => n.id);
      setSelected(newSelected);
      onRowSelectionModelChange?.(newSelected);
      return;
    }
    setSelected([]);
    onRowSelectionModelChange?.([]);
  };

  const handleRowSelect = (row) => {
    if (!checkboxSelection) return;

    const selectedIndex = selected.indexOf(row.id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, row.id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1),
      );
    }
    setSelected(newSelected);
    onRowSelectionModelChange?.(newSelected);
  };

  const handleChangePage = (newPage) => {
    // API uses 1-based page numbers
    handlePageChange?.(newPage);
  };

  const validatePageNumber = (value) => {
    if (!value) {
      setPageJumpError('');
      return;
    }
    const pageNumber = parseInt(value, 10);
    if (isNaN(pageNumber)) {
      setPageJumpError('Please enter a valid number');
    } else if (pageNumber < 1) {
      setPageJumpError('Page number must be at least 1');
    } else if (pageNumber > totalPages) {
      setPageJumpError(`Page number cannot exceed ${totalPages}`);
    } else {
      setPageJumpError('');
    }
  };

  const handlePageJumpChange = (value) => {
    setSelectedPageJump(value);
    validatePageNumber(value);
  };

  const handlePageJump = () => {
    if (selectedPageJump && !pageJumpError) {
      const pageNumber = parseInt(selectedPageJump, 10);
      if (pageNumber >= 1 && pageNumber <= totalPages) {
        handleChangePage(pageNumber);
        setSelectedPageJump(''); // Reset after jump
        setPageJumpError(''); // Clear error
      }
    }
  };

  // Since API returns paginated data, just sort the current page's rows if not server-side sorting
  const visibleRows = useMemo(() => {
    if (handleSortChange) return rows;
    return [...rows].sort(getComparator(order, orderBy));
  }, [order, orderBy, rows, handleSortChange]);

  const getCellValue = (row, column) => {
    if (column.valueGetter) {
      return column.valueGetter(row[column.field], row);
    }
    return row[column.field];
  };

  const isAllSelected = rows.length > 0 && selected.length === rows.length;
  const isSomeSelected = selected.length > 0 && selected.length < rows.length;

  return (
    <div className='w-full'>
      {/* Header Section */}
      {(title || (checkboxSelection && selected.length > 0)) && (
        <div className='flex items-center justify-between'>
          {checkboxSelection && selected.length > 0 ? (
            <p className='text-sm text-muted-foreground'>
              {selected.length} selected
            </p>
          ) : (
            title && <h2 className='text-lg font-semibold'>{title}</h2>
          )}
        </div>
      )}

      {/* Table Container */}
      <div className='relative border rounded-md overflow-x-auto p-3'>
        {/* Loading Overlay */}
        {loading && (
          <div className='absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-sm'>
            <Loader2 className='h-8 w-8 animate-spin text-primary' />
          </div>
        )}

        <div className={cn('transition-opacity', loading && 'opacity-40')}>
          <Table className='min-w-max w-full'>
            <TableHeader>
              <TableRow className='group'>
                {checkboxSelection && (
                  <TableHead className='w-12'>
                    <Checkbox
                      checked={isAllSelected}
                      onChange={handleSelectAllClick}
                      aria-label='Select all'
                      className={cn(
                        isSomeSelected && 'data-[state=checked]:bg-primary',
                      )}
                    />
                  </TableHead>
                )}
                {columns.map((column) => (
                  <TableHead
                    key={column.headerName}
                    className={cn(
                      column.align === 'right' && 'text-right',
                      column.align === 'center' && 'text-center',
                      column.sticky === 'right' &&
                        'sticky right-0 z-20 bg-background shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)]',
                      'whitespace-nowrap',
                      column.cellClassName,
                      column.headerClassName,
                    )}
                    style={{ width: column.width }}
                  >
                    {column.sortable !== false ? (
                      <Button
                        variant='ghost'
                        size='sm'
                        className='-ml-3 h-8 data-[state=open]:bg-accent'
                        onClick={() => handleRequestSort(column.field)}
                      >
                        <span>{column.headerName}</span>
                        {orderBy === column.field ? (
                          order === 'desc' ? (
                            <ArrowDown className='ml-2 h-4 w-4' />
                          ) : (
                            <ArrowUp className='ml-2 h-4 w-4' />
                          )
                        ) : (
                          <ArrowUpDown className='ml-2 h-4 w-4' />
                        )}
                      </Button>
                    ) : (
                      column.headerName
                    )}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleRows.length > 0 ? (
                visibleRows.map((row, index) => {
                  const isItemSelected = selected.includes(row.id);
                  return (
                    <TableRow
                      key={row.id}
                      onClick={() => onRowClick?.(row)}
                      className={cn(
                        onRowClick && 'cursor-pointer',
                        'hover:bg-blue-50 transition',
                        getRowClassName?.(row),
                        'group',
                      )}
                    >
                      {checkboxSelection && (
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={isItemSelected}
                            onChange={() => handleRowSelect(row)}
                          />
                        </TableCell>
                      )}

                      {columns.map((column) => (
                        <TableCell
                          key={column.headerName}
                          onClick={(e) => {
                            // Prevent row navigation when clicking inside actions column
                            if (column.field === 'actions') e.stopPropagation();
                          }}
                          className={cn(
                            column.align === 'right' && 'text-right',
                            column.align === 'center' && 'text-center',
                            column.sticky === 'right' &&
                              'sticky right-0 z-10 bg-background group-hover:bg-muted/40 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)] transition-colors',
                            column.cellClassName,
                          )}
                        >
                          {column.renderCell
                            ? column.renderCell({
                                row,
                                value: row[column.field],
                                index,
                              })
                            : getCellValue(row, column)}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + (checkboxSelection ? 1 : 0)}
                    className='h-24 text-center'
                  >
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {rows.length > 0 && (
        <div className='flex items-center justify-between border-t border-gray-100 pb-5 p-2'>
          <div className='flex items-center gap-1.5'>
            <span className='text-sm text-gray-500'>Rows per page:</span>
            <Select
              value={perPage.toString()}
              onValueChange={(value) => {
                const newPerPage = Number(value);
                if (handlePerPageChange) {
                  handlePerPageChange(newPerPage);
                } else {
                  handlePageChange?.(1); // Fallback: Reset to first page
                }
              }}
            >
              <SelectTrigger className='w-[75px] h-9 bg-white border-gray-200 rounded-lg'>
                <SelectValue placeholder={perPage} />
              </SelectTrigger>
              <SelectContent className='bg-white'>
                <SelectItem value='10'>10</SelectItem>
                <SelectItem value='20'>20</SelectItem>
                <SelectItem value='50'>50</SelectItem>
                <SelectItem value='100'>100</SelectItem>
              </SelectContent>
            </Select>
            <span className='text-sm text-gray-500 ml-8'>
              Showing{' '}
              <span className='font-semibold text-gray-700'>
                {(totalItems === 0
                  ? 0
                  : (currentPage - 1) * perPage + 1
                ).toLocaleString()}
              </span>{' '}
              to{' '}
              <span className='font-semibold text-gray-700'>
                {Math.min(currentPage * perPage, totalItems).toLocaleString()}
              </span>{' '}
              of{' '}
              <span className='font-semibold text-gray-700'>
                {totalItems.toLocaleString()}
              </span>{' '}
              entries
            </span>
          </div>

          <div className='flex items-center gap-1.5'>
            <Button
              variant='outline'
              size='icon'
              className='h-9 w-9 rounded-lg border-gray-200 text-gray-600 hover:bg-gray-50'
              onClick={() => handleChangePage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className='h-4 w-4' />
            </Button>

            <div className='flex items-center gap-1.5'>
              {getPageNumbers(currentPage, totalPages).map((page, index) =>
                page === '...' ? (
                  <span key={`dots-${index}`} className='px-2 text-gray-400'>
                    ...
                  </span>
                ) : (
                  <Button
                    key={page}
                    variant={currentPage === page ? 'default' : 'outline'}
                    size='sm'
                    className={`h-9 w-9 rounded-lg font-medium ${
                      currentPage === page
                        ? 'bg-[#3a5f9e] hover:bg-[#3a5f9e]/80 text-white border-[#3a5f9e] shadow-sm'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                    onClick={() => handleChangePage(page)}
                  >
                    {page}
                  </Button>
                ),
              )}
            </div>

            <Button
              variant='outline'
              size='icon'
              className='h-9 w-9 rounded-lg border-gray-200 text-gray-600 hover:bg-gray-50'
              onClick={() => handleChangePage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className='h-4 w-4' />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
