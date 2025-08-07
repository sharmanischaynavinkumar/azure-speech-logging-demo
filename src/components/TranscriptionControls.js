import './TranscriptionControls.css';

const TranscriptionControls = ({ 
  transcriptionMode, 
  onModeChange, 
  isTranscribing, 
  isConnected, 
  onStart, 
  onStop, 
  onClear 
}) => {
  return (
    <div className="transcription-controls">
      <h2>Transcription Controls</h2>
      
      <div className="mode-selection">
        <label>
          <input
            type="radio"
            value="oneTime"
            checked={transcriptionMode === 'oneTime'}
            onChange={(e) => onModeChange(e.target.value)}
            disabled={isTranscribing}
          />
          One-time Recognition
        </label>
        <label>
          <input
            type="radio"
            value="continuous"
            checked={transcriptionMode === 'continuous'}
            onChange={(e) => onModeChange(e.target.value)}
            disabled={isTranscribing}
          />
          Continuous Recognition
        </label>
      </div>

      <div className="control-buttons">
        {!isTranscribing ? (
          <button 
            onClick={onStart}
            disabled={!isConnected}
            className="btn btn-primary"
          >
            Start Transcription
          </button>
        ) : (
          <button 
            onClick={onStop}
            className="btn btn-danger"
          >
            Stop Transcription
          </button>
        )}
        
        <button 
          onClick={onClear}
          disabled={isTranscribing}
          className="btn btn-secondary"
        >
          Clear Text
        </button>
      </div>
    </div>
  );
};

export default TranscriptionControls;
