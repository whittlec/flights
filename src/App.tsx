import React, { useState, useEffect } from 'react';
import './App.css';
import { availableSources } from './services/FlightService';
import type { FlightData, IFlightDataSource } from './types';

function App() {
  const [sourceIndex, setSourceIndex] = useState<number>(0);
  const [flightCode, setFlightCode] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [result, setResult] = useState<FlightData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showConfig, setShowConfig] = useState(false);
  const [configValues, setConfigValues] = useState<Record<string, string>>({});

  const currentSource: IFlightDataSource = availableSources[sourceIndex];

  useEffect(() => {
    setConfigValues(currentSource.getConfig());
    setError('');
  }, [sourceIndex, currentSource]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flightCode) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const data = await currentSource.getFlight(flightCode, date);
      if (data) {
        setResult(data);
      } else {
        setError('Flight not found.');
      }
    } catch (err) {
      setError('Error fetching flight data. Check API configuration.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfigSave = (e: React.FormEvent) => {
    e.preventDefault();
    currentSource.configure(configValues);
    setShowConfig(false);
  };

  return (
    <div className="app-container">
      <header>
        <h1>✈️ FlightTrack</h1>
        <div className="source-selector">
          <label htmlFor="source">Source: </label>
          <select 
            id="source"
            value={sourceIndex} 
            onChange={(e) => setSourceIndex(Number(e.target.value))}
          >
            {availableSources.map((src, idx) => (
              <option key={src.name} value={idx}>{src.name}</option>
            ))}
          </select>
          <button 
            className="icon-btn" 
            onClick={() => setShowConfig(!showConfig)}
            aria-label="Configure Source"
          >
            ⚙️
          </button>
        </div>
      </header>

      <main>
        {showConfig ? (
          <form onSubmit={handleConfigSave} className="config-card">
            <h3>Configuration: {currentSource.name}</h3>
            {currentSource.configFields.length === 0 && <p>No configuration needed for this source.</p>}
            {currentSource.configFields.map((field) => (
              <div className="input-group" key={field.key}>
                <label htmlFor={field.key}>{field.label}</label>
                <input
                  id={field.key}
                  type={field.type}
                  value={configValues[field.key] || ''}
                  onChange={(e) => setConfigValues({ ...configValues, [field.key]: e.target.value })}
                />
              </div>
            ))}
            <button type="submit" className="save-btn">Save Configuration</button>
          </form>
        ) : (
        <form onSubmit={handleSearch} className="search-card">
          <div className="input-group">
            <label htmlFor="flightCode">Flight Code</label>
            <input
              id="flightCode"
              type="text"
              placeholder="e.g. AA123"
              value={flightCode}
              onChange={(e) => setFlightCode(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="date">Date</label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <button type="submit" disabled={loading} className="search-btn">
            {loading ? 'Searching...' : 'Track Flight'}
          </button>
        </form>
        )}

        {error && <div className="error-msg" role="alert">{error}</div>}

        {result && (
          <div className="result-card" data-testid="result-card">
            <div className="flight-header">
              <span className="airline">{result.airline}</span>
              <span className={`status ${result.status.toLowerCase().replace(' ', '-')}`}>
                {result.status}
              </span>
            </div>
            <div className="route">
              <div className="city">
                <span className="code">{result.origin}</span>
                <span className="time">{result.departureTime}</span>
                {(result.originTerminal || result.originGate) && (
                  <span className="gate-info">
                    {result.originTerminal && `T${result.originTerminal}`}
                    {result.originTerminal && result.originGate && ' • '}
                    {result.originGate && `Gate ${result.originGate}`}
                  </span>
                )}
              </div>
              <div className="arrow">➝</div>
              <div className="city">
                <span className="code">{result.destination}</span>
                <span className="time">{result.arrivalTime}</span>
                {(result.destinationTerminal || result.destinationGate) && (
                  <span className="gate-info">
                    {result.destinationTerminal && `T${result.destinationTerminal}`}
                    {result.destinationTerminal && result.destinationGate && ' • '}
                    {result.destinationGate && `Gate ${result.destinationGate}`}
                  </span>
                )}
              </div>
            </div>
            <div className="meta">
              <small>Date: {result.date}</small>
            </div>

            {(result.aircraft || result.baggageClaim || result.delayMinutes) && (
              <div className="details-grid">
                {result.aircraft && (
                  <div className="detail-item">
                    <small>Aircraft</small>
                    <span>{result.aircraft}</span>
                  </div>
                )}
                {result.baggageClaim && (
                  <div className="detail-item">
                    <small>Baggage</small>
                    <span>{result.baggageClaim}</span>
                  </div>
                )}
                {!!result.delayMinutes && (
                  <div className="detail-item">
                    <small>Delay</small>
                    <span className="status delayed">{result.delayMinutes} min</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
