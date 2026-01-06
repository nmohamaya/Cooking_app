// Environment configuration
module.exports = {
  // Server
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000'),
  host: process.env.HOST || 'localhost',
  
  // OpenAI (Phase 3)
  openaiApiKey: process.env.OPENAI_API_KEY,
  openaiModel: 'whisper-1',
  
  // File upload
  maxFileSize: process.env.MAX_FILE_SIZE || '500MB',
  uploadDir: process.env.UPLOAD_DIR || './temp/uploads',
  
  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
  
  // Video processing (Phase 2)
  videoTimeoutMinutes: parseInt(process.env.VIDEO_TIMEOUT_MINUTES || '60'),
  maxVideoDurationHours: parseInt(process.env.MAX_VIDEO_DURATION_HOURS || '1'),
  
  // Cost tracking (Phase 3)
  costTrackingEnabled: process.env.COST_TRACKING_ENABLED === 'true',
  costAlertThreshold: parseFloat(process.env.COST_ALERT_THRESHOLD || '1.00'),
  
  // API
  apiVersion: 'v1',
  corsOrigin: process.env.CORS_ORIGIN || '*'
};
