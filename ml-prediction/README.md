# 🪐 ExoExplorer ML Prediction Module

A PyTorch-based machine learning system for classifying exoplanet candidates using NASA's Kepler mission data. This module implements a deep neural network to distinguish between genuine exoplanet candidates and false positives.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Usage](#usage)
- [Model Architecture](#model-architecture)
- [Data](#data)
- [Results](#results)
- [Visualizations](#visualizations)

## 🌟 Overview

This machine learning module analyzes Kepler Object of Interest (KOI) data to predict whether a detected signal represents a genuine exoplanet candidate or a false positive. The model uses various stellar and planetary parameters to make accurate classifications.

**Key Metrics:**
- Binary classification: `CANDIDATE` vs `FALSE POSITIVE`
- Neural network with batch normalization and dropout
- Class weighting to minimize missed planet detections (Type II errors)
- Comprehensive evaluation metrics and visualizations

## ✨ Features

- **Advanced Preprocessing Pipeline**
  - Automatic removal of identifier and metadata columns
  - Intelligent handling of missing values with median imputation
  - Feature scaling with StandardScaler
  - Train/test stratified splitting

- **Deep Neural Network**
  - 3-layer architecture with batch normalization
  - Configurable hidden dimensions [256, 128, 64]
  - Dropout regularization to prevent overfitting
  - Class weighting to reduce false negatives

- **Comprehensive Evaluation**
  - ROC-AUC and Precision-Recall curves
  - Confusion matrices (absolute and percentage)
  - Calibration analysis
  - Error analysis by type (Type I vs Type II)
  - Confidence distribution analysis

- **Rich Visualizations**
  - 6+ detailed analysis plots
  - Training history tracking
  - Threshold sensitivity analysis
  - Class-wise performance metrics

## 📁 Project Structure

```
ml-prediction/
├── data/
│   └── cumulative_2025.10.04_02.38.51.csv    # Kepler exoplanet data
├── data_analysis.py                          # Exploratory data analysis
├── exoplanet_classifier.py                   # Main training script
├── model_analysis_visualizer.py              # Advanced visualization tool
├── requirements.txt                          # Python dependencies
├── .gitignore                                # Git ignore rules
└── README.md                                 # This file

# Generated files (after training):
├── exoplanet_classifier.pth                  # Trained model weights
├── preprocessor.pkl                          # Preprocessing components
├── training_history.png                      # Loss/accuracy curves
├── confusion_matrix.png                      # Basic confusion matrix
├── roc_pr_curves.png                        # ROC and PR curves
├── confusion_matrices_detailed.png          # Detailed confusion matrices
├── confidence_analysis.png                  # Prediction confidence
├── calibration_analysis.png                 # Model calibration
├── error_analysis.png                       # Error breakdown
└── class_performance_summary.png            # Performance metrics
```

## 🚀 Installation

### 1. Create a Virtual Environment

```bash
# Navigate to the ml-prediction directory
cd ml-prediction

# Create a virtual environment
python -m venv .venv

# Activate the virtual environment
# On Linux/Mac:
source .venv/bin/activate

# On Windows:
# .venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Verify Installation

```bash
python -c "import torch; print(f'PyTorch version: {torch.__version__}')"
python -c "import pandas; print(f'Pandas version: {pandas.__version__}')"
```

## 📊 Usage

### Step 1: Exploratory Data Analysis

Analyze the dataset to understand its structure and characteristics:

```bash
python data_analysis.py
```

This will display:
- Dataset shape and column information
- Target variable distribution
- Missing value analysis
- Key feature statistics

### Step 2: Train the Classifier

Train the neural network model:

```bash
python exoplanet_classifier.py
```

**What happens during training:**
1. Loads and preprocesses the Kepler data
2. Splits into 80% training, 20% test sets
3. Trains a 3-layer neural network with early stopping
4. Evaluates on test set with comprehensive metrics
5. Saves model weights and visualizations

**Expected output:**
- Training progress with loss/accuracy per epoch
- Final test set evaluation metrics
- Saved model files (`exoplanet_classifier.pth`, `preprocessor.pkl`)
- Basic visualizations (`training_history.png`, `confusion_matrix.png`)

### Step 3: Generate Advanced Visualizations

Create comprehensive analysis plots:

```bash
python model_analysis_visualizer.py
```

**Generated visualizations:**
1. **roc_pr_curves.png** - ROC curve and Precision-Recall curve
2. **confusion_matrices_detailed.png** - Absolute counts and percentages
3. **confidence_analysis.png** - Prediction confidence distributions
4. **calibration_analysis.png** - Model calibration reliability
5. **error_analysis.png** - Type I/II error breakdown
6. **class_performance_summary.png** - Class-wise metrics

## 🧠 Model Architecture

```python
ExoplanetClassifier(
  Input Layer: [N features]
  ↓
  BatchNorm1d → Linear(256) → ReLU → Dropout(0.3)
  ↓
  BatchNorm1d → Linear(128) → ReLU → Dropout(0.3)
  ↓
  BatchNorm1d → Linear(64) → ReLU → Dropout(0.21)
  ↓
  Linear(2) → Output [CANDIDATE, FALSE_POSITIVE]
)
```

**Key Components:**
- **Batch Normalization**: Stabilizes training and improves convergence
- **ReLU Activation**: Non-linear transformations
- **Dropout**: Prevents overfitting (30% for early layers, 21% for final layer)
- **Class Weighting**: CANDIDATE class weighted 1.5x to reduce missed detections

**Optimization:**
- Loss: CrossEntropyLoss with class weights
- Optimizer: Adam (lr=0.001, weight_decay=1e-5)
- Scheduler: ReduceLROnPlateau (factor=0.5, patience=5)
- Early Stopping: Patience of 50 epochs

## 📈 Data

### Dataset: Kepler Cumulative KOI Table

- **Source**: NASA Exoplanet Archive
- **File**: `cumulative_2025.10.04_02.38.51.csv`
- **Records**: ~10,000 Kepler Objects of Interest

### Key Features Used:
- **Orbital Parameters**: Period, depth, duration
- **Planetary Properties**: Radius, equilibrium temperature, insolation flux
- **Stellar Properties**: Effective temperature, surface gravity, radius, mass

### Target Variable:
- `koi_pdisposition`: Binary classification
  - `CANDIDATE` - Likely exoplanet
  - `FALSE POSITIVE` - Not an exoplanet

### Preprocessing:
1. Remove identifier columns (KOI names, IDs)
2. Remove high-missing columns (>50% missing)
3. Remove potential data leakage columns (disposition flags, scores)
4. Impute missing values with median strategy
5. Select numeric features only
6. Scale features with StandardScaler

## 📊 Results

Typical performance metrics (may vary by run):

| Metric | Score |
|--------|-------|
| Accuracy | ~98-99% |
| Precision (Weighted) | ~0.98-0.99 |
| Recall (Weighted) | ~0.98-0.99 |
| F1-Score (Weighted) | ~0.98-0.99 |
| ROC-AUC | ~0.99+ |

### Error Analysis:
- **Type I Errors** (False Alarms): Classifying false positives as candidates
- **Type II Errors** (Missed Planets): Classifying candidates as false positives
  - *Model is tuned to minimize these to avoid missing real planets*

## 🎨 Visualizations

The module generates comprehensive visualizations to understand model performance:

### 1. Training History
- Training/validation loss curves
- Training/validation accuracy curves
- Shows convergence and overfitting patterns

### 2. ROC & Precision-Recall Curves
- Model discrimination power
- Trade-off between precision and recall

### 3. Confusion Matrices
- Absolute counts of predictions
- Percentage breakdown by class

### 4. Confidence Analysis
- Distribution of prediction confidence scores
- Confidence comparison: correct vs incorrect predictions
- Class-wise confidence distributions

### 5. Calibration Curves
- Reliability diagram showing calibration quality
- Accuracy vs confidence by prediction bins

### 6. Error Analysis
- Type I and Type II error distributions
- Threshold sensitivity analysis
- Error count by confidence level

### 7. Performance Summary
- Class-wise precision, recall, F1-score
- Sample distribution across train/test sets
- Overall model performance metrics

## 🔧 Customization

### Adjust Model Architecture

Edit `exoplanet_classifier.py`:

```python
model = ExoplanetClassifier(
    input_dim=input_dim, 
    hidden_dims=[512, 256, 128],  # More layers/neurons
    dropout=0.4                     # More regularization
)
```

### Modify Class Weights

To prioritize catching candidates (reduce missed planets):

```python
candidate_weight = 2.0  # Higher = fewer missed candidates
false_positive_weight = 1.0
class_weights = torch.FloatTensor([candidate_weight, false_positive_weight])
```

### Change Training Parameters

```python
trainer.train(
    train_loader, 
    test_loader, 
    epochs=100,        # More epochs
    lr=0.0001,         # Lower learning rate
    patience=30,       # More patience
    class_weights=class_weights
)
```

## 🐛 Troubleshooting

### CUDA Out of Memory
- Reduce batch size in DataLoader: `batch_size=32`
- Use smaller model: `hidden_dims=[128, 64, 32]`

### Poor Performance
- Check data quality and missing values
- Adjust class weights
- Increase model capacity
- Train for more epochs

### Import Errors
- Ensure virtual environment is activated
- Reinstall requirements: `pip install -r requirements.txt --upgrade`

## 📝 License

Part of the ExoExplorer project.

## 🙏 Acknowledgments

- **NASA Exoplanet Archive** for the Kepler mission data
- **Kepler Space Telescope** team for discovering thousands of exoplanets
- PyTorch and scikit-learn communities

---

**Author**: ExoExplorer Team  
**Last Updated**: October 4, 2025  
**Version**: 1.0.0
