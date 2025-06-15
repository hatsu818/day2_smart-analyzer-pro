// Types for Smart Analyzer Pro

export interface DataInfo {
  columns: string[];
  numeric_columns: string[];
  categorical_columns: string[];
  row_count: number;
  data_quality: {
    missing_values: Record<string, number>;
    missing_percentage: Record<string, number>;
    unique_counts: Record<string, number>;
    data_types: Record<string, string>;
    memory_usage_mb: number;
    removed_duplicates: number;
    numeric_summaries?: Record<string, Record<string, number>>;
  };
}

export interface AnalysisRequest {
  group_by_col: string;
  value_col: string;
  agg_method: 'sum' | 'mean' | 'count';
  breakdown_cols: string[];
  advanced_options: Record<string, any>;
}

export interface DetailedResult {
  [key: string]: any;
  期首値: number;
  期末値: number;
  差額: number;
  差異率: number | null;
  増減理由: string;
  breakdown_data: Record<string, any>;
  significance: string;
}

export interface StatisticalTest {
  normality_test: {
    statistic: number;
    p_value: number;
    is_normal: boolean;
  };
  t_test: {
    statistic: number;
    p_value: number;
    significant: boolean;
  };
  descriptive_stats: {
    mean: number;
    std: number;
    median: number;
    skewness: number;
    kurtosis: number;
  };
}

export interface VarianceAnalysis {
  variance: number;
  std_deviation: number;
  coefficient_of_variation: number | null;
  range: number;
  iqr: number;
}

export interface ChartsData {
  difference_chart: {
    labels: string[];
    values: number[];
    colors: string[];
  };
  scatter_chart?: {
    x_values: number[];
    y_values: number[];
    labels: string[];
  };
  histogram: {
    bins: number[];
    frequencies: number[];
  };
  trend_chart?: {
    before_trend: Record<string, number>;
    after_trend: Record<string, number>;
  };
}

export interface AnalysisResult {
  summary: {
    total_items: number;
    positive_changes: number;
    negative_changes: number;
    total_increase: number;
    total_decrease: number;
    net_change: number;
    analysis_timestamp: string;
  };
  detailed_results: DetailedResult[];
  charts_data: ChartsData;
  insights: string[];
  performance_metrics: {
    processing_time_seconds: number;
    rows_analyzed: number;
    analysis_type: string;
  };
}

export interface UploadState {
  before: {
    file: File | null;
    data: DataInfo | null;
    loading: boolean;
    error: string | null;
  };
  after: {
    file: File | null;
    data: DataInfo | null;
    loading: boolean;
    error: string | null;
  };
}

export interface AnalysisState {
  result: AnalysisResult | null;
  loading: boolean;
  error: string | null;
}