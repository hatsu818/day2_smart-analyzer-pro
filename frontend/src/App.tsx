// Main App Component

import React, { useState, useCallback } from 'react';
import { Layout, Typography, Space, notification, Spin } from 'antd';
import { QueryClient, QueryClientProvider } from 'react-query';
import styled from 'styled-components';
import FileUploader from './components/FileUploader';
import AnalysisConfig from './components/AnalysisConfig';
import AnalysisResults from './components/AnalysisResults';
import { UploadState, AnalysisState, AnalysisRequest } from './types';
import { apiService } from './services/api';
import { validateFile } from './utils/helpers';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const StyledLayout = styled(Layout)`
  min-height: 100vh;
  background: #f0f2f5;
`;

const StyledHeader = styled(Header)`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 0 24px;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const StyledContent = styled(Content)`
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
`;

const HeaderContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`;

const LoadingOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
`;

const App: React.FC = () => {
  // Upload state
  const [uploadState, setUploadState] = useState<UploadState>({
    before: {
      file: null,
      data: null,
      loading: false,
      error: null,
    },
    after: {
      file: null,
      data: null,
      loading: false,
      error: null,
    },
  });

  // Analysis state
  const [analysisState, setAnalysisState] = useState<AnalysisState>({
    result: null,
    loading: false,
    error: null,
  });

  // File upload handler
  const handleFileUpload = useCallback(async (file: File, fileType: 'before' | 'after') => {
    const validation = validateFile(file);
    if (!validation.valid) {
      notification.error({
        message: 'ファイルエラー',
        description: validation.error,
      });
      return;
    }

    setUploadState(prev => ({
      ...prev,
      [fileType]: {
        ...prev[fileType],
        file,
        loading: true,
        error: null,
      },
    }));

    try {
      const dataInfo = await apiService.uploadFile(file, fileType);
      
      setUploadState(prev => ({
        ...prev,
        [fileType]: {
          ...prev[fileType],
          data: dataInfo,
          loading: false,
        },
      }));

      notification.success({
        message: 'アップロード完了',
        description: `${fileType === 'before' ? '期首' : '期末'}データの処理が完了しました`,
      });

    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message || 'アップロードに失敗しました';
      
      setUploadState(prev => ({
        ...prev,
        [fileType]: {
          ...prev[fileType],
          loading: false,
          error: errorMessage,
        },
      }));

      notification.error({
        message: 'アップロードエラー',
        description: errorMessage,
      });
    }
  }, []);

  // File remove handler
  const handleFileRemove = useCallback((fileType: 'before' | 'after') => {
    setUploadState(prev => ({
      ...prev,
      [fileType]: {
        file: null,
        data: null,
        loading: false,
        error: null,
      },
    }));

    // Clear analysis results if removing files
    setAnalysisState({
      result: null,
      loading: false,
      error: null,
    });
  }, []);

  // Analysis handler
  const handleAnalyze = useCallback(async (request: AnalysisRequest) => {
    setAnalysisState(prev => ({
      ...prev,
      loading: true,
      error: null,
    }));

    try {
      const result = await apiService.performAnalysis(request);
      
      setAnalysisState({
        result,
        loading: false,
        error: null,
      });

      notification.success({
        message: '分析完了',
        description: `${result.summary.total_items}項目の分析が完了しました`,
      });

      // Scroll to results
      setTimeout(() => {
        const resultsElement = document.getElementById('analysis-results');
        if (resultsElement) {
          resultsElement.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);

    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message || '分析に失敗しました';
      
      setAnalysisState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));

      notification.error({
        message: '分析エラー',
        description: errorMessage,
      });
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <StyledLayout>
        <StyledHeader>
          <HeaderContent>
            <Space align="center">
              <Title level={2} style={{ color: 'white', margin: 0 }}>
                📊 Smart Analyzer Pro
              </Title>
              <Text style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                v2.0 - 高度な増減理由分析アプリ
              </Text>
            </Space>
          </HeaderContent>
        </StyledHeader>

        <StyledContent>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {/* File Upload Section */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <FileUploader
                title="📤 期首データ"
                file={uploadState.before.file}
                data={uploadState.before.data}
                loading={uploadState.before.loading}
                error={uploadState.before.error}
                onFileUpload={(file) => handleFileUpload(file, 'before')}
                onFileRemove={() => handleFileRemove('before')}
              />
              
              <FileUploader
                title="📤 期末データ"
                file={uploadState.after.file}
                data={uploadState.after.data}
                loading={uploadState.after.loading}
                error={uploadState.after.error}
                onFileUpload={(file) => handleFileUpload(file, 'after')}
                onFileRemove={() => handleFileRemove('after')}
              />
            </div>

            {/* Analysis Configuration */}
            <AnalysisConfig
              beforeData={uploadState.before.data}
              afterData={uploadState.after.data}
              loading={analysisState.loading}
              onAnalyze={handleAnalyze}
            />

            {/* Analysis Results */}
            {analysisState.result && (
              <div id="analysis-results">
                <AnalysisResults result={analysisState.result} />
              </div>
            )}
          </Space>
        </StyledContent>

        {/* Global Loading Overlay */}
        {analysisState.loading && (
          <LoadingOverlay>
            <Space direction="vertical" align="center">
              <Spin size="large" />
              <Text>高度な分析を実行中...</Text>
              <Text type="secondary">大量データの場合、数分かかる場合があります</Text>
            </Space>
          </LoadingOverlay>
        )}
      </StyledLayout>
    </QueryClientProvider>
  );
};

export default App;