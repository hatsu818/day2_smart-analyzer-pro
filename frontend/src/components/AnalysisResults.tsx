// Analysis Results Display Component

import React, { useState, useMemo } from 'react';
import {
  Card,
  Table,
  Space,
  Statistic,
  Row,
  Col,
  Button,
  Select,
  Input,
  Tag,
  Typography,
  Collapse,
  Alert,
  Tooltip,
} from 'antd';
import {
  DownloadOutlined,
  BarChartOutlined,
  BulbOutlined,
} from '@ant-design/icons';
import styled from 'styled-components';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ScatterChart,
  Scatter,
} from 'recharts';
import { AnalysisResult } from '../types';
import {
  formatNumber,
  formatPercentage,
  getSignificanceColor,
  getChangeColor,
  filterAndSortResults,
  convertToCSV,
  downloadFile,
} from '../utils/helpers';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { Panel } = Collapse;
const { Search } = Input;

interface AnalysisResultsProps {
  result: AnalysisResult;
}

const ResultsContainer = styled.div`
  .ant-statistic-content {
    font-size: 20px;
  }
  
  .insight-card {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    
    .ant-card-body {
      padding: 20px;
    }
  }
  
  .chart-container {
    height: 400px;
    margin: 20px 0;
  }
`;

const FilterContainer = styled.div`
  background: #fafafa;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
`;

const AnalysisResults: React.FC<AnalysisResultsProps> = ({ result }) => {
  const [filters, setFilters] = useState({
    significance: [] as string[],
    changeDirection: 'all' as 'positive' | 'negative' | 'all',
    minChange: 0,
    searchText: '',
  });
  const [sortBy, setSortBy] = useState<'name' | 'change' | 'rate' | 'significance'>('change');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filter and sort results
  const filteredResults = useMemo(() => {
    let filtered = filterAndSortResults(result.detailed_results, filters, sortBy, sortOrder);
    
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase();
      filtered = filtered.filter(r => {
        const firstKey = Object.keys(r)[0];
        return String(r[firstKey]).toLowerCase().includes(searchLower) ||
               r.増減理由.toLowerCase().includes(searchLower);
      });
    }
    
    return filtered;
  }, [result.detailed_results, filters, sortBy, sortOrder]);

  // Prepare chart data
  const chartData = useMemo(() => {
    const topResults = filteredResults.slice(0, 20); // Top 20 for better visibility
    
    return {
      barChart: topResults.map(r => {
        const firstKey = Object.keys(r)[0];
        return {
          name: String(r[firstKey]),
          value: r.差額,
          color: getChangeColor(r.差額),
          期首値: r.期首値,
          期末値: r.期末値,
          差異率: r.差異率,
        };
      }),
      scatterChart: filteredResults
        .filter(r => r.差異率 !== null)
        .map(r => {
          const firstKey = Object.keys(r)[0];
          return {
            x: r.差額,
            y: r.差異率,
            name: String(r[firstKey]),
            significance: r.significance,
          };
        }),
    };
  }, [filteredResults]);

  // Table columns
  const columns = [
    {
      title: '項目',
      dataIndex: 'name',
      key: 'name',
      render: (_: any, record: any) => {
        const firstKey = Object.keys(record)[0];
        return <Text strong>{record[firstKey]}</Text>;
      },
      sorter: true,
    },
    {
      title: '期首値',
      dataIndex: '期首値',
      key: 'before',
      render: (value: number) => formatNumber(value),
      align: 'right' as const,
    },
    {
      title: '期末値',
      dataIndex: '期末値',
      key: 'after',
      render: (value: number) => formatNumber(value),
      align: 'right' as const,
    },
    {
      title: '差額',
      dataIndex: '差額',
      key: 'change',
      render: (value: number) => (
        <Text style={{ color: getChangeColor(value) }}>
          {value >= 0 ? '+' : ''}{formatNumber(value)}
        </Text>
      ),
      align: 'right' as const,
      sorter: true,
    },
    {
      title: '差異率',
      dataIndex: '差異率',
      key: 'rate',
      render: (value: number | null) => formatPercentage(value),
      align: 'right' as const,
      sorter: true,
    },
    {
      title: '重要度',
      dataIndex: 'significance',
      key: 'significance',
      render: (value: string) => (
        <Tag color={getSignificanceColor(value)}>{value}</Tag>
      ),
      sorter: true,
    },
    {
      title: '増減理由',
      dataIndex: '増減理由',
      key: 'reason',
      render: (text: string) => (
        <Tooltip title={text}>
          <Text ellipsis style={{ maxWidth: 300 }}>
            {text}
          </Text>
        </Tooltip>
      ),
    },
  ];

  const handleExport = (format: 'csv' | 'excel') => {
    if (format === 'csv') {
      const csv = convertToCSV(filteredResults);
      downloadFile(csv, 'analysis_results.csv', 'text/csv');
    }
    // Excel export would require additional implementation
  };

  const renderSummaryCards = () => (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={8} md={6}>
        <Card size="small">
          <Statistic
            title="分析対象数"
            value={result.summary.total_items}
            formatter={(value) => formatNumber(Number(value))}
          />
        </Card>
      </Col>
      <Col xs={24} sm={8} md={6}>
        <Card size="small">
          <Statistic
            title="増加項目"
            value={result.summary.positive_changes}
            valueStyle={{ color: '#2E86AB' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={8} md={6}>
        <Card size="small">
          <Statistic
            title="減少項目"
            value={result.summary.negative_changes}
            valueStyle={{ color: '#A23B72' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={8} md={6}>
        <Card size="small">
          <Statistic
            title="純増減"
            value={result.summary.net_change}
            formatter={(value) => formatNumber(Number(value))}
            valueStyle={{ color: getChangeColor(result.summary.net_change) }}
            prefix={result.summary.net_change >= 0 ? '+' : ''}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card size="small">
          <Statistic
            title="総増加額"
            value={result.summary.total_increase}
            formatter={(value) => formatNumber(Number(value))}
            valueStyle={{ color: '#2E86AB' }}
            prefix="+"
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card size="small">
          <Statistic
            title="総減少額"
            value={Math.abs(result.summary.total_decrease)}
            formatter={(value) => formatNumber(Number(value))}
            valueStyle={{ color: '#A23B72' }}
            prefix="-"
          />
        </Card>
      </Col>
    </Row>
  );

  const renderInsights = () => (
    <Card className="insight-card" size="small">
      <Space align="start">
        <BulbOutlined style={{ fontSize: 24, color: '#ffd700' }} />
        <div>
          <Title level={4} style={{ color: 'white', margin: 0 }}>
            AI分析インサイト
          </Title>
          <div style={{ marginTop: 12 }}>
            {result.insights.map((insight, index) => (
              <Paragraph key={index} style={{ color: 'white', margin: '8px 0' }}>
                • {insight}
              </Paragraph>
            ))}
          </div>
        </div>
      </Space>
    </Card>
  );

  const renderFilters = () => (
    <FilterContainer>
      <Row gutter={[16, 16]} align="middle">
        <Col xs={24} sm={12} md={6}>
          <Search
            placeholder="項目・理由で検索"
            value={filters.searchText}
            onChange={(e) => setFilters(prev => ({ ...prev, searchText: e.target.value }))}
            allowClear
          />
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Select
            placeholder="重要度"
            mode="multiple"
            value={filters.significance}
            onChange={(value) => setFilters(prev => ({ ...prev, significance: value }))}
            style={{ width: '100%' }}
            allowClear
          >
            <Option value="極大">極大</Option>
            <Option value="大">大</Option>
            <Option value="中">中</Option>
            <Option value="小">小</Option>
            <Option value="微小">微小</Option>
          </Select>
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Select
            value={filters.changeDirection}
            onChange={(value) => setFilters(prev => ({ ...prev, changeDirection: value }))}
            style={{ width: '100%' }}
          >
            <Option value="all">すべて</Option>
            <Option value="positive">増加のみ</Option>
            <Option value="negative">減少のみ</Option>
          </Select>
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Select
            value={sortBy}
            onChange={setSortBy}
            style={{ width: '100%' }}
          >
            <Option value="change">差額順</Option>
            <Option value="rate">差異率順</Option>
            <Option value="significance">重要度順</Option>
            <Option value="name">名前順</Option>
          </Select>
        </Col>
        <Col xs={24} sm={12} md={3}>
          <Select
            value={sortOrder}
            onChange={setSortOrder}
            style={{ width: '100%' }}
          >
            <Option value="desc">降順</Option>
            <Option value="asc">昇順</Option>
          </Select>
        </Col>
        <Col xs={24} md={3}>
          <Space>
            <Button
              icon={<DownloadOutlined />}
              onClick={() => handleExport('csv')}
            >
              CSV
            </Button>
          </Space>
        </Col>
      </Row>
    </FilterContainer>
  );

  const renderCharts = () => (
    <Collapse defaultActiveKey={['bar']} size="small">
      <Panel header="差額棒グラフ" key="bar" extra={<BarChartOutlined />}>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData.barChart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={100}
                interval={0}
              />
              <YAxis tickFormatter={(value: number) => formatNumber(value)} />
              <RechartsTooltip
                formatter={(value, name) => [formatNumber(Number(value)), '差額']}
                labelFormatter={(label) => `項目: ${label}`}
              />
              <Bar 
                dataKey="value" 
                fill="#8884d8"
                name="差額"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>
      
      {chartData.scatterChart.length > 0 && (
        <Panel header="散布図（差額 vs 差異率）" key="scatter">
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart data={chartData.scatterChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="x" 
                  name="差額"
                  tickFormatter={(value: number) => formatNumber(value)}
                />
                <YAxis 
                  dataKey="y" 
                  name="差異率"
                  tickFormatter={(value: number) => `${value}%`}
                />
                <RechartsTooltip
                  formatter={(value, name) => [
                    name === 'x' ? formatNumber(Number(value)) : `${value}%`,
                    name === 'x' ? '差額' : '差異率'
                  ]}
                  labelFormatter={(label, payload) => 
                    payload?.[0]?.payload?.name ? `項目: ${payload[0].payload.name}` : ''
                  }
                />
                <Scatter dataKey="y" fill="#8884d8" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      )}
    </Collapse>
  );

  return (
    <ResultsContainer>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Performance Info */}
        <Alert
          message={`分析完了: ${result.performance_metrics.processing_time_seconds.toFixed(2)}秒 
                   (${formatNumber(result.performance_metrics.rows_analyzed)}行を処理)`}
          type="success"
          showIcon
          style={{ marginBottom: 16 }}
        />

        {/* Summary Cards */}
        {renderSummaryCards()}

        {/* AI Insights */}
        {result.insights.length > 0 && renderInsights()}

        {/* Charts */}
        <Card title="📊 視覚化" size="small">
          {renderCharts()}
        </Card>

        {/* Detailed Results */}
        <Card 
          title={`📋 詳細結果 (${filteredResults.length}/${result.detailed_results.length}件)`}
          size="small"
        >
          {renderFilters()}
          
          <Table
            columns={columns}
            dataSource={filteredResults}
            rowKey={(record) => {
              const firstKey = Object.keys(record)[0];
              return String(record[firstKey]);
            }}
            scroll={{ x: 1200 }}
            pagination={{
              pageSize: 50,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} / ${total}件`,
            }}
            size="small"
          />
        </Card>
      </Space>
    </ResultsContainer>
  );
};

export default AnalysisResults;