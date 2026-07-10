export type AnalysisResult = {
  matched: boolean;
  confidence: number;
  message: string;
  reason: string;
};

export type AnalyzeFrameInput = {
  mission: string;
  imageBuffer: Buffer;
  mimeType: string;
};
