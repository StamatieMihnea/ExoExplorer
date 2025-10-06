import pandas as pd
import numpy as np

df = pd.read_csv('data/cumulative_2025.10.04_02.38.51.csv', comment='#')

print("Dataset Shape:", df.shape)
print("\n" + "="*80)
print("First few rows:")
print(df.head())

print("\n" + "="*80)
print("Column names and types:")
print(df.dtypes)

print("\n" + "="*80)
print("Target variable (koi_pdisposition) distribution:")
print(df['koi_pdisposition'].value_counts())
print(f"\nPercentage distribution:")
print(df['koi_pdisposition'].value_counts(normalize=True) * 100)

print("\n" + "="*80)
print("Missing values per column:")
missing = df.isnull().sum()
missing_pct = (missing / len(df)) * 100
missing_df = pd.DataFrame({
    'Missing_Count': missing,
    'Missing_Percentage': missing_pct
})
print(missing_df[missing_df['Missing_Count'] > 0].sort_values('Missing_Percentage', ascending=False))

print("\n" + "="*80)
print("Numeric columns statistics:")
numeric_cols = df.select_dtypes(include=[np.number]).columns
print(f"Number of numeric columns: {len(numeric_cols)}")

print("\n" + "="*80)
print("Columns with high cardinality or identifiers:")
for col in df.columns:
    unique_ratio = df[col].nunique() / len(df)
    if unique_ratio > 0.9:
        print(f"{col}: {df[col].nunique()} unique values ({unique_ratio*100:.1f}%)")

print("\n" + "="*80)
print("Key feature columns for analysis:")
key_features = [
    'koi_score', 'koi_fpflag_nt', 'koi_fpflag_ss', 'koi_fpflag_co', 'koi_fpflag_ec',
    'koi_period', 'koi_depth', 'koi_duration', 'koi_prad', 'koi_teq', 
    'koi_insol', 'koi_steff', 'koi_slogg', 'koi_srad', 'koi_smass'
]
available_features = [f for f in key_features if f in df.columns]
print(f"Available key features: {len(available_features)}")
for feat in available_features:
    missing_pct = (df[feat].isnull().sum() / len(df)) * 100
    print(f"  {feat}: {missing_pct:.1f}% missing")
