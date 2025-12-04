import React from 'react';

const Table = ({
  columns,
  data,
  keyField = 'id',
  onRowClick,
  sortColumn,
  sortDirection,
  onSort,
  loading = false,
  emptyMessage = 'No data available',
  className = ''
}) => {
  const handleSort = (columnKey) => {
    if (onSort && columns.find(col => col.key === columnKey)?.sortable) {
      onSort(columnKey);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <div className="text-gray-500">{emptyMessage}</div>
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto bg-white rounded-lg border ${className}`}>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${column.className} ${column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                onClick={() => column.sortable && handleSort(column.key)}
              >
                <div className="flex items-center gap-1">
                  {column.title}
                  {column.sortable && (
                    <span className="flex flex-col">
                      <svg 
                        className={`w-3 h-3 ${sortColumn === column.key && sortDirection === 'asc' ? 'text-blue-600' : 'text-gray-300'}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24" 
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                      <svg 
                        className={`w-3 h-3 -mt-1 ${sortColumn === column.key && sortDirection === 'desc' ? 'text-blue-600' : 'text-gray-300'}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24" 
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row, rowIndex) => (
            <tr
              key={row[keyField] || rowIndex}
              className={`hover:bg-gray-50 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
              onClick={() => onRowClick && onRowClick(row)}
            >
              {columns.map((column) => (
                <td
                  key={`${row[keyField] || rowIndex}-${column.key}`}
                  className={`px-6 py-4 whitespace-nowrap ${column.cellClassName || ''}`}
                >
                  {column.render 
                    ? column.render(row[column.key], row, rowIndex)
                    : <div className="text-sm text-gray-900">{row[column.key]}</div>
                  }
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
