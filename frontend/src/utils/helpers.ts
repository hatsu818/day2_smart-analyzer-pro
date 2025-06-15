// Utility helper functions

import { DetailedResult } from '../types';

// Format numbers with commas
export const formatNumber = (num: number, decimals: number = 0): string => {
  return new Intl.NumberFormat('ja-JP', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
};

// Format percentage
export const formatPercentage = (num: number | null, decimals: number = 1): string => {
  if (num === null) return '新規';
  if (num === Infinity) return '∞';
  return `${num >= 0 ? '+' : ''}${formatNumber(num, decimals)}%`;
};

// Format currency (JPY)
export const formatCurrency = (num: number): string => {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

// Get significance color
export const getSignificanceColor = (significance: string): string => {
  const colorMap: Record<string, string> = {
    '極大': '#d32f2f',
    '大': '#f57c00',
    '中': '#1976d2',
    '小': '#388e3c',
    '微小': '#757575',
    '新規': '#9c27b0',
    '消失': '#424242',
  };
  return colorMap[significance] || '#757575';
};

// Get change direction color
export const getChangeColor = (value: number): string => {
  return value >= 0 ? '#2E86AB' : '#A23B72';
};

// Calculate statistics
export const calculateStats = (values: number[]) => {
  const sum = values.reduce((a, b) => a + b, 0);
  const mean = sum / values.length;
  const sortedValues = [...values].sort((a, b) => a - b);
  const median = sortedValues.length % 2 === 0
    ? (sortedValues[sortedValues.length / 2 - 1] + sortedValues[sortedValues.length / 2]) / 2
    : sortedValues[Math.floor(sortedValues.length / 2)];
  
  const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  
  return {
    sum,
    mean,
    median,
    variance,
    stdDev,
    min: Math.min(...values),
    max: Math.max(...values),
    count: values.length,
  };
};

// Filter and sort results
export const filterAndSortResults = (
  results: DetailedResult[],
  filters: {
    significance?: string[];
    changeDirection?: 'positive' | 'negative' | 'all';
    minChange?: number;
  },
  sortBy: 'name' | 'change' | 'rate' | 'significance' = 'change',
  sortOrder: 'asc' | 'desc' = 'desc'
): DetailedResult[] => {
  let filtered = [...results];
  
  // Apply filters
  if (filters.significance && filters.significance.length > 0) {
    filtered = filtered.filter(r => filters.significance!.includes(r.significance));
  }
  
  if (filters.changeDirection && filters.changeDirection !== 'all') {
    filtered = filtered.filter(r => 
      filters.changeDirection === 'positive' ? r.差額 >= 0 : r.差額 < 0
    );
  }
  
  if (filters.minChange && filters.minChange > 0) {
    filtered = filtered.filter(r => Math.abs(r.差額) >= filters.minChange!);
  }
  
  // Apply sorting
  filtered.sort((a, b) => {
    let aVal: any, bVal: any;
    
    switch (sortBy) {
      case 'name':
        aVal = Object.keys(a)[0];
        bVal = Object.keys(b)[0];
        aVal = a[aVal];
        bVal = b[bVal];
        break;
      case 'change':
        aVal = Math.abs(a.差額);
        bVal = Math.abs(b.差額);
        break;
      case 'rate':
        aVal = a.差異率 || 0;
        bVal = b.差異率 || 0;
        break;
      case 'significance':
        const significanceOrder = ['極大', '大', '中', '小', '微小', '新規', '消失'];
        aVal = significanceOrder.indexOf(a.significance);
        bVal = significanceOrder.indexOf(b.significance);
        break;
      default:
        aVal = a.差額;
        bVal = b.差額;
    }
    
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    
    return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
  });
  
  return filtered;
};

// Download file
export const downloadFile = (data: string | Blob, filename: string, mimeType: string) => {
  const blob = typeof data === 'string' ? new Blob([data], { type: mimeType }) : data;
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// Convert analysis results to CSV
export const convertToCSV = (results: DetailedResult[]): string => {
  if (results.length === 0) return '';
  
  const headers = Object.keys(results[0]).filter(key => 
    !['breakdown_data'].includes(key)
  );
  
  const csvContent = [
    headers.join(','),
    ...results.map(row => 
      headers.map(header => {
        const value = row[header];
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');
  
  return csvContent;
};

// Debounce function
export const debounce = <T extends (...args: any[]) => void>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// Validate file
export const validateFile = (file: File): { valid: boolean; error?: string } => {
  const maxSize = 200 * 1024 * 1024; // 200MB
  const allowedTypes = ['text/csv', 'application/vnd.ms-excel'];
  
  if (file.size > maxSize) {
    return { valid: false, error: 'ファイルサイズが200MBを超えています' };
  }
  
  if (!allowedTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.csv')) {
    return { valid: false, error: 'CSVファイルのみサポートされています' };
  }
  
  return { valid: true };
};

// Get file size string
export const getFileSizeString = (bytes: number): string => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};