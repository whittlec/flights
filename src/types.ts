export interface ConfigField {
  key: string;
  label: string;
  type: 'text' | 'password';
}

export interface FlightData {
  flightCode: string;
  date: string;
  status: 'Scheduled' | 'Active' | 'Landed' | 'Cancelled' | 'Delayed';
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  airline: string;
  // Extended details
  originTerminal?: string;
  originGate?: string;
  destinationTerminal?: string;
  destinationGate?: string;
  baggageClaim?: string;
  aircraft?: string;
  delayMinutes?: number;
}

export interface IFlightDataSource {
  name: string;
  configFields: ConfigField[];
  configure(config: Record<string, string>): void;
  getConfig(): Record<string, string>;
  getFlight(code: string, date: string): Promise<FlightData | null>;
}
