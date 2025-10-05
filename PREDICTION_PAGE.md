# Exoplanet Prediction Page

This document describes the new prediction page added to the ExoExplorer application.

## Overview

A dedicated page for predicting whether exoplanet candidates are genuine exoplanets or false positives using the ML prediction model. The page provides two main features:

1. **Single Prediction Form** - Enter individual exoplanet parameters manually
2. **Bulk Upload** - Upload a CSV file with multiple candidates for batch processing

## Accessing the Page

- **URL**: `/predict`
- **Navigation**: Click the "🔮 Predict Exoplanets" button in the main explorer header

## Features

### 1. Single Prediction Form

- Dynamically loads all required feature fields from the ML model
- Supports both full feature names (e.g., `koi_period`) and short names (e.g., `period`)
- All fields are optional - the model will impute missing values
- User-friendly labels with proper capitalization
- Real-time prediction results with probability scores
- Automatic saving of confirmed exoplanets to the database

**Form Fields Include:**
- Orbital Parameters (period, depth, duration, etc.)
- Planetary Properties (radius, temperature, insolation flux, etc.)
- Stellar Properties (effective temperature, surface gravity, radius, mass, etc.)

### 2. Bulk Upload

- Accepts CSV files for batch processing
- Validates file format and displays upload statistics
- Shows file details: name, size, row count, and headers
- Error handling for invalid files

**CSV Format:**
- First row should contain column headers
- Headers should match the feature names from the prediction form
- Example headers: `koi_period`, `koi_depth`, `koi_prad`, etc.

## Technical Details

### API Endpoints Used

1. **GET** `/api/fastapi-proxy?endpoint=/features`
   - Fetches the list of feature names from the ML model
   - Used to dynamically generate form fields

2. **POST** `/api/fastapi-proxy?endpoint=/predict`
   - Sends prediction request to the ML model
   - Request body: JSON object with feature values
   - Response: Prediction label, probabilities, and metadata
   - Confirmed predictions are automatically saved to MongoDB

3. **POST** `/api/upload`
   - Handles CSV file uploads
   - Parses CSV content and returns statistics
   - Can be extended for batch predictions

### Prerequisites

For the prediction page to work, you need to have both servers running:

#### 1. ML Prediction Server (FastAPI)

```bash
cd ml-prediction
source venv/bin/activate  # or activate your virtual environment
python server.py
```

The server will run on `http://localhost:3001`

**Important:** Make sure you have the required model files:
- `exoplanet_classifier.pth` - Trained model weights
- `preprocessor.pkl` - Preprocessing components

#### 2. Next.js Development Server

```bash
cd web
npm install  # if not already installed
npm run dev
```

The web app will run on `http://localhost:3000`

#### 3. MongoDB (Optional)

If you want to save confirmed predictions to the database:

```bash
cd database
docker-compose up -d
```

## User Flow

### Single Prediction

1. Navigate to `/predict` or click "Predict Exoplanets" in the header
2. Fill in the form fields with exoplanet parameters
   - All fields are optional
   - Missing values will be imputed by the model
3. Click "🔮 Predict Exoplanet Status"
4. View the prediction results:
   - Status: CANDIDATE or FALSE POSITIVE
   - Probability scores for each class
   - Database save confirmation (if applicable)

### Bulk Upload

1. Click the "📁 Upload CSV File" button
2. Select a CSV file from your computer
3. View upload statistics:
   - File name and size
   - Number of rows parsed
   - Column headers detected
4. (Future enhancement: Batch prediction results)

## Prediction Results

The prediction result includes:

- **Prediction**: CANDIDATE or FALSE POSITIVE
- **Probabilities**: Array of probabilities for each class
  - Index 0: Usually CANDIDATE
  - Index 1: Usually FALSE POSITIVE
- **Database Status**: 
  - Confirmation if saved to database
  - Alert if planet already exists
  - Planet ID for reference

### Example Result

```json
{
  "prediction": "CANDIDATE",
  "probabilities": [0.92, 0.08],
  "saved_to_db": true,
  "planet_id": "507f1f77bcf86cd799439011"
}
```

## Styling

The page follows the ExoExplorer design system:

- **Color Scheme**: Purple/pink gradient theme
- **Components**: Glass morphism UI elements
- **Responsive**: Works on desktop and mobile devices
- **Animations**: Loading states and transitions
- **Accessibility**: Proper labels and ARIA attributes

## Future Enhancements

Potential improvements for the prediction page:

1. **Batch Prediction Processing**
   - Process uploaded CSV files for bulk predictions
   - Generate downloadable results file
   - Progress tracking for large datasets

2. **Prediction History**
   - Save user's prediction history
   - View past predictions
   - Export predictions

3. **Advanced Features**
   - Feature importance visualization
   - Confidence threshold adjustment
   - Comparison with existing exoplanets

4. **Validation**
   - Real-time field validation
   - Range checks for parameter values
   - Suggestions for typical values

5. **Visualization**
   - Plot prediction confidence
   - Feature distribution charts
   - Comparison visualizations

## Troubleshooting

### ML Server Not Running

**Error**: "Failed to load feature names. Make sure the ML server is running."

**Solution**:
```bash
cd ml-prediction
source venv/bin/activate
python server.py
```

### Features Not Loading

**Error**: Features list is empty

**Possible Causes**:
1. ML server not running on port 3001
2. CORS issues (should be configured in server.py)
3. Missing model files (preprocessor.pkl)

**Solution**: Check the browser console and ML server logs

### Prediction Fails

**Error**: "Prediction failed"

**Possible Causes**:
1. Invalid input data
2. ML model not loaded properly
3. Server connection issues

**Solution**: 
- Check the browser console for detailed error messages
- Verify ML server logs
- Ensure all model files are present

### Upload Issues

**Error**: "Invalid file type"

**Solution**: Ensure you're uploading a CSV file with `.csv` extension

### Database Not Saving

**Issue**: Predictions not being saved to database

**Possible Causes**:
1. MongoDB not running
2. Database connection string not configured
3. Only CONFIRMED predictions are saved (not FALSE POSITIVE)

**Solution**: 
- Check MongoDB is running: `docker ps`
- Verify connection in `.env.local`

## Code Location

- **Page**: `/web/src/app/predict/page.tsx`
- **API Routes**: 
  - `/web/src/app/api/fastapi-proxy/route.ts`
  - `/web/src/app/api/upload/route.ts`
- **ML Server**: `/ml-prediction/server.py`

## Support

For issues or questions:
1. Check the browser console for client-side errors
2. Check ML server logs for prediction errors
3. Review the API response in Network tab
4. Verify all required servers are running

---

**Created**: October 5, 2025  
**Version**: 1.0.0

