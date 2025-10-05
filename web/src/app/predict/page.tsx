'use client';

import { useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import Link from 'next/link';

interface PredictionResult {
  prediction: string;
  probabilities: number[];
  saved_to_db?: boolean;
  planet_id?: string;
  already_exists?: boolean;
}

interface UploadResult {
  message: string;
  fileName: string;
  fileSize: number;
  rowCount: number;
  headers: string[];
  sampleData: any[];
}

// Common exoplanet features for the form
const FORM_FIELDS = [
  { name: 'koi_period', label: 'Orbital Period (days)', placeholder: 'e.g., 10.5' },
  { name: 'koi_time0bk', label: 'Transit Epoch (days)', placeholder: 'e.g., 170.5' },
  { name: 'koi_impact', label: 'Impact Parameter', placeholder: 'e.g., 0.5' },
  { name: 'koi_duration', label: 'Transit Duration (hours)', placeholder: 'e.g., 3.5' },
  { name: 'koi_depth', label: 'Transit Depth (ppm)', placeholder: 'e.g., 1000' },
  { name: 'koi_prad', label: 'Planetary Radius (Earth radii)', placeholder: 'e.g., 2.5' },
  { name: 'koi_teq', label: 'Equilibrium Temperature (K)', placeholder: 'e.g., 300' },
  { name: 'koi_insol', label: 'Insolation Flux (Earth flux)', placeholder: 'e.g., 1.5' },
  { name: 'koi_model_snr', label: 'Transit Signal-to-Noise', placeholder: 'e.g., 15.5' },
  { name: 'koi_steff', label: 'Stellar Effective Temperature (K)', placeholder: 'e.g., 5800' },
  { name: 'koi_slogg', label: 'Stellar Surface Gravity (log10)', placeholder: 'e.g., 4.5' },
  { name: 'koi_srad', label: 'Stellar Radius (Solar radii)', placeholder: 'e.g., 1.0' },
  { name: 'ra', label: 'Right Ascension (deg)', placeholder: 'e.g., 290.5' },
  { name: 'dec', label: 'Declination (deg)', placeholder: 'e.g., 45.2' },
  { name: 'koi_kepmag', label: 'Kepler Magnitude', placeholder: 'e.g., 12.5' },
];

export default function PredictPage() {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Convert string values to numbers, keep empty strings as null
      const cleanedData: Record<string, any> = {};
      Object.entries(formData).forEach(([key, value]) => {
        if (value === '' || value === undefined) {
          cleanedData[key] = null;
        } else {
          const numValue = parseFloat(value);
          cleanedData[key] = isNaN(numValue) ? null : numValue;
        }
      });

      console.log('Sending prediction request:', cleanedData);

      const response = await fetch('/api/fastapi-proxy?endpoint=/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanedData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.detail || 'Prediction failed');
      }

      const data = await response.json();
      console.log('Prediction result:', data);
      setResult(data);
    } catch (err) {
      console.error('Prediction error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during prediction');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadLoading(true);
    setUploadError(null);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      setUploadResult(data);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'An error occurred during upload');
    } finally {
      setUploadLoading(false);
      e.target.value = '';
    }
  };

  const handleFillSample = () => {
    // Good quality exoplanet candidate - targeting ~85% CANDIDATE confidence
    setFormData({
      'koi_period': '289.864067',
      'koi_period_err1': '0.0008',
      'koi_period_err2': '-0.0008',
      'koi_time0bk': '170.5',
      'koi_impact': '0.425',
      'koi_impact_err1': '0.045',
      'koi_impact_err2': '-0.045',
      'koi_duration': '7.56500',
      'koi_duration_err1': '0.085',
      'koi_duration_err2': '-0.085',
      'koi_depth': '980.0',
      'koi_depth_err1': '12.5',
      'koi_depth_err2': '-12.5',
      'koi_prad': '2.34',
      'koi_prad_err1': '0.18',
      'koi_prad_err2': '-0.18',
      'koi_teq': '257.0',
      'koi_insol': '1.03',
      'koi_insol_err1': '0.15',
      'koi_insol_err2': '-0.15',
      'koi_model_snr': '215.5',
      'koi_steff': '5550.00',
      'koi_steff_err1': '75.00',
      'koi_steff_err2': '-75.00',
      'koi_slogg': '4.442',
      'koi_slogg_err1': '0.065',
      'koi_slogg_err2': '-0.065',
      'koi_srad': '0.9250',
      'koi_srad_err1': '0.0550',
      'koi_srad_err2': '-0.0550',
      'koi_smass': '0.985',
      'koi_smass_err1': '0.065',
      'koi_smass_err2': '-0.065',
      'koi_kepmag': '11.664',
      'koi_count': '1',
      'koi_num_transits': '145',
      'koi_max_mult_ev': '175.2',
      'koi_max_sngle_ev': '95.4',
      'koi_ror': '0.0312',
      'koi_ror_err1': '0.0008',
      'koi_ror_err2': '-0.0008',
      'koi_srho': '2.15',
      'koi_srho_err1': '0.45',
      'koi_srho_err2': '-0.45',
      'koi_dor': '164.8',
      'koi_dor_err1': '6.8',
      'koi_dor_err2': '-6.8',
      'koi_sma': '0.849',
      'koi_incl': '89.45',
      'koi_bin_oedp_sig': '4.2',
      'ra': '289.217500',
      'dec': '47.884460',
    });
  };

  const handleClear = () => {
    setFormData({});
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-purple-500/20">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <span className="text-2xl">🪐</span>
            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
              ExoExplorer
            </h1>
          </Link>
          <div className="flex gap-4">
            <GlassButton onClick={() => window.location.href = '/'}>
              Back to Explorer
            </GlassButton>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-24">
        <div className="max-w-7xl mx-auto">
          {/* Title */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-purple-600">
              Exoplanet Prediction System
            </h2>
            <p className="text-purple-300/80 text-lg">
              Use our ML model to predict if your candidate is an exoplanet or false positive
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Prediction Form */}
            <div className="lg:col-span-2">
              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-purple-300">
                    Exoplanet Data Form
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={handleFillSample}
                      className="px-4 py-2 text-sm bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 rounded-lg text-blue-300 transition-colors"
                    >
                      Fill Sample Data
                    </button>
                    <button
                      onClick={handleClear}
                      className="px-4 py-2 text-sm bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 rounded-lg text-red-300 transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
                
                {error && (
                  <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300">
                    <strong>Error:</strong> {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Form Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {FORM_FIELDS.map(field => (
                      <div key={field.name} className="flex flex-col">
                        <label 
                          htmlFor={field.name}
                          className="text-sm font-medium text-purple-300 mb-1"
                        >
                          {field.label}
                        </label>
                        <input
                          id={field.name}
                          type="number"
                          step="any"
                          value={formData[field.name] || ''}
                          onChange={(e) => handleInputChange(field.name, e.target.value)}
                          className="px-3 py-2 bg-slate-900/50 border border-purple-500/30 rounded-lg
                                   text-purple-100 placeholder-purple-400/50
                                   focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500
                                   transition-colors"
                          placeholder={field.placeholder}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Submit Button */}
                  <div className="pt-4 border-t border-purple-500/20">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full backdrop-blur-md transition-all duration-300 rounded-xl px-5 py-3 border shadow-lg bg-purple-500/20 hover:bg-purple-500/30 border-purple-400/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="text-white font-medium">
                        {loading ? (
                          <span className="flex items-center justify-center gap-2">
                            <span className="animate-spin">⚙️</span>
                            Predicting...
                          </span>
                        ) : (
                          '🔮 Predict Exoplanet Status'
                        )}
                      </span>
                    </button>
                  </div>
                </form>

                {/* Results Section */}
                {result && (
                  <div className="mt-6 p-6 bg-gradient-to-br from-purple-900/40 to-pink-900/40 border border-purple-500/50 rounded-lg">
                    <h4 className="text-xl font-bold mb-4 text-purple-200">
                      🎯 Prediction Result
                    </h4>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
                        <span className="text-purple-300 text-lg">Classification:</span>
                        <span className={`text-2xl font-bold px-4 py-2 rounded-lg ${
                          result.prediction === 'CONFIRMED' || result.prediction === 'CANDIDATE'
                            ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                            : 'bg-red-500/20 text-red-400 border border-red-500/50'
                        }`}>
                          {result.prediction}
                        </span>
                      </div>

                      <div className="space-y-3">
                        <span className="text-purple-300 font-semibold block">Confidence Scores:</span>
                        {result.probabilities && result.probabilities.map((prob, idx) => (
                          <div key={idx} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-purple-400">
                                {idx === 0 ? 'Candidate' : 'False Positive'}
                              </span>
                              <span className="text-purple-200 font-bold">
                                {(prob * 100).toFixed(2)}%
                              </span>
                            </div>
                            <div className="w-full bg-slate-900/50 rounded-full h-3 overflow-hidden border border-purple-500/30">
                              <div 
                                className={`h-full transition-all duration-500 ${
                                  idx === 0 
                                    ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                                    : 'bg-gradient-to-r from-red-500 to-pink-500'
                                }`}
                                style={{ width: `${(prob * 100).toFixed(1)}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      {result.saved_to_db && (
                        <div className="mt-4 p-3 bg-green-900/30 border border-green-500/50 rounded-lg">
                          <p className="text-green-300 text-sm flex items-center gap-2">
                            <span className="text-lg">✅</span>
                            <span>Confirmed exoplanet saved to database!</span>
                          </p>
                          {result.planet_id && (
                            <p className="text-green-400/80 text-xs mt-1 ml-7">
                              Planet ID: {result.planet_id}
                            </p>
                          )}
                        </div>
                      )}

                      {result.already_exists && (
                        <div className="mt-4 p-3 bg-blue-900/30 border border-blue-500/50 rounded-lg">
                          <p className="text-blue-300 text-sm flex items-center gap-2">
                            <span className="text-lg">ℹ️</span>
                            <span>This planet already exists in the database</span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </GlassCard>
            </div>

            {/* Sidebar with Bulk Upload and Info */}
            <div className="lg:col-span-1 space-y-6">
              {/* Bulk Upload Card */}
              <GlassCard className="p-6">
                <h3 className="text-2xl font-bold mb-4 text-purple-300">
                  Bulk Upload
                </h3>
                
                <p className="text-purple-300/70 text-sm mb-6">
                  Upload a CSV file with multiple exoplanet candidates for batch processing.
                </p>

                {uploadError && (
                  <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
                    {uploadError}
                  </div>
                )}

                <input
                  type="file"
                  accept=".csv"
                  onChange={handleBulkUpload}
                  disabled={uploadLoading}
                  className="hidden"
                  id="bulk-upload"
                />
                <label 
                  htmlFor="bulk-upload"
                  className={`block w-full backdrop-blur-md transition-all duration-300 rounded-xl px-5 py-3 border shadow-lg bg-purple-500/20 hover:bg-purple-500/30 border-purple-400/30 text-center ${uploadLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <span className="text-white font-medium">
                    {uploadLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="animate-spin">⚙️</span>
                        Uploading...
                      </span>
                    ) : (
                      '📁 Upload CSV File'
                    )}
                  </span>
                </label>

                {uploadResult && (
                  <div className="mt-4 p-4 bg-gradient-to-br from-green-900/40 to-emerald-900/40 border border-green-500/50 rounded-lg">
                    <h4 className="font-bold text-green-300 mb-3 flex items-center gap-2">
                      <span>✅</span>
                      <span>Upload Successful</span>
                    </h4>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-green-300/70">File:</span>
                        <span className="text-green-200 font-medium text-right truncate ml-2" title={uploadResult.fileName}>
                          {uploadResult.fileName}
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-green-300/70">Size:</span>
                        <span className="text-green-200">
                          {(uploadResult.fileSize / 1024).toFixed(2)} KB
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-green-300/70">Rows:</span>
                        <span className="text-green-200 font-bold">
                          {uploadResult.rowCount}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </GlassCard>

              {/* Info Card */}
              <GlassCard className="p-6">
                <h3 className="text-xl font-bold mb-4 text-purple-300">
                  ℹ️ How It Works
                </h3>
                <div className="space-y-3 text-sm text-purple-300/80">
                  <p>
                    <strong className="text-purple-300">1.</strong> Fill in the exoplanet parameters (or use sample data)
                  </p>
                  <p>
                    <strong className="text-purple-300">2.</strong> Click "Predict" to analyze the data
                  </p>
                  <p>
                    <strong className="text-purple-300">3.</strong> View the ML model's classification and confidence scores
                  </p>
                  <p className="text-xs text-purple-400/60 pt-2 border-t border-purple-500/20">
                    Note: All fields are optional. The model will handle missing values automatically.
                  </p>
                </div>
              </GlassCard>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
