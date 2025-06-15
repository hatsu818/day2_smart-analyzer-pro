// API service for Smart Analyzer Pro

import axios from 'axios';
import { DataInfo, AnalysisRequest, AnalysisResult } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 300000, // 5 minutes timeout for large file processing
});

// Request interceptor for logging
api.interceptors.request.use((config) => {
  console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const apiService = {
  // Health check
  async healthCheck(): Promise<{ message: string; version: string }> {
    const response = await api.get('/');
    return response.data;
  },

  // Upload CSV file
  async uploadFile(file: File, fileType: 'before' | 'after'): Promise<DataInfo> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post(`/upload?file_type=${fileType}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  },

  // Perform analysis
  async performAnalysis(analysisRequest: AnalysisRequest): Promise<AnalysisResult> {
    const response = await api.post('/analyze', analysisRequest);
    return response.data;
  },

  // Export results (if needed)
  async exportResults(format: 'csv' | 'excel', data: any): Promise<Blob> {
    const response = await api.post(`/export/${format}`, data, {
      responseType: 'blob',
    });
    return response.data;
  },
};

export default apiService;