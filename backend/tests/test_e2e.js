const axios = require('axios');
const BASE = 'http://localhost:3000';

async function poll(url, label, timeout) {
  const start = Date.now();
  while (true) {
    if (Date.now() - start > timeout) throw new Error(label + ' timed out');
    await new Promise(r => setTimeout(r, 3000));
    const res = await axios.get(url);
    console.log('[' + label + '] status=' + res.data.status + ' progress=' + res.data.progress + '%');
    if (res.data.status === 'completed') return res.data;
    if (res.data.status === 'failed') throw new Error(label + ' failed: ' + (res.data.error || JSON.stringify(res.data)));
  }
}

(async () => {
  console.log('Starting download...');
  const dl = await axios.post(BASE + '/api/download', { url: 'https://www.youtube.com/watch?v=rm_9cPXrv4A' });
  console.log('Download job:', dl.data.jobId);
  
  const dlResult = await poll(BASE + '/api/download/' + dl.data.jobId, 'Download', 300000);
  console.log('Download result:', JSON.stringify(dlResult.result));
  
  const audioPath = dlResult.result.audioPath;
  const duration = dlResult.result.duration || 900;
  console.log('Starting transcription for:', audioPath, 'duration:', duration);
  const tr = await axios.post(BASE + '/api/transcribe', { audioFilePath: audioPath, language: 'en', audioMinutes: Math.ceil(duration / 60) });
  console.log('Transcribe job:', tr.data.jobId);
  
  const trResult = await poll(BASE + '/api/transcribe/' + tr.data.jobId, 'Transcribe', 300000);
  console.log('Transcription text (first 300 chars):', (trResult.result?.text || 'NO TEXT').substring(0, 300));
  console.log('Confidence:', trResult.result?.confidence);
  console.log('SUCCESS!');
})().catch(e => console.error('FAILED:', e.message));
