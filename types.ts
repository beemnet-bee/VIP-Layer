
export interface HospitalReport {
  id: string;
  facilityName: string;
  region: string;
  reportDate: string;
  unstructuredText: string;
  coordinates?: [number, number];
  anomalies?: {
    type: 'conflicting_data' | 'unverified_claim' | 'outdated_metrics';
    description: string;
    severity: 'low' | 'medium' | 'high';
  }[];
  extractedData?: {
    beds: number;
    specialties: string[];
    equipment: string[];
    equipmentList: { name: string; status: 'Operational' | 'Limited' | 'Offline' }[];
    gaps: string[];
    verified: boolean;
    confidence: number;
  };
}

export interface AnalysisHistoryEntry {
  id: string;
  timestamp: string;
  plan: string;
  steps: AgentStep[];
}

export interface UserProject {
  id: string;
  name: string;
  createdAt: string;
  documents: string[];
  reports: HospitalReport[];
  analysisResult?: string;
  analysisHistory?: AnalysisHistoryEntry[];
  placements?: {
    id: string;
    facilityName: string;
    role: string;
    priority: 'Critical' | 'High' | 'Routine';
    status: 'Planned' | 'Deployed' | 'Completed';
  }[];
}

export interface MedicalDesert {
  id: string;
  region: string;
  populationDensity: 'High' | 'Medium' | 'Low';
  primaryGaps: string[];
  severity: number;
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
    executionTime: number;
    successRate: number;
    hallucinationScore: number;
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

export type ViewState = 'dashboard' | 'map' | 'analysis' | 'audit' | 'simulation' | 'workspace' | 'matching' | 'integrity';

export interface AgentState {
  steps: AgentStep[];
  isThinking: boolean;
  activeView: ViewState;
  queryResult?: any;
}
