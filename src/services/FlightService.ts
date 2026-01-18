import type { FlightData, IFlightDataSource, ConfigField } from '../types';

const mapStatus = (status: string): FlightData['status'] => {
  switch (status?.toLowerCase()) {
    case 'active': return 'Active';
    case 'landed': return 'Landed';
    case 'cancelled': return 'Cancelled';
    case 'incident':
    case 'diverted':
    case 'delayed': return 'Delayed';
    default: return 'Scheduled';
  }
};

const formatTime = (isoDate: string): string => {
  if (!isoDate) return '--:--';
  return new Date(isoDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// 1. Mock Data Source (For testing/demo without API keys)
export class MockFlightDataSource implements IFlightDataSource {
  name = "Demo Mock Data";
  configFields: ConfigField[] = [];

  configure(_config: Record<string, string>): void {
    // No configuration needed
  }

  getConfig(): Record<string, string> {
    return {};
  }

  async getFlight(code: string, date: string): Promise<FlightData | null> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Return fake data based on input
    return {
      flightCode: code.toUpperCase(),
      date: date,
      status: Math.random() > 0.5 ? 'On Time' : 'Delayed',
      origin: 'JFK',
      destination: 'LHR',
      departureTime: '10:00 AM',
      arrivalTime: '10:00 PM',
      airline: 'Mock Airlines',
      // Extended Mock Data
      originTerminal: '4',
      originGate: 'C12',
      destinationTerminal: '5',
      destinationGate: 'A1',
      baggageClaim: '7',
      aircraft: 'Boeing 787-9',
    } as any;
  }
}

// 2. Placeholder for a Real API (e.g., AviationStack)
export class AviationStackSource implements IFlightDataSource {
  name = "AviationStack (Free Tier)";
  private apiKey = localStorage.getItem('aviationstack_api_key') || '';

  configFields: ConfigField[] = [
    { key: 'apiKey', label: 'API Access Key', type: 'password' }
  ];

  configure(config: Record<string, string>): void {
    if (config.apiKey !== undefined) {
      this.apiKey = config.apiKey;
      localStorage.setItem('aviationstack_api_key', this.apiKey);
    }
  }

  getConfig(): Record<string, string> {
    return { apiKey: this.apiKey };
  }

  async getFlight(code: string, date: string): Promise<FlightData | null> {
    if (!this.apiKey) {
      throw new Error("API Key missing. Please configure the service.");
    }

    // Note: Free tier of AviationStack often requires HTTP. 
    // If using HTTPS on free tier, it may fail.
    const url = `http://api.aviationstack.com/v1/flights?access_key=${this.apiKey}&flight_iata=${code}`;
    
    const response = await fetch(url);
    const json = await response.json();

    if (json.error) {
      throw new Error(json.error.info || 'AviationStack API Error');
    }

    // AviationStack returns an array. We try to find the one matching the date, or default to the first.
    const flight = json.data?.find((f: any) => f.flight_date === date) || json.data?.[0];

    if (!flight) return null;

    console.log('AviationStack flight data:', flight);

    return {
      flightCode: flight.flight?.iata || code,
      date: flight.flight_date,
      status: mapStatus(flight.flight_status),
      origin: flight.departure?.iata || flight.departure?.airport || 'UNK',
      destination: flight.arrival?.iata || flight.arrival?.airport || 'UNK',
      departureTime: formatTime(flight.departure?.scheduled),
      arrivalTime: formatTime(flight.arrival?.scheduled),
      airline: flight.airline?.name || 'Unknown Airline',
      // Extended Data Mapping
      originTerminal: flight.departure?.terminal,
      originGate: flight.departure?.gate,
      destinationTerminal: flight.arrival?.terminal,
      destinationGate: flight.arrival?.gate,
      baggageClaim: flight.arrival?.baggage,
      aircraft: flight.aircraft?.iata,
      delayMinutes: flight.departure?.delay,
    };
  }
}

// 3. AirLabs (Free Tier)
export class AirLabsSource implements IFlightDataSource {
  name = "AirLabs (Free Tier)";
  private apiKey = localStorage.getItem('airlabs_api_key') || '';

  configFields: ConfigField[] = [
    { key: 'apiKey', label: 'API Key', type: 'password' }
  ];

  configure(config: Record<string, string>): void {
    if (config.apiKey !== undefined) {
      this.apiKey = config.apiKey;
      localStorage.setItem('airlabs_api_key', this.apiKey);
    }
  }

  getConfig(): Record<string, string> {
    return { apiKey: this.apiKey };
  }

  async getFlight(code: string, _date: string): Promise<FlightData | null> {
    if (!this.apiKey) {
      throw new Error("API Key missing. Please configure the service.");
    }

    // AirLabs free tier primarily focuses on live flights.
    const url = `https://airlabs.co/api/v9/flight?flight_iata=${code}&api_key=${this.apiKey}`;

    const response = await fetch(url);
    const json = await response.json();

    if (json.error) {
      throw new Error(json.error.message || 'AirLabs API Error');
    }

    const flight = json.response?.[0];
    if (!flight) return null;

    return {
      flightCode: flight.flight_iata || code,
      date: _date, // Assuming live data matches requested date context
      status: mapStatus(flight.status),
      origin: flight.dep_iata || flight.dep_icao || 'UNK',
      destination: flight.arr_iata || flight.arr_icao || 'UNK',
      departureTime: formatTime(flight.dep_time || flight.dep_estimated),
      arrivalTime: formatTime(flight.arr_time || flight.arr_estimated),
      airline: flight.airline_iata || 'Unknown',
      originTerminal: flight.dep_terminal,
      originGate: flight.dep_gate,
      destinationTerminal: flight.arr_terminal,
      destinationGate: flight.arr_gate,
      baggageClaim: flight.arr_baggage,
      aircraft: flight.aircraft_icao,
      delayMinutes: flight.delayed,
    };
  }
}

// 4. AeroDataBox (RapidAPI)
export class AeroDataBoxSource implements IFlightDataSource {
  name = "AeroDataBox (RapidAPI)";
  private apiKey = localStorage.getItem('aerodatabox_api_key') || '';

  configFields: ConfigField[] = [
    { key: 'apiKey', label: 'RapidAPI Key', type: 'password' }
  ];

  configure(config: Record<string, string>): void {
    if (config.apiKey !== undefined) {
      this.apiKey = config.apiKey;
      localStorage.setItem('aerodatabox_api_key', this.apiKey);
    }
  }

  getConfig(): Record<string, string> {
    return { apiKey: this.apiKey };
  }

  async getFlight(code: string, date: string): Promise<FlightData | null> {
    if (!this.apiKey) {
      throw new Error("API Key missing. Please configure the service.");
    }

    const url = `https://aerodatabox.p.rapidapi.com/flights/number/${code}/${date}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': this.apiKey,
        'X-RapidAPI-Host': 'aerodatabox.p.rapidapi.com'
      }
    });

    if (!response.ok) {
      throw new Error(`AeroDataBox Error: ${response.statusText}`);
    }

    const json = await response.json();
    const flight = json[0];

    if (!flight) return null;

    return {
      flightCode: flight.number || code,
      date: date,
      status: mapStatus(flight.status),
      origin: flight.departure?.airport?.iata || 'UNK',
      destination: flight.arrival?.airport?.iata || 'UNK',
      departureTime: formatTime(flight.departure?.scheduledTimeLocal),
      arrivalTime: formatTime(flight.arrival?.scheduledTimeLocal),
      airline: flight.airline?.name || 'Unknown',
      originTerminal: flight.departure?.terminal,
      originGate: flight.departure?.gate,
      destinationTerminal: flight.arrival?.terminal,
      destinationGate: flight.arrival?.gate,
      baggageClaim: flight.arrival?.baggage,
      aircraft: flight.aircraft?.model,
    };
  }
}

// Factory to manage sources
export const availableSources: IFlightDataSource[] = [
  new AviationStackSource(),
  new AirLabsSource(),
  new AeroDataBoxSource(),
  new MockFlightDataSource()
];
