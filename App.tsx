import React, { useState, useCallback } from 'react';
import { analyzePlantImage } from './services/geminiService';
import { savePlantDetectionResult } from './services/backendService'; // Import the new service
import LoadingSpinner from './components/LoadingSpinner';
import ReactMarkdown from 'react-markdown';

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [diseaseResult, setDiseaseResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false); // New state for saving to DB
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false); // New state for save success

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setDiseaseResult(null);
      setError(null);
      setSaveSuccess(false); // Reset save success status
    }
  };

  const handleDetectDisease = useCallback(async () => {
    if (!selectedFile) {
      setError("Please select an image first.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setDiseaseResult(null);
    setSaveSuccess(false); // Reset save success status

    try {
      // Step 1: Analyze plant image with Gemini API
      const geminiResponse = await analyzePlantImage(selectedFile);
      setDiseaseResult(geminiResponse);

      // Step 2: Save the result to the database via backend
      setIsSaving(true);
      await savePlantDetectionResult({
        originalFilename: selectedFile.name,
        mimeType: selectedFile.type,
        geminiResult: geminiResponse,
      });
      setSaveSuccess(true); // Indicate successful save

    } catch (err: any) {
      console.error("Detection/Save error:", err);
      setError(err.message || "An unknown error occurred during detection or saving.");
      setSaveSuccess(false); // Ensure save success is false on error
    } finally {
      setIsLoading(false);
      setIsSaving(false);
    }
  }, [selectedFile]);

  return (
    <div className="flex flex-col items-center justify-center p-4 min-h-screen w-full">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-4xl w-full">
        <h1 className="text-3xl font-bold text-center mb-6 text-green-700">
          Plant Disease Detector
        </h1>

        <div className="mb-6">
          <label
            htmlFor="file-upload"
            className="block text-lg font-medium text-gray-700 mb-2"
          >
            Upload a plant image
          </label>
          <input
            id="file-upload"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500
                       file:mr-4 file:py-2 file:px-4
                       file:rounded-full file:border-0
                       file:text-sm file:font-semibold
                       file:bg-green-50 file:text-green-700
                       hover:file:bg-green-100"
          />
        </div>

        {previewUrl && (
          <div className="mb-6 flex flex-col items-center">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">
              Image Preview
            </h2>
            <img
              src={previewUrl}
              alt="Plant Preview"
              className="max-w-full h-auto rounded-lg shadow-md border border-gray-200"
              style={{ maxHeight: '400px', objectFit: 'contain' }}
            />
          </div>
        )}

        <div className="sticky bottom-0 bg-white p-4 border-t border-gray-200 -mx-8 -mb-8 flex justify-center z-10">
          <button
            onClick={handleDetectDisease}
            disabled={!selectedFile || isLoading || isSaving}
            className="w-full sm:w-auto px-8 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md
                       hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-75
                       disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            aria-live="polite"
          >
            {isLoading && !isSaving ? 'Detecting...' : isSaving ? 'Saving...' : 'Detect Disease'}
          </button>
        </div>

        {(isLoading || isSaving) && (
          <div className="mt-8">
            <LoadingSpinner />
            {isSaving && <p className="text-center text-gray-600 mt-2">Saving results to database...</p>}
          </div>
        )}

        {error && (
          <div
            className="mt-8 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md"
            role="alert"
          >
            <p className="font-bold">Error!</p>
            <p>{error}</p>
          </div>
        )}

        {diseaseResult && (
          <div className="mt-8 p-6 bg-green-50 rounded-lg shadow-inner border border-green-200">
            <h2 className="text-2xl font-bold text-green-800 mb-4">
              Detection Result:
            </h2>
            <div className="prose max-w-none text-gray-800">
              <ReactMarkdown>{diseaseResult}</ReactMarkdown>
            </div>
          </div>
        )}

        {saveSuccess && !error && (
          <div
            className="mt-4 bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded-md"
            role="status"
          >
            <p className="font-bold">Success!</p>
            <p>Detection result saved to database.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
