export type AnalysisMetrics = {
  captureMs: number;
  encodingMs: number;
  uploadAndModelMs: number;
  totalMs: number;
  imageBytes: number;
  frameDifference: number | null;
  skippedAnalyses: number;
};

export type AnalysisResult = {
  matched: boolean;
  confidence: number;
  message: string;
  reason: string;
  metrics?: AnalysisMetrics;
};

export type HistoryEntry = {
  time: string;
  matched: boolean;
  message: string;
  reason?: string;
};
