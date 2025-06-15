"""
Smart Analyzer Pro - FastAPI Backend
高度な増減理由分析API
"""

from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import pandas as pd
import numpy as np
from typing import List, Dict, Any, Optional
import io
import asyncio
from datetime import datetime
import logging
from pydantic import BaseModel
import json

# ログ設定
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPIアプリ初期化
app = FastAPI(
    title="Smart Analyzer Pro API",
    description="高度な増減理由分析API",
    version="2.0.0"
)

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# データモデル
class AnalysisRequest(BaseModel):
    group_by_col: str
    value_col: str
    agg_method: str
    breakdown_cols: List[str] = []
    advanced_options: Dict[str, Any] = {}

class AnalysisResult(BaseModel):
    summary: Dict[str, Any]
    detailed_results: List[Dict[str, Any]]
    charts_data: Dict[str, Any]
    insights: List[str]
    performance_metrics: Dict[str, Any]

class DataInfo(BaseModel):
    columns: List[str]
    numeric_columns: List[str]
    categorical_columns: List[str]
    row_count: int
    data_quality: Dict[str, Any]

# グローバル変数（データ保存用）
uploaded_data: Dict[str, pd.DataFrame] = {}

@app.get("/")
async def root():
    return {"message": "Smart Analyzer Pro API", "version": "2.0.0"}

@app.post("/upload", response_model=DataInfo)
async def upload_file(
    file_type: str,  # "before" or "after"
    file: UploadFile = File(...)
):
    """CSVファイルアップロード"""
    try:
        # ファイル読み込み
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode('utf-8-sig')))
        
        # データ検証
        if df.empty:
            raise HTTPException(status_code=400, detail="空のファイルです")
        
        if df.shape[0] > 1_000_000:
            raise HTTPException(
                status_code=400, 
                detail=f"ファイルが大きすぎます ({df.shape[0]:,}行). 最大100万行まで"
            )
        
        # 重複削除
        initial_rows = len(df)
        df = df.drop_duplicates()
        removed_duplicates = initial_rows - len(df)
        
        # データ型最適化
        df = optimize_dtypes(df)
        
        # グローバル保存
        uploaded_data[file_type] = df
        
        # データ品質分析
        data_quality = analyze_data_quality(df)
        
        # 列情報取得
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        categorical_cols = df.select_dtypes(include=['object', 'category']).columns.tolist()
        
        logger.info(f"ファイルアップロード完了: {file_type}, 行数: {len(df):,}")
        
        return DataInfo(
            columns=df.columns.tolist(),
            numeric_columns=numeric_cols,
            categorical_columns=categorical_cols,
            row_count=len(df),
            data_quality={
                **data_quality,
                "removed_duplicates": removed_duplicates
            }
        )
        
    except Exception as e:
        logger.error(f"ファイルアップロードエラー: {str(e)}")
        raise HTTPException(status_code=500, detail=f"ファイル処理エラー: {str(e)}")

@app.post("/analyze", response_model=AnalysisResult)
async def analyze_data(request: AnalysisRequest):
    """高度な差分分析実行"""
    try:
        # データ確認
        if "before" not in uploaded_data or "after" not in uploaded_data:
            raise HTTPException(status_code=400, detail="データがアップロードされていません")
        
        df_before = uploaded_data["before"]
        df_after = uploaded_data["after"]
        
        # 分析実行
        start_time = datetime.now()
        
        # 基本差分分析
        basic_results = perform_basic_analysis(
            df_before, df_after, request.group_by_col, 
            request.value_col, request.agg_method, request.breakdown_cols
        )
        
        # 高度な分析
        advanced_results = perform_advanced_analysis(
            df_before, df_after, request, basic_results
        )
        
        # 統計的インサイト生成
        insights = generate_statistical_insights(basic_results, advanced_results)
        
        # チャートデータ生成
        charts_data = generate_charts_data(basic_results, advanced_results)
        
        end_time = datetime.now()
        processing_time = (end_time - start_time).total_seconds()
        
        logger.info(f"分析完了: 処理時間 {processing_time:.2f}秒")
        
        return AnalysisResult(
            summary={
                "total_items": len(basic_results),
                "positive_changes": len([r for r in basic_results if r["差額"] > 0]),
                "negative_changes": len([r for r in basic_results if r["差額"] < 0]),
                "total_increase": sum(r["差額"] for r in basic_results if r["差額"] > 0),
                "total_decrease": sum(r["差額"] for r in basic_results if r["差額"] < 0),
                "net_change": sum(r["差額"] for r in basic_results),
                "analysis_timestamp": datetime.now().isoformat()
            },
            detailed_results=basic_results,
            charts_data=charts_data,
            insights=insights,
            performance_metrics={
                "processing_time_seconds": processing_time,
                "rows_analyzed": len(df_before) + len(df_after),
                "analysis_type": "advanced"
            }
        )
        
    except Exception as e:
        logger.error(f"分析エラー: {str(e)}")
        raise HTTPException(status_code=500, detail=f"分析エラー: {str(e)}")

def optimize_dtypes(df: pd.DataFrame) -> pd.DataFrame:
    """データ型最適化でメモリ使用量削減（オーバーフロー回避のため安全な変換のみ）"""
    optimized_df = df.copy()
    
    # 数値列の最適化を無効化（オーバーフロー回避）
    # 大きな数値を扱う場合は元のデータ型を維持
    
    # カテゴリ列の最適化も無効化（merge時の問題を回避）
    
    return optimized_df

def analyze_data_quality(df: pd.DataFrame) -> Dict[str, Any]:
    """データ品質分析"""
    return {
        "missing_values": df.isnull().sum().to_dict(),
        "missing_percentage": (df.isnull().sum() / len(df) * 100).to_dict(),
        "unique_counts": df.nunique().to_dict(),
        "data_types": df.dtypes.astype(str).to_dict(),
        "memory_usage_mb": df.memory_usage(deep=True).sum() / 1024 / 1024,
        "numeric_summaries": df.describe().to_dict() if len(df.select_dtypes(include=[np.number]).columns) > 0 else {}
    }

def perform_basic_analysis(
    df_before: pd.DataFrame, 
    df_after: pd.DataFrame,
    group_by_col: str,
    value_col: str,
    agg_method: str,
    breakdown_cols: List[str]
) -> List[Dict[str, Any]]:
    """基本差分分析"""
    
    agg_funcs = {'sum': 'sum', 'mean': 'mean', 'count': 'count'}
    agg_func = agg_funcs[agg_method]
    
    # 集計
    before_agg = df_before.groupby(group_by_col)[value_col].agg(agg_func).reset_index()
    before_agg.columns = [group_by_col, '期首値']
    
    after_agg = df_after.groupby(group_by_col)[value_col].agg(agg_func).reset_index()
    after_agg.columns = [group_by_col, '期末値']
    
    # カテゴリ型をobject型に変換してからmerge
    if before_agg[group_by_col].dtype.name == 'category':
        before_agg[group_by_col] = before_agg[group_by_col].astype('object')
    if after_agg[group_by_col].dtype.name == 'category':
        after_agg[group_by_col] = after_agg[group_by_col].astype('object')
    
    # 結合と差分計算
    result = pd.merge(before_agg, after_agg, on=group_by_col, how='outer').fillna(0)
    
    # データ型を確認してからfloat64に変換
    result['期首値'] = result['期首値'].astype('float64')
    result['期末値'] = result['期末値'].astype('float64')
    
    result['差額'] = result['期末値'] - result['期首値']
    result['差異率'] = np.where(
        result['期首値'] != 0,
        (result['差額'] / result['期首値'] * 100),
        np.inf
    )
    
    # デバッグ出力
    logger.info(f"集計結果サンプル:")
    logger.info(f"期首値サンプル: {result['期首値'].head().tolist()}")
    logger.info(f"期末値サンプル: {result['期末値'].head().tolist()}")
    logger.info(f"差額サンプル: {result['差額'].head().tolist()}")
    
    # 増減理由生成
    results = []
    for _, row in result.iterrows():
        breakdown_reason = generate_advanced_breakdown(
            df_before, df_after, group_by_col, row[group_by_col],
            value_col, agg_method, breakdown_cols
        )
        
        # NaN や inf の処理
        ratio_value = row['差異率']
        if pd.isna(ratio_value) or ratio_value == np.inf or ratio_value == -np.inf:
            ratio_value = None
        else:
            ratio_value = float(ratio_value)
        
        results.append({
            group_by_col: row[group_by_col],
            "期首値": float(row['期首値']) if not pd.isna(row['期首値']) else 0.0,
            "期末値": float(row['期末値']) if not pd.isna(row['期末値']) else 0.0,
            "差額": float(row['差額']) if not pd.isna(row['差額']) else 0.0,
            "差異率": ratio_value,
            "増減理由": breakdown_reason["text"],
            "breakdown_data": breakdown_reason["data"],
            "significance": calculate_significance(row['差額'], row['期首値'])
        })
    
    return sorted(results, key=lambda x: abs(x['差額']), reverse=True)

def perform_advanced_analysis(
    df_before: pd.DataFrame,
    df_after: pd.DataFrame, 
    request: AnalysisRequest,
    basic_results: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """高度な分析（統計的検定、トレンド分析など）"""
    
    advanced_results = {}
    
    # 1. 統計的有意性検定
    if len(basic_results) > 5:
        advanced_results["statistical_tests"] = perform_statistical_tests(basic_results)
    
    # 2. 分散分析
    advanced_results["variance_analysis"] = analyze_variance(basic_results)
    
    # 3. 相関分析（複数数値列がある場合）
    numeric_cols = df_before.select_dtypes(include=[np.number]).columns.tolist()
    if len(numeric_cols) > 1:
        advanced_results["correlation_analysis"] = analyze_correlations(
            df_before, df_after, numeric_cols
        )
    
    # 4. 時系列トレンド分析（日付列がある場合）
    date_cols = df_before.select_dtypes(include=['datetime64']).columns.tolist()
    if not date_cols:
        # 日付らしい列を検出
        for col in df_before.columns:
            if 'date' in col.lower() or 'time' in col.lower():
                try:
                    pd.to_datetime(df_before[col].head())
                    date_cols.append(col)
                    break
                except:
                    continue
    
    if date_cols:
        advanced_results["trend_analysis"] = analyze_trends(
            df_before, df_after, date_cols[0], request.value_col
        )
    
    return advanced_results

def generate_advanced_breakdown(
    df_before: pd.DataFrame,
    df_after: pd.DataFrame,
    group_by_col: str,
    group_value: str,
    value_col: str,
    agg_method: str,
    breakdown_cols: List[str]
) -> Dict[str, Any]:
    """高度な増減理由分析"""
    
    if not breakdown_cols:
        return {"text": "詳細分析なし", "data": {}}
    
    before_group = df_before[df_before[group_by_col] == group_value]
    after_group = df_after[df_after[group_by_col] == group_value]
    
    if before_group.empty and after_group.empty:
        return {"text": "データなし", "data": {}}
    
    breakdown_data = {}
    reasons = []
    
    agg_func = {'sum': 'sum', 'mean': 'mean', 'count': 'count'}[agg_method]
    
    for breakdown_col in breakdown_cols:
        if breakdown_col not in before_group.columns or breakdown_col not in after_group.columns:
            continue
        
        # 下位集計
        before_breakdown = before_group.groupby(breakdown_col)[value_col].agg(agg_func)
        after_breakdown = after_group.groupby(breakdown_col)[value_col].agg(agg_func)
        
        # 差分計算（pandasのsubtractではなく直接計算）
        all_items = set(before_breakdown.index) | set(after_breakdown.index)
        breakdown_diff = pd.Series(index=list(all_items), dtype=float)
        
        for item in all_items:
            before_val = before_breakdown.get(item, 0.0)
            after_val = after_breakdown.get(item, 0.0)
            breakdown_diff[item] = float(after_val) - float(before_val)
        
        # 統計情報
        breakdown_stats = {
            "total_items": len(breakdown_diff),
            "positive_items": len(breakdown_diff[breakdown_diff > 0]),
            "negative_items": len(breakdown_diff[breakdown_diff < 0]),
            "zero_items": len(breakdown_diff[breakdown_diff == 0]),
            "std_dev": breakdown_diff.std(),
            "variance": breakdown_diff.var()
        }
        
        # 上位・下位貢献者
        top_contributors = breakdown_diff.nlargest(5)
        bottom_contributors = breakdown_diff.nsmallest(5)
        
        breakdown_data[breakdown_col] = {
            "stats": breakdown_stats,
            "top_contributors": top_contributors.to_dict(),
            "bottom_contributors": bottom_contributors.to_dict(),
            "all_changes": breakdown_diff.to_dict()
        }
        
        # テキスト生成
        significant_changes = breakdown_diff[abs(breakdown_diff) > breakdown_diff.std()]
        if not significant_changes.empty:
            top_3 = significant_changes.abs().nlargest(3)
            change_texts = []
            
            for item in top_3.index:
                diff_val = breakdown_diff[item]
                before_val = before_breakdown.get(item, 0)
                after_val = after_breakdown.get(item, 0)
                
                impact = "大幅" if abs(diff_val) > breakdown_diff.std() * 2 else "中程度"
                direction = "増加" if diff_val > 0 else "減少"
                
                # 異常値チェック
                if abs(diff_val) > 1e10:  # 100億以上は異常値
                    change_texts.append(f"{item} 異常値検出")
                else:
                    change_texts.append(
                        f"{item} {before_val:.0f}→{after_val:.0f} ({diff_val:+.0f}, {impact}{direction})"
                    )
            
            if change_texts:
                reasons.append(f"[{breakdown_col}] " + "｜".join(change_texts))
    
    return {
        "text": " / ".join(reasons) if reasons else "有意な変動要因なし",
        "data": breakdown_data
    }

def calculate_significance(change: float, baseline: float) -> str:
    """変化の重要度計算"""
    if baseline == 0:
        return "新規" if change > 0 else "消失"
    
    change_rate = abs(change / baseline)
    
    if change_rate >= 1.0:
        return "極大"
    elif change_rate >= 0.5:
        return "大"
    elif change_rate >= 0.2:
        return "中"
    elif change_rate >= 0.05:
        return "小"
    else:
        return "微小"

def perform_statistical_tests(results: List[Dict[str, Any]]) -> Dict[str, Any]:
    """統計的検定"""
    changes = [r["差額"] for r in results if not pd.isna(r["差額"])]
    
    if len(changes) < 3:
        return {"error": "統計検定には最低3つのデータが必要です"}
    
    try:
        from scipy import stats
        
        # 正規性検定
        shapiro_stat, shapiro_p = stats.shapiro(changes)
        
        # t検定（変化が0と有意に異なるか）
        t_stat, t_p = stats.ttest_1samp(changes, 0)
        
        return {
            "normality_test": {
                "statistic": float(shapiro_stat) if not pd.isna(shapiro_stat) else 0.0,
                "p_value": float(shapiro_p) if not pd.isna(shapiro_p) else 1.0,
                "is_normal": shapiro_p > 0.05 if not pd.isna(shapiro_p) else False
            },
            "t_test": {
                "statistic": float(t_stat) if not pd.isna(t_stat) else 0.0,
                "p_value": float(t_p) if not pd.isna(t_p) else 1.0,
                "significant": t_p < 0.05 if not pd.isna(t_p) else False
            },
            "descriptive_stats": {
                "mean": float(np.mean(changes)),
                "std": float(np.std(changes)),
                "median": float(np.median(changes)),
                "skewness": float(stats.skew(changes)) if len(changes) > 2 else 0.0,
                "kurtosis": float(stats.kurtosis(changes)) if len(changes) > 3 else 0.0
            }
        }
    except Exception as e:
        logger.warning(f"統計検定エラー: {str(e)}")
        return {"error": str(e)}

def analyze_variance(results: List[Dict[str, Any]]) -> Dict[str, Any]:
    """分散分析"""
    changes = [r["差額"] for r in results]
    
    return {
        "variance": float(np.var(changes)),
        "std_deviation": float(np.std(changes)),
        "coefficient_of_variation": float(np.std(changes) / np.mean(changes)) if np.mean(changes) != 0 else None,
        "range": float(max(changes) - min(changes)),
        "iqr": float(np.percentile(changes, 75) - np.percentile(changes, 25))
    }

def analyze_correlations(
    df_before: pd.DataFrame, 
    df_after: pd.DataFrame, 
    numeric_cols: List[str]
) -> Dict[str, Any]:
    """相関分析"""
    
    # 数値列間の相関
    before_corr = df_before[numeric_cols].corr()
    after_corr = df_after[numeric_cols].corr()
    
    return {
        "before_correlations": before_corr.to_dict(),
        "after_correlations": after_corr.to_dict(),
        "correlation_changes": (after_corr - before_corr).to_dict()
    }

def analyze_trends(
    df_before: pd.DataFrame,
    df_after: pd.DataFrame, 
    date_col: str,
    value_col: str
) -> Dict[str, Any]:
    """時系列トレンド分析"""
    
    try:
        # 日付変換
        df_before[date_col] = pd.to_datetime(df_before[date_col])
        df_after[date_col] = pd.to_datetime(df_after[date_col])
        
        # 月次集計
        before_monthly = df_before.groupby(df_before[date_col].dt.to_period('M'))[value_col].sum()
        after_monthly = df_after.groupby(df_after[date_col].dt.to_period('M'))[value_col].sum()
        
        # Period型を文字列に変換してシリアライゼーション可能にする
        before_trend_dict = {str(k): float(v) for k, v in before_monthly.items()}
        after_trend_dict = {str(k): float(v) for k, v in after_monthly.items()}
        
        return {
            "before_trend": before_trend_dict,
            "after_trend": after_trend_dict,
            "seasonality_detected": len(before_monthly) >= 12
        }
        
    except Exception as e:
        logger.warning(f"トレンド分析エラー: {str(e)}")
        return {"error": str(e)}

def generate_statistical_insights(
    basic_results: List[Dict[str, Any]], 
    advanced_results: Dict[str, Any]
) -> List[str]:
    """統計的インサイト生成"""
    
    insights = []
    
    # 基本統計からのインサイト
    changes = [r["差額"] for r in basic_results]
    
    if len(changes) > 0:
        total_positive = sum(1 for c in changes if c > 0)
        total_negative = sum(1 for c in changes if c < 0)
        
        if total_positive > total_negative * 2:
            insights.append("全体的に改善傾向が見られます（増加項目が減少項目の2倍以上）")
        elif total_negative > total_positive * 2:
            insights.append("全体的に悪化傾向が見られます（減少項目が増加項目の2倍以上）")
        else:
            insights.append("増加・減少項目がバランスしており、構造的な変化が示唆されます")
    
    # 分散分析からのインサイト
    if "variance_analysis" in advanced_results:
        cv = advanced_results["variance_analysis"]["coefficient_of_variation"]
        if cv and cv > 1.0:
            insights.append("変動が非常に大きく、項目間での差が顕著です")
        elif cv and cv < 0.3:
            insights.append("変動が比較的小さく、安定した変化パターンです")
    
    # 統計的検定からのインサイト
    if "statistical_tests" in advanced_results:
        t_test = advanced_results["statistical_tests"]["t_test"]
        if t_test["significant"]:
            insights.append("統計的に有意な変化が検出されました（p < 0.05）")
    
    # 上位貢献者の分析
    top_changes = sorted(basic_results, key=lambda x: abs(x["差額"]), reverse=True)[:3]
    if len(top_changes) > 0:
        top_item = top_changes[0]
        insights.append(f"最大の変動要因: {top_item[list(top_item.keys())[0]]} ({top_item['差額']:+.0f})")
    
    return insights

def generate_charts_data(
    basic_results: List[Dict[str, Any]], 
    advanced_results: Dict[str, Any]
) -> Dict[str, Any]:
    """チャート用データ生成"""
    
    charts_data = {}
    
    # 基本差額チャート
    charts_data["difference_chart"] = {
        "labels": [str(r[list(r.keys())[0]]) for r in basic_results],
        "values": [r["差額"] for r in basic_results],
        "colors": ["#2E86AB" if v >= 0 else "#A23B72" for v in [r["差額"] for r in basic_results]]
    }
    
    # 散布図（差額 vs 差異率）
    valid_results = [r for r in basic_results if r["差異率"] is not None]
    if valid_results:
        charts_data["scatter_chart"] = {
            "x_values": [r["差額"] for r in valid_results],
            "y_values": [r["差異率"] for r in valid_results],
            "labels": [str(r[list(r.keys())[0]]) for r in valid_results]
        }
    
    # ヒストグラム（変化の分布）
    changes = [r["差額"] for r in basic_results]
    hist, bins = np.histogram(changes, bins=20)
    charts_data["histogram"] = {
        "bins": bins.tolist(),
        "frequencies": hist.tolist()
    }
    
    # トレンドチャート（時系列データがある場合）
    if "trend_analysis" in advanced_results and "error" not in advanced_results["trend_analysis"]:
        trend_data = advanced_results["trend_analysis"]
        charts_data["trend_chart"] = {
            "before_trend": trend_data["before_trend"],
            "after_trend": trend_data["after_trend"]
        }
    
    return charts_data

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)