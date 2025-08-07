import './LoggingStatus.css';

const LoggingStatus = ({ isLogging, sessionId, segmentCount }) => {
  return (
    <div className="logging-status">
      <h2>Logging Status</h2>
      
      <div className="status-grid">
        <div className="status-item">
          <label>Recording Status:</label>
          <span className={`status-value ${isLogging ? 'active' : 'inactive'}`}>
            {isLogging ? 'Recording & Saving' : 'Inactive'}
          </span>
        </div>
        
        <div className="status-item">
          <label>Session ID:</label>
          <span className="status-value">
            {sessionId ? (
              <code>{sessionId}</code>
            ) : (
              'No active session'
            )}
          </span>
        </div>
        
        <div className="status-item">
          <label>Segments Saved:</label>
          <span className="status-value">
            {segmentCount}
          </span>
        </div>
      </div>
      
      {isLogging && (
        <div className="logging-indicator">
          <div className="recording-dot"></div>
          <span>Files are being saved to Azure Storage</span>
        </div>
      )}
    </div>
  );
};

export default LoggingStatus;
