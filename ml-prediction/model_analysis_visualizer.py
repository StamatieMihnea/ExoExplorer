"""
Enhanced Model Analysis and Visualization
Creates comprehensive graphs for exoplanet classifier performance analysis
"""

import pandas as pd
import numpy as np
import torch
import torch.nn as nn
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import (roc_curve, auc, precision_recall_curve, 
                             confusion_matrix, classification_report)
from sklearn.calibration import calibration_curve
import pickle
from torch.utils.data import DataLoader, TensorDataset

# Set style
plt.style.use('seaborn-v0_8-darkgrid')
sns.set_palette("husl")

# Import the model class
import sys
sys.path.append('.')
from exoplanet_classifier import ExoplanetClassifier, ExoplanetDataPreprocessor

print("="*80)
print("EXOPLANET CLASSIFIER - COMPREHENSIVE ANALYSIS")
print("="*80)

# Load preprocessor and model
print("\n[1] Loading model and preprocessor...")
with open('preprocessor.pkl', 'rb') as f:
    preprocessor_data = pickle.load(f)

scaler = preprocessor_data['scaler']
label_encoder = preprocessor_data['label_encoder']
feature_names = preprocessor_data['feature_names']

print(f"Loaded {len(feature_names)} features")

# Load and preprocess data
print("\n[2] Loading and preprocessing data...")
preprocessor = ExoplanetDataPreprocessor('data/cumulative_2025.10.04_02.38.51.csv')
df = preprocessor.load_data()
X, y, _ = preprocessor.preprocess(df)

# Use same train-test split (with same random seed)
from sklearn.model_selection import train_test_split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# Load model
model = ExoplanetClassifier(input_dim=X_train.shape[1])
model.load_state_dict(torch.load('exoplanet_classifier.pth'))
model.eval()

print(f"Train set: {X_train.shape}, Test set: {X_test.shape}")

# Create dataloaders
test_dataset = TensorDataset(torch.FloatTensor(X_test), torch.LongTensor(y_test))
test_loader = DataLoader(test_dataset, batch_size=64, shuffle=False)

# Get predictions and probabilities
print("\n[3] Generating predictions...")
all_preds = []
all_probs = []

with torch.no_grad():
    for X_batch, _ in test_loader:
        outputs = model(X_batch)
        probs = torch.softmax(outputs, dim=1)
        _, predicted = torch.max(outputs, 1)
        
        all_preds.extend(predicted.cpu().numpy())
        all_probs.extend(probs.cpu().numpy())

y_pred = np.array(all_preds)
y_probs = np.array(all_probs)

print(f"Generated predictions for {len(y_pred)} samples")

# Create comprehensive visualizations
print("\n[4] Creating visualizations...")

# Figure 1: ROC Curve and PR Curve
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 6))

# ROC Curve
fpr, tpr, thresholds_roc = roc_curve(y_test, y_probs[:, 1])
roc_auc = auc(fpr, tpr)

ax1.plot(fpr, tpr, color='darkorange', lw=3, 
         label=f'ROC curve (AUC = {roc_auc:.4f})')
ax1.plot([0, 1], [0, 1], color='navy', lw=2, linestyle='--', label='Random Classifier')
ax1.set_xlim([0.0, 1.0])
ax1.set_ylim([0.0, 1.05])
ax1.set_xlabel('False Positive Rate', fontsize=14, fontweight='bold')
ax1.set_ylabel('True Positive Rate', fontsize=14, fontweight='bold')
ax1.set_title('ROC Curve - Model Discrimination Power', fontsize=16, fontweight='bold')
ax1.legend(loc="lower right", fontsize=12)
ax1.grid(True, alpha=0.3)

# Precision-Recall Curve
precision, recall, thresholds_pr = precision_recall_curve(y_test, y_probs[:, 1])
pr_auc = auc(recall, precision)

ax2.plot(recall, precision, color='green', lw=3, 
         label=f'PR curve (AUC = {pr_auc:.4f})')
ax2.axhline(y=0.5, color='navy', linestyle='--', lw=2, label='Baseline')
ax2.set_xlim([0.0, 1.0])
ax2.set_ylim([0.0, 1.05])
ax2.set_xlabel('Recall', fontsize=14, fontweight='bold')
ax2.set_ylabel('Precision', fontsize=14, fontweight='bold')
ax2.set_title('Precision-Recall Curve', fontsize=16, fontweight='bold')
ax2.legend(loc="lower left", fontsize=12)
ax2.grid(True, alpha=0.3)

plt.tight_layout()
plt.savefig('roc_pr_curves.png', dpi=300, bbox_inches='tight')
print("✓ Saved: roc_pr_curves.png")
plt.close()

# Figure 2: Confusion Matrix with Percentages
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 6))

cm = confusion_matrix(y_test, y_pred)
cm_normalized = cm.astype('float') / cm.sum(axis=1)[:, np.newaxis]

# Absolute counts
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', ax=ax1, cbar_kws={'label': 'Count'},
            xticklabels=label_encoder.classes_, yticklabels=label_encoder.classes_,
            annot_kws={'size': 16, 'weight': 'bold'})
ax1.set_xlabel('Predicted Label', fontsize=14, fontweight='bold')
ax1.set_ylabel('True Label', fontsize=14, fontweight='bold')
ax1.set_title('Confusion Matrix - Absolute Counts', fontsize=16, fontweight='bold')

# Percentages
sns.heatmap(cm_normalized, annot=True, fmt='.2%', cmap='Greens', ax=ax2, 
            cbar_kws={'label': 'Percentage'},
            xticklabels=label_encoder.classes_, yticklabels=label_encoder.classes_,
            annot_kws={'size': 16, 'weight': 'bold'})
ax2.set_xlabel('Predicted Label', fontsize=14, fontweight='bold')
ax2.set_ylabel('True Label', fontsize=14, fontweight='bold')
ax2.set_title('Confusion Matrix - Percentages', fontsize=16, fontweight='bold')

plt.tight_layout()
plt.savefig('confusion_matrices_detailed.png', dpi=300, bbox_inches='tight')
print("✓ Saved: confusion_matrices_detailed.png")
plt.close()

# Figure 3: Prediction Confidence Distribution
fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(16, 12))

# Overall confidence distribution
confidence_scores = np.max(y_probs, axis=1)
ax1.hist(confidence_scores, bins=50, color='steelblue', edgecolor='black', alpha=0.7)
ax1.axvline(x=0.5, color='red', linestyle='--', linewidth=2, label='Decision Threshold')
ax1.set_xlabel('Confidence Score', fontsize=12, fontweight='bold')
ax1.set_ylabel('Frequency', fontsize=12, fontweight='bold')
ax1.set_title('Overall Prediction Confidence Distribution', fontsize=14, fontweight='bold')
ax1.legend(fontsize=11)
ax1.grid(True, alpha=0.3)

# Confidence by class
candidate_probs = y_probs[y_test == 0, 0]
false_pos_probs = y_probs[y_test == 1, 1]

ax2.hist([candidate_probs, false_pos_probs], bins=30, 
         label=['True Candidates', 'True False Positives'],
         color=['#2ecc71', '#e74c3c'], edgecolor='black', alpha=0.7)
ax2.axvline(x=0.5, color='black', linestyle='--', linewidth=2, label='Threshold')
ax2.set_xlabel('Probability (Correct Class)', fontsize=12, fontweight='bold')
ax2.set_ylabel('Frequency', fontsize=12, fontweight='bold')
ax2.set_title('Confidence Distribution by True Class', fontsize=14, fontweight='bold')
ax2.legend(fontsize=11)
ax2.grid(True, alpha=0.3)

# Correct vs Incorrect predictions
correct_mask = (y_pred == y_test)
correct_conf = confidence_scores[correct_mask]
incorrect_conf = confidence_scores[~correct_mask]

ax3.hist([correct_conf, incorrect_conf], bins=30,
         label=[f'Correct (n={len(correct_conf)})', f'Incorrect (n={len(incorrect_conf)})'],
         color=['#27ae60', '#c0392b'], edgecolor='black', alpha=0.7)
ax3.axvline(x=0.5, color='black', linestyle='--', linewidth=2)
ax3.set_xlabel('Confidence Score', fontsize=12, fontweight='bold')
ax3.set_ylabel('Frequency', fontsize=12, fontweight='bold')
ax3.set_title('Confidence: Correct vs Incorrect Predictions', fontsize=14, fontweight='bold')
ax3.legend(fontsize=11)
ax3.grid(True, alpha=0.3)

# Box plot comparison
data_for_box = [correct_conf, incorrect_conf]
bp = ax4.boxplot(data_for_box, labels=['Correct', 'Incorrect'], 
                 patch_artist=True, widths=0.6)
bp['boxes'][0].set_facecolor('#27ae60')
bp['boxes'][1].set_facecolor('#c0392b')
for element in ['whiskers', 'fliers', 'means', 'medians', 'caps']:
    plt.setp(bp[element], color='black', linewidth=2)
ax4.set_ylabel('Confidence Score', fontsize=12, fontweight='bold')
ax4.set_title('Confidence Distribution Comparison', fontsize=14, fontweight='bold')
ax4.grid(True, alpha=0.3, axis='y')
ax4.axhline(y=0.5, color='red', linestyle='--', linewidth=2, alpha=0.5)

plt.tight_layout()
plt.savefig('confidence_analysis.png', dpi=300, bbox_inches='tight')
print("✓ Saved: confidence_analysis.png")
plt.close()

# Figure 4: Calibration Curve
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 6))

# Calibration curve for class 1 (FALSE POSITIVE)
fraction_of_positives, mean_predicted_value = calibration_curve(
    y_test, y_probs[:, 1], n_bins=10, strategy='uniform'
)

ax1.plot([0, 1], [0, 1], "k--", label="Perfect Calibration", linewidth=2)
ax1.plot(mean_predicted_value, fraction_of_positives, "s-", 
         label="Model Calibration", linewidth=3, markersize=10, color='darkorange')
ax1.set_xlabel('Mean Predicted Probability', fontsize=14, fontweight='bold')
ax1.set_ylabel('Fraction of Positives', fontsize=14, fontweight='bold')
ax1.set_title('Calibration Curve (Reliability Diagram)', fontsize=16, fontweight='bold')
ax1.legend(loc='lower right', fontsize=12)
ax1.grid(True, alpha=0.3)

# Calibration by bins
bins = np.linspace(0, 1, 11)
bin_indices = np.digitize(y_probs[:, 1], bins) - 1
bin_accuracy = []
bin_confidence = []
bin_counts = []

for i in range(len(bins)-1):
    mask = (bin_indices == i)
    if mask.sum() > 0:
        bin_preds = y_pred[mask]
        bin_true = y_test[mask]
        bin_prob = y_probs[mask, 1]
        
        accuracy = (bin_preds == bin_true).mean()
        confidence = bin_prob.mean()
        count = mask.sum()
        
        bin_accuracy.append(accuracy)
        bin_confidence.append(confidence)
        bin_counts.append(count)

x = np.arange(len(bin_accuracy))
width = 0.35

bars1 = ax2.bar(x - width/2, bin_accuracy, width, label='Accuracy', 
                color='#3498db', edgecolor='black', alpha=0.8)
bars2 = ax2.bar(x + width/2, bin_confidence, width, label='Avg Confidence', 
                color='#e74c3c', edgecolor='black', alpha=0.8)

ax2.set_xlabel('Confidence Bin', fontsize=14, fontweight='bold')
ax2.set_ylabel('Score', fontsize=14, fontweight='bold')
ax2.set_title('Accuracy vs Confidence by Bin', fontsize=16, fontweight='bold')
ax2.set_xticks(x)
ax2.set_xticklabels([f'{bins[i]:.1f}-{bins[i+1]:.1f}' for i in range(len(bin_accuracy))], 
                     rotation=45, ha='right')
ax2.legend(fontsize=12)
ax2.grid(True, alpha=0.3, axis='y')

plt.tight_layout()
plt.savefig('calibration_analysis.png', dpi=300, bbox_inches='tight')
print("✓ Saved: calibration_analysis.png")
plt.close()

# Figure 5: Error Analysis by Confidence
fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(16, 12))

# False Positives (Type I errors)
type1_mask = (y_test == 1) & (y_pred == 0)  # Actually FP, predicted Candidate
type1_conf = confidence_scores[type1_mask]

ax1.hist(type1_conf, bins=20, color='#e67e22', edgecolor='black', alpha=0.7)
ax1.axvline(x=np.mean(type1_conf), color='red', linestyle='--', 
            linewidth=2, label=f'Mean: {np.mean(type1_conf):.3f}')
ax1.set_xlabel('Confidence Score', fontsize=12, fontweight='bold')
ax1.set_ylabel('Count', fontsize=12, fontweight='bold')
ax1.set_title(f'Type I Errors: False Alarms (n={type1_mask.sum()})', 
              fontsize=14, fontweight='bold')
ax1.legend(fontsize=11)
ax1.grid(True, alpha=0.3)

# False Negatives (Type II errors)
type2_mask = (y_test == 0) & (y_pred == 1)  # Actually Candidate, predicted FP
type2_conf = confidence_scores[type2_mask]

ax2.hist(type2_conf, bins=20, color='#9b59b6', edgecolor='black', alpha=0.7)
ax2.axvline(x=np.mean(type2_conf), color='red', linestyle='--', 
            linewidth=2, label=f'Mean: {np.mean(type2_conf):.3f}')
ax2.set_xlabel('Confidence Score', fontsize=12, fontweight='bold')
ax2.set_ylabel('Count', fontsize=12, fontweight='bold')
ax2.set_title(f'Type II Errors: Missed Candidates (n={type2_mask.sum()})', 
              fontsize=14, fontweight='bold')
ax2.legend(fontsize=11)
ax2.grid(True, alpha=0.3)

# Error type comparison
error_types = ['Type I\n(False Alarms)', 'Type II\n(Missed Planets)']
error_counts = [type1_mask.sum(), type2_mask.sum()]
colors_err = ['#e67e22', '#9b59b6']

bars = ax3.bar(error_types, error_counts, color=colors_err, edgecolor='black', 
               linewidth=2, alpha=0.8)
ax3.set_ylabel('Number of Errors', fontsize=12, fontweight='bold')
ax3.set_title('Error Type Distribution', fontsize=14, fontweight='bold')
ax3.grid(True, alpha=0.3, axis='y')

# Add value labels on bars
for bar, count in zip(bars, error_counts):
    height = bar.get_height()
    ax3.text(bar.get_x() + bar.get_width()/2., height,
             f'{int(count)}',
             ha='center', va='bottom', fontsize=14, fontweight='bold')

# Threshold sensitivity analysis
thresholds = np.linspace(0.3, 0.7, 20)
accuracies = []
type1_errors = []
type2_errors = []

for thresh in thresholds:
    pred_thresh = (y_probs[:, 1] >= thresh).astype(int)
    acc = (pred_thresh == y_test).mean()
    t1 = ((y_test == 1) & (pred_thresh == 0)).sum()
    t2 = ((y_test == 0) & (pred_thresh == 1)).sum()
    
    accuracies.append(acc)
    type1_errors.append(t1)
    type2_errors.append(t2)

ax4.plot(thresholds, accuracies, 'o-', linewidth=3, markersize=8, 
         label='Accuracy', color='#2ecc71')
ax4_twin = ax4.twinx()
ax4_twin.plot(thresholds, type1_errors, 's-', linewidth=2, markersize=6,
              label='Type I Errors', color='#e67e22', alpha=0.7)
ax4_twin.plot(thresholds, type2_errors, '^-', linewidth=2, markersize=6,
              label='Type II Errors', color='#9b59b6', alpha=0.7)

ax4.axvline(x=0.5, color='red', linestyle='--', linewidth=2, 
            label='Current Threshold')
ax4.set_xlabel('Classification Threshold', fontsize=12, fontweight='bold')
ax4.set_ylabel('Accuracy', fontsize=12, fontweight='bold', color='#2ecc71')
ax4_twin.set_ylabel('Error Count', fontsize=12, fontweight='bold')
ax4.set_title('Threshold Sensitivity Analysis', fontsize=14, fontweight='bold')
ax4.grid(True, alpha=0.3)

# Combine legends
lines1, labels1 = ax4.get_legend_handles_labels()
lines2, labels2 = ax4_twin.get_legend_handles_labels()
ax4.legend(lines1 + lines2, labels1 + labels2, loc='lower left', fontsize=10)

plt.tight_layout()
plt.savefig('error_analysis.png', dpi=300, bbox_inches='tight')
print("✓ Saved: error_analysis.png")
plt.close()

# Figure 6: Class-wise Performance Metrics
fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(16, 12))

# Metrics by class
from sklearn.metrics import precision_score, recall_score, f1_score

classes = label_encoder.classes_
precision_per_class = [precision_score(y_test == i, y_pred == i) for i in range(2)]
recall_per_class = [recall_score(y_test == i, y_pred == i) for i in range(2)]
f1_per_class = [f1_score(y_test == i, y_pred == i) for i in range(2)]

x_pos = np.arange(len(classes))
width = 0.25

bars1 = ax1.bar(x_pos - width, precision_per_class, width, label='Precision',
                color='#3498db', edgecolor='black', alpha=0.8)
bars2 = ax1.bar(x_pos, recall_per_class, width, label='Recall',
                color='#e74c3c', edgecolor='black', alpha=0.8)
bars3 = ax1.bar(x_pos + width, f1_per_class, width, label='F1-Score',
                color='#2ecc71', edgecolor='black', alpha=0.8)

ax1.set_ylabel('Score', fontsize=12, fontweight='bold')
ax1.set_title('Performance Metrics by Class', fontsize=14, fontweight='bold')
ax1.set_xticks(x_pos)
ax1.set_xticklabels(classes, fontsize=11)
ax1.legend(fontsize=11)
ax1.set_ylim([0.75, 1.0])
ax1.grid(True, alpha=0.3, axis='y')

# Add value labels
for bars in [bars1, bars2, bars3]:
    for bar in bars:
        height = bar.get_height()
        ax1.text(bar.get_x() + bar.get_width()/2., height,
                f'{height:.3f}',
                ha='center', va='bottom', fontsize=9, fontweight='bold')

# Sample distribution
train_dist = np.bincount(y_train)
test_dist = np.bincount(y_test)

x_pos = np.arange(len(classes))
width = 0.35

ax2.bar(x_pos - width/2, train_dist, width, label='Training Set',
        color='#3498db', edgecolor='black', alpha=0.8)
ax2.bar(x_pos + width/2, test_dist, width, label='Test Set',
        color='#e74c3c', edgecolor='black', alpha=0.8)

ax2.set_ylabel('Sample Count', fontsize=12, fontweight='bold')
ax2.set_title('Class Distribution: Train vs Test', fontsize=14, fontweight='bold')
ax2.set_xticks(x_pos)
ax2.set_xticklabels(classes, fontsize=11)
ax2.legend(fontsize=11)
ax2.grid(True, alpha=0.3, axis='y')

# Support (number of samples per class in test set)
support = [np.sum(y_test == i) for i in range(2)]
correct = [np.sum((y_test == i) & (y_pred == i)) for i in range(2)]
incorrect = [support[i] - correct[i] for i in range(2)]

x_pos = np.arange(len(classes))
ax3.bar(x_pos, correct, label='Correctly Classified',
        color='#2ecc71', edgecolor='black', alpha=0.8)
ax3.bar(x_pos, incorrect, bottom=correct, label='Misclassified',
        color='#e74c3c', edgecolor='black', alpha=0.8)

ax3.set_ylabel('Count', fontsize=12, fontweight='bold')
ax3.set_title('Classification Results by Class', fontsize=14, fontweight='bold')
ax3.set_xticks(x_pos)
ax3.set_xticklabels(classes, fontsize=11)
ax3.legend(fontsize=11)
ax3.grid(True, alpha=0.3, axis='y')

# Overall metrics summary
metrics_names = ['Accuracy', 'Precision\n(Weighted)', 'Recall\n(Weighted)', 
                 'F1-Score\n(Weighted)', 'ROC-AUC']
metrics_values = [
    (y_pred == y_test).mean(),
    precision_score(y_test, y_pred, average='weighted'),
    recall_score(y_test, y_pred, average='weighted'),
    f1_score(y_test, y_pred, average='weighted'),
    roc_auc
]

colors_metric = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6']
bars = ax4.barh(metrics_names, metrics_values, color=colors_metric, 
                edgecolor='black', linewidth=2, alpha=0.8)

ax4.set_xlabel('Score', fontsize=12, fontweight='bold')
ax4.set_title('Overall Model Performance Summary', fontsize=14, fontweight='bold')
ax4.set_xlim([0.8, 1.0])
ax4.grid(True, alpha=0.3, axis='x')

# Add value labels
for bar, value in zip(bars, metrics_values):
    width = bar.get_width()
    ax4.text(width, bar.get_y() + bar.get_height()/2.,
            f'{value:.4f}',
            ha='left', va='center', fontsize=11, fontweight='bold', 
            bbox=dict(boxstyle='round', facecolor='white', alpha=0.8))

plt.tight_layout()
plt.savefig('class_performance_summary.png', dpi=300, bbox_inches='tight')
print("✓ Saved: class_performance_summary.png")
plt.close()

# Print summary statistics
print("\n" + "="*80)
print("ANALYSIS SUMMARY")
print("="*80)
print(f"\nTotal Test Samples: {len(y_test)}")
print(f"Correct Predictions: {(y_pred == y_test).sum()} ({(y_pred == y_test).mean()*100:.2f}%)")
print(f"Incorrect Predictions: {(y_pred != y_test).sum()} ({(y_pred != y_test).mean()*100:.2f}%)")
print(f"\nType I Errors (False Alarms): {type1_mask.sum()}")
print(f"Type II Errors (Missed Candidates): {type2_mask.sum()}")
print(f"\nAverage Confidence (Correct): {np.mean(correct_conf):.4f}")
print(f"Average Confidence (Incorrect): {np.mean(incorrect_conf):.4f}")
print(f"\nROC-AUC Score: {roc_auc:.4f}")
print(f"PR-AUC Score: {pr_auc:.4f}")

print("\n" + "="*80)
print("ALL VISUALIZATIONS CREATED SUCCESSFULLY!")
print("="*80)
print("\nGenerated files:")
print("  1. roc_pr_curves.png - ROC and Precision-Recall curves")
print("  2. confusion_matrices_detailed.png - Confusion matrices")
print("  3. confidence_analysis.png - Prediction confidence analysis")
print("  4. calibration_analysis.png - Model calibration")
print("  5. error_analysis.png - Detailed error breakdown")
print("  6. class_performance_summary.png - Class-wise metrics")
print("\n" + "="*80)
