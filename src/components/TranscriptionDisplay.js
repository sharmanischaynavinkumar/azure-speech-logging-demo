import './TranscriptionDisplay.css';

const TranscriptionDisplay = ({ transcriptionText, isTranscribing }) => {
  return (
    <div className="transcription-display">
      <h2>Transcription Results</h2>
      
      <div className={`transcription-area ${isTranscribing ? 'listening' : ''}`}>
        {transcriptionText ? (
          <pre className="transcription-text">{transcriptionText}</pre>
        ) : (
          <p className="placeholder">
            {isTranscribing 
              ? 'Listening... Start speaking to see transcription results.'
              : 'Connect to services and start transcription to see results here.'
            }
          </p>
        )}
      </div>
      
      {isTranscribing && (
        <div className="listening-indicator">
          <div className="pulse"></div>
          <span>Listening...</span>
        </div>
      )}
    </div>
  );
};

export default TranscriptionDisplay;
