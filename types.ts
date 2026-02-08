
export interface HospitalReport {
  id: string;
  facilityName: string;
  region: string;
  reportDate: string;
  unstructuredText: string;
  coordinates?: [number, number]; // Added for geographic filtering
  extractedData?: {
    beds: number;
    specialties: string[];
    equipment: string[];
    equipmentList: { name: string; status: 'Operational' | 'Limited' | 'Offline' }[]; // Detailed list
    gaps: string[];
    verified: boolean;
    confidence: number;
  };
}

export interface MedicalDesert {
  id: string;
  region: string;
  populationDensity: 'High' | 'Medium' | 'Low';
  primaryGaps: string[];
  severity: number; // 0-100
  coordinates: [number, number];
  predictedRisk: number;
  predictiveGaps: string[];
}

export interface AgentStep {
  id: string;
  agentName: 'Parser' | 'Verifier' | 'Strategist' | 'Matcher' | 'Predictor';
  action: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  timestamp: string;
  citation?: string;
  description?: string;
  metadata?: any;
  metrics?: {
    executionTime: number; // ms
    successRate: number; // 0-1
    hallucinationScore: number; // 0-1 (lower is better)
  };
  detailedLogs?: string[];
  intermediateOutput?: any;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  event: string;
  user: string;
  status: 'success' | 'warning' | 'info';
}

export type ViewState = 'dashboard' | 'map' | 'analysis' | 'audit' | 'simulation';

export interface AgentState {
  steps: AgentStep[];
  isThinking: boolean;
  activeView: ViewState;
  queryResult?: any;
}
