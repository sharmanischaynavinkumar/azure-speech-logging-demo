import './SpeechConfig.css';

const SpeechConfig = ({ config, onConfigChange, isConnected, onConnect, onDisconnect }) => {
  const handleInputChange = (field, value) => {
    onConfigChange({
      ...config,
      [field]: value
    });
  };

  // Check which values are loaded from environment variables
  const fromEnv = {
    subscriptionKey: !!process.env.REACT_APP_AZURE_SPEECH_KEY,
    region: !!process.env.REACT_APP_AZURE_SPEECH_REGION,
    storageSasUrl: !!process.env.REACT_APP_AZURE_STORAGE_SAS_URL,
    containerName: !!process.env.REACT_APP_AZURE_STORAGE_CONTAINER,
    language: !!process.env.REACT_APP_DEFAULT_LANGUAGE
  };

  const languages = [
    { code: 'en-US', name: 'English (US)' },
    { code: 'en-GB', name: 'English (UK)' },
    { code: 'es-ES', name: 'Spanish (Spain)' },
    { code: 'fr-FR', name: 'French (France)' },
    { code: 'de-DE', name: 'German (Germany)' },
    { code: 'it-IT', name: 'Italian (Italy)' },
    { code: 'pt-BR', name: 'Portuguese (Brazil)' },
    { code: 'zh-CN', name: 'Chinese (Mandarin)' },
    { code: 'ja-JP', name: 'Japanese' },
    { code: 'ko-KR', name: 'Korean' }
  ];

  return (
    <div className="speech-config">
      <h2>Azure Speech Service Configuration</h2>
      
      <div className="config-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="subscriptionKey">
              Subscription Key <span className="required">*</span>
              {fromEnv.subscriptionKey && <span className="env-indicator">(from .env)</span>}
            </label>
            <input
              id="subscriptionKey"
              type="password"
              value={config.subscriptionKey}
              onChange={(e) => handleInputChange('subscriptionKey', e.target.value)}
              placeholder="Enter your Azure Speech Service subscription key"
              disabled={isConnected}
              className="form-input"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="region">
              Region <span className="required">*</span>
              {fromEnv.region && <span className="env-indicator">(from .env)</span>}
            </label>
            <input
              id="region"
              type="text"
              value={config.region}
              onChange={(e) => handleInputChange('region', e.target.value)}
              placeholder="e.g., eastus, westus2, northeurope"
              disabled={isConnected}
              className="form-input"
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="language">
              Language
              {fromEnv.language && <span className="env-indicator">(from .env)</span>}
            </label>
            <select
              id="language"
              value={config.language}
              onChange={(e) => handleInputChange('language', e.target.value)}
              disabled={isConnected}
              className="form-select"
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="storageSasUrl">
              Storage SAS URL <span className="required">*</span>
              {fromEnv.storageSasUrl && <span className="env-indicator">(from .env)</span>}
            </label>
            <input
              id="storageSasUrl"
              type="password"
              value={config.storageSasUrl || ''}
              onChange={(e) => handleInputChange('storageSasUrl', e.target.value)}
              placeholder="https://youraccount.blob.core.windows.net/container-name?sv=2022-11-02&ss=b..."
              disabled={isConnected}
              className="form-input"
            />
            <small className="form-help">
              Your Azure Storage account SAS URL with appropriate permissions for saving audio and transcript files.
            </small>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="containerName">
              Container Name
              {fromEnv.containerName && <span className="env-indicator">(from .env)</span>}
            </label>
            <input
              id="containerName"
              type="text"
              value={config.containerName || 'speech-logs'}
              onChange={(e) => handleInputChange('containerName', e.target.value)}
              placeholder="speech-logs"
              disabled={isConnected}
              className="form-input"
            />
          </div>
        </div>
        
        <div className="connection-controls">
          <div className="connection-info">
            <strong>Connection Status:</strong> 
            <span className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
              {isConnected ? 'Connected to Azure Services' : 'Not Connected'}
            </span>
          </div>
          
          {!isConnected ? (
            <div className="connection-section">
              <button
                onClick={onConnect}
                disabled={!config.subscriptionKey || !config.region || !config.storageSasUrl}
                className="btn btn-primary btn-connect"
              >
                Initialize & Connect to Azure Services
              </button>
              <p className="connection-help">
                This will connect to Azure Speech Service, initialize audio recording, and prepare storage for logging.
              </p>
            </div>
          ) : (
            <div className="connection-section">
              <button
                onClick={onDisconnect}
                className="btn btn-secondary btn-disconnect"
              >
                Disconnect from Services
              </button>
              <p className="connection-help">
                You can now start transcription. Disconnecting will stop all services and clear the session.
              </p>
            </div>
          )}
        </div>
      </div>
      
      <div className="config-info">
        <p>
          <strong>Note:</strong> You need an Azure Speech Service subscription key and region for transcription,
          and an Azure Storage account SAS URL for saving audio and transcript files.
          Get your Azure credentials from the <a href="https://portal.azure.com" target="_blank" rel="noopener noreferrer">Azure Portal</a>.
        </p>
      </div>
    </div>
  );
};

export default SpeechConfig;
