// File Upload Component

import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, Typography, Progress, Alert, Button, Space, Statistic } from 'antd';
import { UploadOutlined, FileTextOutlined, DeleteOutlined, CheckCircleOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { DataInfo } from '../types';
import { validateFile, getFileSizeString, formatNumber } from '../utils/helpers';

const { Title, Text } = Typography;

interface FileUploaderProps {
  title: string;
  file: File | null;
  data: DataInfo | null;
  loading: boolean;
  error: string | null;
  onFileUpload: (file: File) => Promise<void>;
  onFileRemove: () => void;
}

const DropzoneContainer = styled.div<{ isDragActive: boolean; hasFile: boolean }>`
  border: 2px dashed ${props => 
    props.hasFile ? '#52c41a' : props.isDragActive ? '#1890ff' : '#d9d9d9'
  };
  border-radius: 8px;
  padding: 40px 20px;
  text-align: center;
  background-color: ${props => 
    props.hasFile ? '#f6ffed' : props.isDragActive ? '#e6f7ff' : '#fafafa'
  };
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: #1890ff;
    background-color: #e6f7ff;
  }
`;

const FileInfo = styled.div`
  text-align: left;
  margin-top: 16px;
`;

const StatisticsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-top: 16px;
`;

const FileUploader: React.FC<FileUploaderProps> = ({
  title,
  file,
  data,
  loading,
  error,
  onFileUpload,
  onFileRemove,
}) => {
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      const validation = validateFile(selectedFile);
      
      if (!validation.valid) {
        // Error handling would be done by parent component
        return;
      }
      
      await onFileUpload(selectedFile);
    }
  }, [onFileUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv'],
    },
    multiple: false,
    disabled: loading,
  });

  const renderDropzone = () => (
    <DropzoneContainer
      {...getRootProps()}
      isDragActive={isDragActive}
      hasFile={!!file}
    >
      <input {...getInputProps()} />
      
      {file ? (
        <Space direction="vertical" size="middle">
          <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a' }} />
          <Title level={4} style={{ margin: 0, color: '#52c41a' }}>
            アップロード完了
          </Title>
          <Text strong>{file.name}</Text>
          <Text type="secondary">{getFileSizeString(file.size)}</Text>
        </Space>
      ) : (
        <Space direction="vertical" size="middle">
          <UploadOutlined style={{ fontSize: 48, color: '#1890ff' }} />
          <Title level={4} style={{ margin: 0 }}>
            {isDragActive ? 'ファイルをドロップしてください' : 'CSVファイルをアップロード'}
          </Title>
          <Text type="secondary">
            クリックまたはドラッグ&ドロップでファイルを選択
          </Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            対応形式: CSV | 最大サイズ: 200MB
          </Text>
        </Space>
      )}
    </DropzoneContainer>
  );

  const renderDataInfo = () => {
    if (!data) return null;

    const qualityIssues = [];
    const totalMissing = Object.values(data.data_quality.missing_values).reduce((a, b) => a + b, 0);
    
    if (totalMissing > 0) {
      qualityIssues.push(`欠損値: ${formatNumber(totalMissing)}件`);
    }
    
    if (data.data_quality.removed_duplicates > 0) {
      qualityIssues.push(`重複削除: ${formatNumber(data.data_quality.removed_duplicates)}件`);
    }

    return (
      <FileInfo>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <FileTextOutlined style={{ marginRight: 8, color: '#1890ff' }} />
            <Text strong>データ情報</Text>
          </div>
          
          <StatisticsContainer>
            <Statistic
              title="総行数"
              value={data.row_count}
              formatter={(value) => formatNumber(Number(value))}
            />
            <Statistic
              title="列数"
              value={data.columns.length}
            />
            <Statistic
              title="数値列"
              value={data.numeric_columns.length}
            />
            <Statistic
              title="カテゴリ列"
              value={data.categorical_columns.length}
            />
          </StatisticsContainer>

          {qualityIssues.length > 0 && (
            <Alert
              message="データ品質の注意点"
              description={qualityIssues.join(' | ')}
              type="info"
              showIcon
            />
          )}

          <Space>
            <Button
              icon={<DeleteOutlined />}
              onClick={onFileRemove}
              danger
            >
              ファイルを削除
            </Button>
          </Space>
        </Space>
      </FileInfo>
    );
  };

  return (
    <Card title={title} size="small">
      {renderDropzone()}
      
      {loading && (
        <div style={{ marginTop: 16 }}>
          <Progress percent={undefined} status="active" />
          <Text type="secondary">ファイルを処理中...</Text>
        </div>
      )}
      
      {error && (
        <Alert
          message="エラー"
          description={error}
          type="error"
          showIcon
          style={{ marginTop: 16 }}
        />
      )}
      
      {data && renderDataInfo()}
    </Card>
  );
};

export default FileUploader;