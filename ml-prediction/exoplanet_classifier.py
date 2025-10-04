"""
Exoplanet Disposition Classifier using PyTorch
Binary classification: CANDIDATE vs FALSE POSITIVE
"""

import pandas as pd
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader, TensorDataset
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import (accuracy_score, precision_recall_fscore_support, 
                             confusion_matrix, classification_report, roc_auc_score, roc_curve)
from sklearn.impute import SimpleImputer
import matplotlib.pyplot as plt
import seaborn as sns
from typing import Tuple, Dict
import warnings
warnings.filterwarnings('ignore')


class ExoplanetDataPreprocessor:
    """Handles data loading, cleaning, and preprocessing"""
    
    def __init__(self, filepath: str):
        self.filepath = filepath
        self.scaler = StandardScaler()
        self.label_encoder = LabelEncoder()
        self.imputer = SimpleImputer(strategy='median')
        self.feature_names = None
        
    def load_data(self) -> pd.DataFrame:
        """Load CSV with proper handling of comment lines"""
        df = pd.read_csv(self.filepath, comment='#')
        print(f"Loaded dataset: {df.shape}")
        return df
    
    def remove_identifier_columns(self, df: pd.DataFrame) -> pd.DataFrame:
        """Remove non-predictive identifier and metadata columns"""
        cols_to_remove = [
            # Identifiers
            'rowid', 'kepid', 'kepoi_name', 'kepler_name',
            # Administrative/Metadata
            'koi_disposition', 'koi_vet_stat', 'koi_vet_date', 
            'koi_disp_prov', 'koi_comment', 'koi_tce_delivname',
            'koi_datalink_dvr', 'koi_datalink_dvs', 'koi_quarters',
            'koi_parm_prov', 'koi_sparprov', 'koi_limbdark_mod', 
            'koi_trans_mod', 'koi_fittype',
            # Time columns (high cardinality, not useful for classification)
            'koi_time0bk', 'koi_time0bk_err1', 'koi_time0bk_err2',
            'koi_time0', 'koi_time0_err1', 'koi_time0_err2',
            # Disposition indicators (potential data leakage)
            'koi_score', 'koi_fpflag_nt', 'koi_fpflag_ss', 
            'koi_fpflag_co', 'koi_fpflag_ec',
        ]
        
        # Remove columns that exist in the dataframe
        cols_to_remove = [col for col in cols_to_remove if col in df.columns]
        df_cleaned = df.drop(columns=cols_to_remove)
        print(f"Removed {len(cols_to_remove)} identifier/metadata columns")
        return df_cleaned
    
    def remove_high_missing_columns(self, df: pd.DataFrame, threshold: float = 0.5) -> pd.DataFrame:
        """Remove columns with more than threshold missing values"""
        missing_pct = df.isnull().sum() / len(df)
        high_missing = missing_pct[missing_pct > threshold].index.tolist()
        
        if high_missing:
            df_cleaned = df.drop(columns=high_missing)
            print(f"Removed {len(high_missing)} columns with >{threshold*100}% missing values")
            return df_cleaned
        return df
    
    def handle_missing_values(self, df: pd.DataFrame) -> pd.DataFrame:
        """Impute missing values with median strategy"""
        # Separate target column
        if 'koi_pdisposition' in df.columns:
            target = df['koi_pdisposition']
            features = df.drop(columns=['koi_pdisposition'])
        else:
            return df
        
        # Only impute numeric columns
        numeric_cols = features.select_dtypes(include=[np.number]).columns
        
        if len(numeric_cols) > 0:
            features_imputed = features.copy()
            features_imputed[numeric_cols] = self.imputer.fit_transform(features[numeric_cols])
            features_imputed['koi_pdisposition'] = target
            
            missing_before = features[numeric_cols].isnull().sum().sum()
            missing_after = features_imputed[numeric_cols].isnull().sum().sum()
            print(f"Imputed {missing_before - missing_after} missing values")
            
            return features_imputed
        
        return df
    
    def select_features(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.Series]:
        """Select relevant features and separate target"""
        # Target variable
        y = df['koi_pdisposition'].copy()
        
        # Drop target and select only numeric features
        X = df.drop(columns=['koi_pdisposition'])
        X = X.select_dtypes(include=[np.number])
        
        # Remove any remaining columns with all NaN
        X = X.dropna(axis=1, how='all')
        
        self.feature_names = X.columns.tolist()
        print(f"Selected {len(self.feature_names)} numeric features")
        
        return X, y
    
    def preprocess(self, df: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray, list]:
        """Full preprocessing pipeline"""
        # 1. Remove identifier columns
        df = self.remove_identifier_columns(df)
        
        # 2. Remove high missing columns
        df = self.remove_high_missing_columns(df, threshold=0.5)
        
        # 3. Handle missing values
        df = self.handle_missing_values(df)
        
        # 4. Select features
        X, y = self.select_features(df)
        
        # 5. Encode labels
        y_encoded = self.label_encoder.fit_transform(y)
        print(f"Label encoding: {dict(zip(self.label_encoder.classes_, [0, 1]))}")
        
        # 6. Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        print(f"Final shape: X={X_scaled.shape}, y={y_encoded.shape}")
        
        return X_scaled, y_encoded, self.feature_names


class ExoplanetClassifier(nn.Module):
    """PyTorch Neural Network for Binary Classification"""
    
    def __init__(self, input_dim: int, hidden_dims: list = [256, 128, 64], dropout: float = 0.3):
        super(ExoplanetClassifier, self).__init__()
        
        layers = []
        prev_dim = input_dim
        
        for i, hidden_dim in enumerate(hidden_dims):
            # Add batch normalization
            layers.append(nn.BatchNorm1d(prev_dim))
            # Add linear layer
            layers.append(nn.Linear(prev_dim, hidden_dim))
            # Add ReLU activation
            layers.append(nn.ReLU())
            # Add dropout (reduce in later layers)
            drop_rate = dropout if i < len(hidden_dims) - 1 else dropout * 0.7
            layers.append(nn.Dropout(drop_rate))
            prev_dim = hidden_dim
        
        # Output layer (2 classes)
        layers.append(nn.Linear(prev_dim, 2))
        
        self.network = nn.Sequential(*layers)
        
    def forward(self, x):
        return self.network(x)


class ModelTrainer:
    """Handles model training, validation, and evaluation"""
    
    def __init__(self, model: nn.Module, device: str = 'cuda' if torch.cuda.is_available() else 'cpu'):
        self.model = model.to(device)
        self.device = device
        self.train_losses = []
        self.val_losses = []
        self.train_accs = []
        self.val_accs = []
        
    def train_epoch(self, train_loader: DataLoader, optimizer: optim.Optimizer, 
                   criterion: nn.Module) -> Tuple[float, float]:
        """Train for one epoch"""
        self.model.train()
        total_loss = 0
        correct = 0
        total = 0
        
        for X_batch, y_batch in train_loader:
            X_batch, y_batch = X_batch.to(self.device), y_batch.to(self.device)
            
            # Forward pass
            optimizer.zero_grad()
            outputs = self.model(X_batch)
            loss = criterion(outputs, y_batch)
            
            # Backward pass
            loss.backward()
            optimizer.step()
            
            # Track metrics
            total_loss += loss.item()
            _, predicted = torch.max(outputs.data, 1)
            total += y_batch.size(0)
            correct += (predicted == y_batch).sum().item()
        
        avg_loss = total_loss / len(train_loader)
        accuracy = 100 * correct / total
        
        return avg_loss, accuracy
    
    def validate(self, val_loader: DataLoader, criterion: nn.Module) -> Tuple[float, float]:
        """Validate the model"""
        self.model.eval()
        total_loss = 0
        correct = 0
        total = 0
        
        with torch.no_grad():
            for X_batch, y_batch in val_loader:
                X_batch, y_batch = X_batch.to(self.device), y_batch.to(self.device)
                
                outputs = self.model(X_batch)
                loss = criterion(outputs, y_batch)
                
                total_loss += loss.item()
                _, predicted = torch.max(outputs.data, 1)
                total += y_batch.size(0)
                correct += (predicted == y_batch).sum().item()
        
        avg_loss = total_loss / len(val_loader)
        accuracy = 100 * correct / total
        
        return avg_loss, accuracy
    
    def train(self, train_loader: DataLoader, val_loader: DataLoader, 
             epochs: int = 50, lr: float = 0.001, patience: int = 10,
             class_weights: torch.Tensor = None):
        """Full training loop with early stopping
        
        Args:
            class_weights: Tensor of shape (2,) to weight classes differently.
                          Set higher weight for CANDIDATE (class 0) to reduce Type II errors
        """
        # Use class weights if provided to reduce missed planets
        if class_weights is not None:
            class_weights = class_weights.to(self.device)
            print(f"Using class weights: {class_weights.cpu().numpy()}")
        criterion = nn.CrossEntropyLoss(weight=class_weights)
        optimizer = optim.Adam(self.model.parameters(), lr=lr, weight_decay=1e-5)
        scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='min', 
                                                         factor=0.5, patience=5)
        
        best_val_loss = float('inf')
        patience_counter = 0
        best_model_state = None
        
        print(f"\nTraining on {self.device}")
        print("=" * 80)
        
        for epoch in range(epochs):
            train_loss, train_acc = self.train_epoch(train_loader, optimizer, criterion)
            val_loss, val_acc = self.validate(val_loader, criterion)
            
            self.train_losses.append(train_loss)
            self.val_losses.append(val_loss)
            self.train_accs.append(train_acc)
            self.val_accs.append(val_acc)
            
            # Learning rate scheduling
            scheduler.step(val_loss)
            
            # Early stopping
            if val_loss < best_val_loss:
                best_val_loss = val_loss
                patience_counter = 0
                best_model_state = self.model.state_dict().copy()
            else:
                patience_counter += 1
            
            if (epoch + 1) % 5 == 0:
                print(f"Epoch [{epoch+1}/{epochs}] - "
                      f"Train Loss: {train_loss:.4f}, Train Acc: {train_acc:.2f}% | "
                      f"Val Loss: {val_loss:.4f}, Val Acc: {val_acc:.2f}%")
            
            if patience_counter >= patience:
                print(f"\nEarly stopping triggered at epoch {epoch+1}")
                break
        
        # Load best model
        if best_model_state is not None:
            self.model.load_state_dict(best_model_state)
        
        print("=" * 80)
        print(f"Training completed. Best validation loss: {best_val_loss:.4f}")
        
    def predict(self, data_loader: DataLoader) -> Tuple[np.ndarray, np.ndarray]:
        """Generate predictions and probabilities"""
        self.model.eval()
        all_preds = []
        all_probs = []
        
        with torch.no_grad():
            for X_batch, _ in data_loader:
                X_batch = X_batch.to(self.device)
                outputs = self.model(X_batch)
                probs = torch.softmax(outputs, dim=1)
                _, predicted = torch.max(outputs, 1)
                
                all_preds.extend(predicted.cpu().numpy())
                all_probs.extend(probs.cpu().numpy())
        
        return np.array(all_preds), np.array(all_probs)
    
    def evaluate(self, test_loader: DataLoader, y_test: np.ndarray, 
                label_encoder: LabelEncoder) -> Dict:
        """Comprehensive model evaluation"""
        y_pred, y_probs = self.predict(test_loader)
        
        # Calculate metrics
        accuracy = accuracy_score(y_test, y_pred)
        precision, recall, f1, _ = precision_recall_fscore_support(y_test, y_pred, average='weighted')
        roc_auc = roc_auc_score(y_test, y_probs[:, 1])
        
        # Confusion matrix
        cm = confusion_matrix(y_test, y_pred)
        
        print("\n" + "=" * 80)
        print("TEST SET EVALUATION")
        print("=" * 80)
        print(f"Accuracy:  {accuracy:.4f} ({accuracy*100:.2f}%)")
        print(f"Precision: {precision:.4f}")
        print(f"Recall:    {recall:.4f}")
        print(f"F1-Score:  {f1:.4f}")
        print(f"ROC-AUC:   {roc_auc:.4f}")
        print("\nClassification Report:")
        print(classification_report(y_test, y_pred, 
                                   target_names=label_encoder.classes_))
        
        print("\nConfusion Matrix:")
        print(cm)
        
        return {
            'accuracy': accuracy,
            'precision': precision,
            'recall': recall,
            'f1': f1,
            'roc_auc': roc_auc,
            'confusion_matrix': cm,
            'predictions': y_pred,
            'probabilities': y_probs
        }
    
    def plot_training_history(self, save_path: str = 'training_history.png'):
        """Plot training and validation metrics"""
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))
        
        # Loss plot
        ax1.plot(self.train_losses, label='Train Loss', linewidth=2)
        ax1.plot(self.val_losses, label='Validation Loss', linewidth=2)
        ax1.set_xlabel('Epoch', fontsize=12)
        ax1.set_ylabel('Loss', fontsize=12)
        ax1.set_title('Training and Validation Loss', fontsize=14)
        ax1.legend()
        ax1.grid(True, alpha=0.3)
        
        # Accuracy plot
        ax2.plot(self.train_accs, label='Train Accuracy', linewidth=2)
        ax2.plot(self.val_accs, label='Validation Accuracy', linewidth=2)
        ax2.set_xlabel('Epoch', fontsize=12)
        ax2.set_ylabel('Accuracy (%)', fontsize=12)
        ax2.set_title('Training and Validation Accuracy', fontsize=14)
        ax2.legend()
        ax2.grid(True, alpha=0.3)
        
        plt.tight_layout()
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        print(f"\nTraining history plot saved to: {save_path}")
        plt.close()


def main():
    """Main execution pipeline"""
    print("=" * 80)
    print("EXOPLANET DISPOSITION CLASSIFIER")
    print("=" * 80)
    
    # Set random seeds for reproducibility
    np.random.seed(42)
    torch.manual_seed(42)
    if torch.cuda.is_available():
        torch.cuda.manual_seed(42)
    
    # 1. Load and preprocess data
    print("\n[1] Loading and preprocessing data...")
    preprocessor = ExoplanetDataPreprocessor('data/cumulative_2025.10.04_02.38.51.csv')
    df = preprocessor.load_data()
    X, y, feature_names = preprocessor.preprocess(df)
    
    # 2. Train-test split (80-20)
    print("\n[2] Splitting data (80% train, 20% test)...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"Train set: {X_train.shape}, Test set: {X_test.shape}")
    print(f"Train class distribution: {np.bincount(y_train)}")
    print(f"Test class distribution: {np.bincount(y_test)}")
    
    # 3. Create PyTorch datasets and dataloaders
    print("\n[3] Creating PyTorch dataloaders...")
    train_dataset = TensorDataset(
        torch.FloatTensor(X_train), 
        torch.LongTensor(y_train)
    )
    test_dataset = TensorDataset(
        torch.FloatTensor(X_test), 
        torch.LongTensor(y_test)
    )
    
    train_loader = DataLoader(train_dataset, batch_size=64, shuffle=True)
    test_loader = DataLoader(test_dataset, batch_size=64, shuffle=False)
    
    # 4. Initialize model
    print("\n[4] Initializing neural network...")
    input_dim = X_train.shape[1]
    model = ExoplanetClassifier(input_dim=input_dim, hidden_dims=[256, 128, 64], dropout=0.3)
    print(f"Model architecture:\n{model}")
    
    # Count parameters
    total_params = sum(p.numel() for p in model.parameters())
    trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
    print(f"\nTotal parameters: {total_params:,}")
    print(f"Trainable parameters: {trainable_params:,}")
    
    # Calculate class weights to reduce Type II errors (missed planets)
    # Give more weight to CANDIDATE class (class 0) to penalize missing them
    print("\n[4.5] Calculating class weights to minimize missed planets...")
    class_counts = np.bincount(y_train)
    print(f"Training class distribution: CANDIDATE={class_counts[0]}, FALSE_POSITIVE={class_counts[1]}")
    
    # Strategy: Weight CANDIDATE class more heavily to catch more real planets
    # Higher weight = model penalized more for missing candidates
    candidate_weight = 1.5  # Increase this to catch more candidates (reduce Type II errors)
    false_positive_weight = 1.0
    
    class_weights = torch.FloatTensor([candidate_weight, false_positive_weight])
    print(f"Class weights: CANDIDATE={candidate_weight}, FALSE_POSITIVE={false_positive_weight}")
   
    # 5. Train model
    print("\n[5] Training model...")
    trainer = ModelTrainer(model)
    trainer.train(train_loader, test_loader, epochs=200, lr=0.001, patience=50, 
                 class_weights=class_weights)
    
    # 6. Evaluate on test set
    print("\n[6] Evaluating on test set...")
    results = trainer.evaluate(test_loader, y_test, preprocessor.label_encoder)
    
    # 7. Save model and visualizations
    print("\n[7] Saving model and visualizations...")
    torch.save(model.state_dict(), 'exoplanet_classifier.pth')
    print("Model saved to: exoplanet_classifier.pth")
    
    # Save preprocessor components
    import pickle
    with open('preprocessor.pkl', 'wb') as f:
        pickle.dump({
            'scaler': preprocessor.scaler,
            'label_encoder': preprocessor.label_encoder,
            'imputer': preprocessor.imputer,
            'feature_names': feature_names
        }, f)
    print("Preprocessor saved to: preprocessor.pkl")
    
    # Plot training history
    trainer.plot_training_history()
    
    # Plot confusion matrix
    plt.figure(figsize=(8, 6))
    sns.heatmap(results['confusion_matrix'], annot=True, fmt='d', cmap='Blues',
                xticklabels=preprocessor.label_encoder.classes_,
                yticklabels=preprocessor.label_encoder.classes_)
    plt.xlabel('Predicted', fontsize=12)
    plt.ylabel('Actual', fontsize=12)
    plt.title('Confusion Matrix', fontsize=14)
    plt.tight_layout()
    plt.savefig('confusion_matrix.png', dpi=300, bbox_inches='tight')
    print("Confusion matrix saved to: confusion_matrix.png")
    plt.close()
    
    print("\n" + "=" * 80)
    print("TRAINING COMPLETE!")
    print("=" * 80)


if __name__ == "__main__":
    main()
