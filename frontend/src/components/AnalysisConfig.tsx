// Analysis Configuration Component

import React from 'react';
import { Card, Form, Select, Button, Space, Typography, Divider, Tooltip } from 'antd';
import { PlayCircleOutlined, SettingOutlined, InfoCircleOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { DataInfo, AnalysisRequest } from '../types';

const { Title, Text } = Typography;
const { Option } = Select;

interface AnalysisConfigProps {
  beforeData: DataInfo | null;
  afterData: DataInfo | null;
  loading: boolean;
  onAnalyze: (request: AnalysisRequest) => Promise<void>;
}

const ConfigContainer = styled.div`
  .ant-form-item {
    margin-bottom: 16px;
  }
`;

const SectionTitle = styled(Title)`
  && {
    margin-bottom: 12px;
    font-size: 16px;
    color: #1890ff;
  }
`;

const AnalysisConfig: React.FC<AnalysisConfigProps> = ({
  beforeData,
  afterData,
  loading,
  onAnalyze,
}) => {
  const [form] = Form.useForm();

  // Get common columns between both datasets
  const getCommonColumns = (type: 'all' | 'numeric' | 'categorical' = 'all') => {
    if (!beforeData || !afterData) return [];
    
    const beforeCols = type === 'numeric' ? beforeData.numeric_columns :
                     type === 'categorical' ? beforeData.categorical_columns :
                     beforeData.columns;
    const afterCols = type === 'numeric' ? afterData.numeric_columns :
                     type === 'categorical' ? afterData.categorical_columns :
                     afterData.columns;
    
    return beforeCols.filter(col => afterCols.includes(col));
  };

  const commonCategoricalColumns = getCommonColumns('categorical');
  const commonNumericColumns = getCommonColumns('numeric');

  const isConfigurable = beforeData && afterData && 
                         commonCategoricalColumns.length > 0 && 
                         commonNumericColumns.length > 0;

  const handleAnalyze = async (values: any) => {
    const request: AnalysisRequest = {
      group_by_col: values.group_by_col,
      value_col: values.value_col,
      agg_method: values.agg_method,
      breakdown_cols: values.breakdown_cols || [],
      advanced_options: {
        enable_statistical_tests: values.enable_statistical_tests ?? true,
        enable_trend_analysis: values.enable_trend_analysis ?? true,
        enable_correlation_analysis: values.enable_correlation_analysis ?? true,
        significance_level: values.significance_level ?? 0.05,
      },
    };
    
    await onAnalyze(request);
  };

  const renderDataSummary = () => (
    <Space direction="vertical" size="small" style={{ width: '100%' }}>
      <Text strong>データ概要</Text>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <Text>期首データ: {beforeData?.row_count.toLocaleString()}行</Text>
        <Text>期末データ: {afterData?.row_count.toLocaleString()}行</Text>
        <Text>共通カテゴリ列: {commonCategoricalColumns.length}個</Text>
        <Text>共通数値列: {commonNumericColumns.length}個</Text>
      </div>
    </Space>
  );

  if (!isConfigurable) {
    return (
      <Card title="分析設定" size="small">
        <Space direction="vertical" size="middle" style={{ width: '100%', textAlign: 'center' }}>
          <SettingOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
          <Text type="secondary">
            分析を開始するには、両方のCSVファイルをアップロードしてください
          </Text>
          {beforeData && afterData && (
            <>
              {commonCategoricalColumns.length === 0 && (
                <Text type="danger">共通するカテゴリ列が見つかりません</Text>
              )}
              {commonNumericColumns.length === 0 && (
                <Text type="danger">共通する数値列が見つかりません</Text>
              )}
            </>
          )}
        </Space>
      </Card>
    );
  }

  return (
    <Card title="分析設定" size="small">
      <ConfigContainer>
        {renderDataSummary()}
        <Divider />
        
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAnalyze}
          initialValues={{
            agg_method: 'sum',
            enable_statistical_tests: true,
            enable_trend_analysis: true,
            enable_correlation_analysis: true,
            significance_level: 0.05,
          }}
        >
          <SectionTitle level={5}>基本設定</SectionTitle>
          
          <Form.Item
            name="group_by_col"
            label={
              <Space>
                比較粒度（グループ化列）
                <Tooltip title="この粒度で集計・比較を行います">
                  <InfoCircleOutlined />
                </Tooltip>
              </Space>
            }
            rules={[{ required: true, message: '比較粒度を選択してください' }]}
          >
            <Select placeholder="グループ化する列を選択">
              {commonCategoricalColumns.map(col => (
                <Option key={col} value={col}>{col}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="value_col"
            label={
              <Space>
                値列（分析対象）
                <Tooltip title="分析する数値列を選択してください">
                  <InfoCircleOutlined />
                </Tooltip>
              </Space>
            }
            rules={[{ required: true, message: '値列を選択してください' }]}
          >
            <Select placeholder="分析する数値列を選択">
              {commonNumericColumns.map(col => (
                <Option key={col} value={col}>{col}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="agg_method"
            label="集計方法"
            rules={[{ required: true, message: '集計方法を選択してください' }]}
          >
            <Select>
              <Option value="sum">合計</Option>
              <Option value="mean">平均</Option>
              <Option value="count">件数</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="breakdown_cols"
            label={
              <Space>
                増減理由の粒度（複数選択可）
                <Tooltip title="増減理由を分析する下位の粒度を選択">
                  <InfoCircleOutlined />
                </Tooltip>
              </Space>
            }
          >
            <Select
              mode="multiple"
              placeholder="下位分析する列を選択（オプション）"
              allowClear
            >
              {commonCategoricalColumns.map(col => (
                <Option key={col} value={col}>{col}</Option>
              ))}
            </Select>
          </Form.Item>

          <Divider />
          <SectionTitle level={5}>高度なオプション</SectionTitle>

          <Form.Item
            name="enable_statistical_tests"
            label="統計的検定を実行"
            valuePropName="checked"
          >
            <Select defaultValue={true}>
              <Option value={true}>有効</Option>
              <Option value={false}>無効</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="enable_trend_analysis"
            label="トレンド分析を実行"
            valuePropName="checked"
          >
            <Select defaultValue={true}>
              <Option value={true}>有効</Option>
              <Option value={false}>無効</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="enable_correlation_analysis"
            label="相関分析を実行"
            valuePropName="checked"
          >
            <Select defaultValue={true}>
              <Option value={true}>有効</Option>
              <Option value={false}>無効</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="significance_level"
            label="有意水準"
          >
            <Select defaultValue={0.05}>
              <Option value={0.01}>0.01 (99%信頼)</Option>
              <Option value={0.05}>0.05 (95%信頼)</Option>
              <Option value={0.10}>0.10 (90%信頼)</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={<PlayCircleOutlined />}
              size="large"
              block
            >
              {loading ? '分析実行中...' : '🚀 分析実行'}
            </Button>
          </Form.Item>
        </Form>
      </ConfigContainer>
    </Card>
  );
};

export default AnalysisConfig;