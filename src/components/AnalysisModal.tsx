import React from 'react';
import { X, Brain, CheckCircle, XCircle, ExternalLink, RefreshCw } from 'lucide-react';

interface AnalysisResult {
  verdict: 'True' | 'False' | 'Mixed';
  true_rate: number;
  reasoning: string[];
  sources: string[];
}

interface CombinedAnalysis {
  true_rate: number;
  verdict: 'True' | 'False' | 'Mixed';
  reasoning: string[];
  sources: string[];
  models: {
    openai: AnalysisResult;
    gemini: AnalysisResult;
  };
}

interface AnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: CombinedAnalysis | null;
  isLoading: boolean;
  postContent: string;
  imageUrl?: string;
  onRegenerate: () => void;
  communityVotes: {
    trueVotes: number;
    fakeVotes: number;
  };
}

export function AnalysisModal({
  isOpen,
  onClose,
  analysis,
  isLoading,
  postContent,
  imageUrl,
  onRegenerate,
  communityVotes
}: AnalysisModalProps) {
  if (!isOpen) return null;

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case 'True': return 'text-green-600 bg-green-50';
      case 'False': return 'text-red-600 bg-red-50';
      default: return 'text-yellow-600 bg-yellow-50';
    }
  };

  const getVerdictIcon = (verdict: string) => {
    switch (verdict) {
      case 'True': return <CheckCircle className="w-5 h-5" />;
      case 'False': return <XCircle className="w-5 h-5" />;
      default: return <Brain className="w-5 h-5" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div className="flex items-center">
            <Brain className="w-6 h-6 text-blue-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900">AI Fact-Check Analysis</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Post Content */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Analyzing Post:</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-800">{postContent}</p>
              {imageUrl && (
                <div className="mt-3">
                  <img
                    src={imageUrl}
                    alt="Post content"
                    className="rounded-lg max-w-full h-auto max-h-48 object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Brain className="w-12 h-12 text-blue-600 animate-pulse mx-auto mb-4" />
                <p className="text-gray-600">AI models are analyzing the content...</p>
              </div>
            </div>
          )}

          {/* Analysis Results */}
          {analysis && !isLoading && (
            <div className="space-y-6">
              {/* Overall Result */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">AI Analysis Result</h3>
                  <button
                    onClick={onRegenerate}
                    className="flex items-center text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Regenerate
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-2xl font-bold text-orange-600">True Rate: {analysis.true_rate}%</p>
                  </div>
                  <div className={`flex items-center px-3 py-2 rounded-lg ${getVerdictColor(analysis.verdict)}`}>
                    {getVerdictIcon(analysis.verdict)}
                    <span className="ml-2 font-semibold">Overall Verdict: {analysis.verdict}</span>
                  </div>
                </div>
              </div>

              {/* Reasoning */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Reasoning:</h4>
                <ul className="space-y-2">
                  {analysis.reasoning.map((reason, index) => (
                    <li key={index} className="flex items-start">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span className="text-gray-700">{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Sources */}
              {analysis.sources.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Sources:</h4>
                  <div className="space-y-2">
                    {analysis.sources.map((source, index) => (
                      <a
                        key={index}
                        href={source}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        {source}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Individual Model Results */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">OpenAI Analysis</h4>
                  <div className={`flex items-center px-2 py-1 rounded ${getVerdictColor(analysis.models.openai.verdict)} mb-2`}>
                    {getVerdictIcon(analysis.models.openai.verdict)}
                    <span className="ml-2 text-sm">{analysis.models.openai.verdict} ({analysis.models.openai.true_rate}%)</span>
                  </div>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Gemini Analysis</h4>
                  <div className={`flex items-center px-2 py-1 rounded ${getVerdictColor(analysis.models.gemini.verdict)} mb-2`}>
                    {getVerdictIcon(analysis.models.gemini.verdict)}
                    <span className="ml-2 text-sm">{analysis.models.gemini.verdict} ({analysis.models.gemini.true_rate}%)</span>
                  </div>
                </div>
              </div>

              {/* Community Votes */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Community Votes:</h4>
                <div className="flex space-x-6">
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    <span>True ({communityVotes.trueVotes})</span>
                  </div>
                  <div className="flex items-center text-red-600">
                    <XCircle className="w-5 h-5 mr-2" />
                    <span>False ({communityVotes.fakeVotes})</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}