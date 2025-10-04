"""Simple REST server for the ExoExplorer classifier.

Endpoints:
 - GET /health      -> simple health check
 - GET /features    -> returns the model FEATURE_NAMES (full keys)
 - GET /input_fields -> returns shortened input field names (without 'koi_' prefix)
 - POST /predict    -> accepts a single JSON object with either full FEATURE_NAMES keys or the short names

Usage (development):
 uvicorn server:app --reload --port 8000

Make sure to install the server deps: pip install fastapi uvicorn pandas numpy torch scikit-learn
"""

from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from typing import Any, Dict, List, Tuple
import pickle
import torch
import numpy as np
import pandas as pd
import os

from exoplanet_classifier import ExoplanetClassifier


app = FastAPI(title="ExoExplorer - Exoplanet Disposition Classifier")

# Allow CORS for local testing / frontend usage
app.add_middleware(
	CORSMiddleware,
	allow_origins=["*"],
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)


# Load artifacts
PREPROCESSOR_PATH = os.path.join(os.path.dirname(__file__), 'preprocessor.pkl')
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'exoplanet_classifier.pth')

if not os.path.exists(PREPROCESSOR_PATH):
	raise RuntimeError(f'preprocessor.pkl not found at {PREPROCESSOR_PATH}')
if not os.path.exists(MODEL_PATH):
	raise RuntimeError(f'exoplanet_classifier.pth not found at {MODEL_PATH}')

with open(PREPROCESSOR_PATH, 'rb') as f:
	_prep = pickle.load(f)

SCALER = _prep['scaler']
LABEL_ENCODER = _prep['label_encoder']
IMPUTER = _prep['imputer']
FEATURE_NAMES: List[str] = _prep['feature_names']

# Build model and load weights
DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
MODEL = ExoplanetClassifier(input_dim=len(FEATURE_NAMES))
state = torch.load(MODEL_PATH, map_location=DEVICE)
if isinstance(state, dict):
	MODEL.load_state_dict(state)
else:
	MODEL = state
MODEL.to(DEVICE)
MODEL.eval()


@app.get('/health')
def health() -> Dict[str, str]:
	return {"status": "ok"}


@app.get('/features')
def features() -> Dict:
	"""Return full FEATURE_NAMES expected by the model (with prefix)."""
	return {"feature_count": len(FEATURE_NAMES), "feature_names": FEATURE_NAMES}

def _prepare_from_flexible_input(body: Dict[str, Any], prefix: str = 'koi_') -> Tuple[np.ndarray, Dict[str, Any]]:
	"""Accept a request body containing either full FEATURE_NAMES keys or short names (without prefix).

	Returns (X_scaled, meta) where meta contains 'extras' (unexpected keys) and 'filled' (features
	that were missing and filled with NaN for imputation).
	"""
	provided = set(body.keys())
	short_expected = [n[len(prefix):] if n.startswith(prefix) else n for n in FEATURE_NAMES]
	short_set = set(short_expected)

	extras = list(provided - set(FEATURE_NAMES) - short_set)

	# Build prefixed dict: for each expected feature, prefer the exact key, else the short key, else NaN
	prefixed = {}
	filled = []
	for fname, short in zip(FEATURE_NAMES, short_expected):
		if fname in body:
			prefixed[fname] = body[fname]
		elif short in body:
			prefixed[fname] = body[short]
		else:
			prefixed[fname] = np.nan
			filled.append(fname)

	# Prepare for model: coerce numeric, impute, scale
	df = pd.DataFrame([prefixed], columns=FEATURE_NAMES)
	df = df.apply(pd.to_numeric, errors='coerce')
	X_imputed = IMPUTER.transform(df.values)
	X_scaled = SCALER.transform(X_imputed)

	meta = {'not_provided': filled}
	return X_scaled, meta


@app.post('/predict')
def predict(body: Dict[str, Any] = Body(...)) -> Dict:
	"""Accept a single JSON object and return prediction and probabilities.

	The JSON object may include either the full model keys (e.g. 'koi_period') or the short names
	returned by /input_fields (e.g. 'period'). The server will map short -> prefixed names.
	"""
	if not isinstance(body, dict):
		raise HTTPException(status_code=400, detail='Request body must be a JSON object (dict)')

	try:
		X, meta = _prepare_from_flexible_input(body)
	except Exception as e:
		raise HTTPException(status_code=400, detail=f'Error preparing input: {e}')

	X_tensor = torch.from_numpy(X).float().to(DEVICE)
	with torch.no_grad():
		outputs = MODEL(X_tensor)
		probs = torch.softmax(outputs, dim=1).cpu().numpy()[0]
		pred_idx = int(np.argmax(probs))
		pred_label = str(LABEL_ENCODER.inverse_transform([pred_idx])[0])

	return {
		'prediction': pred_label,
		'probabilities': probs.tolist(),
		'meta': meta,
		'feature_order': FEATURE_NAMES,
	}


if __name__ == '__main__':
	# Helpful local runner: uvicorn should be installed in the environment
	import uvicorn

	uvicorn.run('server:app', host='0.0.0.0', port=3001, reload=True)

