import { useState, useRef, useCallback } from 'react';
import './App.css';
import SpeechConfig from './components/SpeechConfig';
import TranscriptionDisplay from './components/TranscriptionDisplay';
import TranscriptionControls from './components/TranscriptionControls';
import LoggingStatus from './components/LoggingStatus';
import { initializeSpeechService, startTranscription, stopTranscription } from './services/speechService';
import storageService from './services/storageService';
import audioRecordingService from './services/audioRecordingService';

function App() {
  const [config, setConfig] = useState({
    subscriptionKey: process.env.REACT_APP_AZURE_SPEECH_KEY || '',
    region: process.env.REACT_APP_AZURE_SPEECH_REGION || '',
    language: process.env.REACT_APP_DEFAULT_LANGUAGE || 'en-US',
    storageSasUrl: process.env.REACT_APP_AZURE_STORAGE_SAS_URL || '',
    containerName: process.env.REACT_APP_AZURE_STORAGE_CONTAINER || 'speech-logs'
  });
  
  const [transcriptionMode, setTranscriptionMode] = useState('continuous'); // 'continuous' or 'oneTime'
  const [transcriptionText, setTranscriptionText] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState('Ready to connect');
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [savedSegmentCount, setSavedSegmentCount] = useState(0);
  
  const recognizerRef = useRef(null);
  const currentTranscriptSegment = useRef('');
  const sessionSegments = useRef([]);
  const currentSessionIdRef = useRef(null);

  const handleConfigChange = useCallback((newConfig) => {
    setConfig(newConfig);
  }, []);

  const generateSessionId = useCallback(() => {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-');
    return `session-${timestamp}`;
  }, []);

  const handleAudioSegmentComplete = useCallback(async (audioBlob, segmentIndex) => {
    console.log(`Processing audio segment ${segmentIndex}, size: ${audioBlob?.size} bytes`);
    
    try {
      // Get current session ID from the ref
      const sessionId = currentSessionIdRef.current;
      
      if (sessionId && audioBlob) {
        // Upload the audio segment
        const audioFileName = await storageService.uploadAudioSegment(audioBlob, sessionId, segmentIndex);
        console.log(`Audio uploaded: ${audioFileName}`);
        
        // Get the transcript text accumulated so far
        const transcriptText = currentTranscriptSegment.current.trim() || '[No speech detected in this segment]';
        
        // Upload corresponding transcript segment
        const transcriptFileName = await storageService.uploadTranscriptSegment(
          transcriptText,
          sessionId,
          segmentIndex,
          audioFileName
        );
        console.log(`Transcript uploaded: ${transcriptFileName}`);
        
        sessionSegments.current.push({
          segmentIndex,
          audioFileName,
          transcriptFileName,
          transcript: transcriptText,
          timestamp: new Date().toISOString()
        });
        
        // Reset the current transcript segment for the next segment
        currentTranscriptSegment.current = '';
        
        // Update saved segment count for display
        setSavedSegmentCount(sessionSegments.current.length);
        setStatus(`Saved segment ${segmentIndex + 1} (${sessionSegments.current.length} total)`);
      } else {
        console.warn('Missing sessionId or audioBlob:', { sessionId, audioBlob });
      }
    } catch (error) {
      console.error('Failed to save segment:', error);
      setStatus(`Failed to save segment ${segmentIndex}: ${error.message}`);
    }
  }, []); // No dependencies needed since we use refs

  const handleConnect = useCallback(async () => {
    if (!config.subscriptionKey || !config.region) {
      setStatus('Please provide subscription key and region');
      return;
    }

    try {
      setStatus('Connecting to Azure services...');
      
      // Initialize Audio Recording Service first
      await audioRecordingService.initialize();
      console.log('Audio Recording Service initialized');
      
      // Initialize Speech Service (it will use the same default microphone)
      const recognizer = await initializeSpeechService(config);
      recognizerRef.current = recognizer;
      console.log('Speech Service initialized');
      
      // Initialize Storage Service with SAS URL
      if (!config.storageSasUrl) {
        throw new Error('Storage SAS URL is required');
      }
      await storageService.initialize(config.storageSasUrl, config.containerName);
      console.log('Storage Service initialized');
      
      setIsConnected(true);
      setStatus('Connected successfully to all services');
    } catch (error) {
      console.error('Connection error:', error);
      setStatus(`Connection failed: ${error.message}`);
      setIsConnected(false);
    }
  }, [config]);

  const handleStartTranscription = useCallback(async () => {
    if (!recognizerRef.current) {
      setStatus('Please connect first');
      return;
    }

    try {
      setIsTranscribing(true);
      setTranscriptionText('');
      setStatus('Starting transcription...');

      // Generate new session ID
      const sessionId = generateSessionId();
      setCurrentSessionId(sessionId);
      currentSessionIdRef.current = sessionId; // Update ref too
      setSavedSegmentCount(0);
      sessionSegments.current = [];
      currentTranscriptSegment.current = '';

      // Start audio recording
      audioRecordingService.startRecording(transcriptionMode, handleAudioSegmentComplete);

      await startTranscription(
        recognizerRef.current,
        transcriptionMode,
        {
          onRecognizing: (text) => {
            setTranscriptionText(prev => {
              const lines = prev.split('\n');
              lines[lines.length - 1] = `[Recognizing] ${text}`;
              return lines.join('\n');
            });
          },
          onRecognized: (text) => {
            if (text.trim()) {
              const timestamp = new Date().toLocaleTimeString();
              
              // Add to current segment for storage
              currentTranscriptSegment.current += (currentTranscriptSegment.current ? ' ' : '') + text;
              
              // Update display
              setTranscriptionText(prev => {
                const lines = prev.split('\n');
                lines[lines.length - 1] = `[${timestamp}] ${text}`;
                return lines.join('\n') + '\n';
              });

              // For one-time mode, trigger segment creation immediately
              if (transcriptionMode === 'oneTime') {
                // Stop audio recording to trigger segment processing
                setTimeout(() => {
                  audioRecordingService.stopRecording();
                }, 1000); // Small delay to ensure audio is captured
                
                setTimeout(async () => {
                  try {
                    // Save session summary
                    const sessionData = {
                      sessionId,
                      mode: transcriptionMode,
                      language: config.language,
                      startTime: new Date().toISOString(),
                      segments: sessionSegments.current,
                      totalSegments: sessionSegments.current.length
                    };
                    await storageService.uploadSessionSummary(sessionData);
                  } catch (error) {
                    console.error('Failed to save session summary:', error);
                  }
                }, 2000);
              }
            }
          },
          onError: (error) => {
            setStatus(`Transcription error: ${error}`);
            setIsTranscribing(false);
            audioRecordingService.stopRecording();
          },
          onSessionStopped: () => {
            setIsTranscribing(false);
            setStatus('Transcription stopped');
            audioRecordingService.stopRecording();
          }
        }
      );

      setStatus(transcriptionMode === 'continuous' ? 'Listening continuously...' : 'Listening for speech...');
    } catch (error) {
      setStatus(`Failed to start transcription: ${error.message}`);
      setIsTranscribing(false);
      audioRecordingService.stopRecording();
    }
  }, [transcriptionMode, config.language, generateSessionId, handleAudioSegmentComplete]);

  const handleStopTranscription = useCallback(async () => {
    if (recognizerRef.current) {
      try {
        await stopTranscription(recognizerRef.current);
        audioRecordingService.stopRecording();
        setIsTranscribing(false);
        setStatus('Transcription stopped');

        // Save session summary for continuous mode
        if (transcriptionMode === 'continuous' && currentSessionId) {
          try {
            const sessionData = {
              sessionId: currentSessionId,
              mode: transcriptionMode,
              language: config.language,
              startTime: new Date().toISOString(),
              segments: sessionSegments.current,
              totalSegments: sessionSegments.current.length
            };
            await storageService.uploadSessionSummary(sessionData);
            setStatus('Transcription stopped and session saved');
          } catch (error) {
            console.error('Failed to save session summary:', error);
            setStatus('Transcription stopped but failed to save session');
          }
        }
      } catch (error) {
        setStatus(`Failed to stop transcription: ${error.message}`);
      }
    }
  }, [transcriptionMode, currentSessionId, config.language]);

  const handleClearTranscription = useCallback(() => {
    setTranscriptionText('');
  }, []);

  const handleDisconnect = useCallback(() => {
    if (recognizerRef.current) {
      recognizerRef.current.close();
      recognizerRef.current = null;
    }
    audioRecordingService.cleanup();
    setIsConnected(false);
    setIsTranscribing(false);
    setCurrentSessionId(null);
    currentSessionIdRef.current = null; // Clear ref too
    setSavedSegmentCount(0);
    sessionSegments.current = [];
    currentTranscriptSegment.current = '';
    setStatus('Disconnected');
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Azure Speech Service Logging Demo</h1>
      </header>

      <div className="status-bar">
        <div className="status-content">
          <span className="status-label">System Status:</span>
          <span className={`status-text ${isConnected ? 'connected' : 'disconnected'}`}>
            {status}
          </span>
        </div>
      </div>

      <main className="app-main">
        <div className="config-section">
          <SpeechConfig
            config={config}
            onConfigChange={handleConfigChange}
            isConnected={isConnected}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
          />
        </div>

        <div className="controls-section">
          <TranscriptionControls
            transcriptionMode={transcriptionMode}
            onModeChange={setTranscriptionMode}
            isTranscribing={isTranscribing}
            isConnected={isConnected}
            onStart={handleStartTranscription}
            onStop={handleStopTranscription}
            onClear={handleClearTranscription}
          />
        </div>

        <div className="logging-section">
          <LoggingStatus
            isLogging={isTranscribing && isConnected}
            sessionId={currentSessionId}
            segmentCount={savedSegmentCount}
          />
        </div>

        <div className="transcription-section">
          <TranscriptionDisplay
            transcriptionText={transcriptionText}
            isTranscribing={isTranscribing}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
