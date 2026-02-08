
import { HospitalReport, MedicalDesert } from '../types';

export const GHANA_HOSPITALS: HospitalReport[] = [
  {
    id: 'h1',
    facilityName: 'Korle-Bu Teaching Hospital',
    region: 'Greater Accra',
    reportDate: '2025-05-12',
    coordinates: [5.5501, -0.2245],
    unstructuredText: 'Main tertiary facility. Oncology wing is operational but chemo drugs are low. CT scanner is intermittent. Staffed with 12 specialists but nurses are protesting pay.',
    extractedData: {
      beds: 2000,
      specialties: ['Oncology', 'Cardiology', 'Surgery'],
      equipment: ['CT Scanner', 'Radiotherapy', 'X-ray'],
      equipmentList: [
        { name: 'CT Scanner', status: 'Limited' },
        { name: 'Radiotherapy', status: 'Operational' },
        { name: 'X-ray', status: 'Operational' }
      ],
      gaps: ['Drug supply chain', 'Nursing retention'],
      verified: true,
      confidence: 0.95
    }
  },
  {
    id: 'h2',
    facilityName: 'Tamale Regional Hospital',
    region: 'Northern',
    reportDate: '2025-06-01',
    coordinates: [9.4007, -0.8393],
    unstructuredText: 'Critical shortage of ventilators. We have 3 but 2 are broken. Serving a population of 1M+. Neonatal unit is overcrowded. Water treatment plant showing critical error logs.',
    anomalies: [
      {
        type: 'unverified_claim',
        description: 'Facility claims high ICU capacity but power backup systems are reported as "Offline".',
        severity: 'high'
      },
      {
        type: 'conflicting_data',
        description: 'Neonatal metrics conflict with reported nurse-to-patient ratios.',
        severity: 'medium'
      }
    ],
    extractedData: {
      beds: 400,
      specialties: ['Pediatrics', 'Obstetrics'],
      equipment: ['Ventilators (1 working)', 'X-ray'],
      equipmentList: [
        { name: 'Ventilators', status: 'Limited' },
        { name: 'X-ray', status: 'Operational' },
        { name: 'Oxygen Plant', status: 'Offline' },
        { name: 'Water Treatment', status: 'Offline' }
      ],
      gaps: ['NICU capacity', 'Equipment maintenance'],
      verified: true,
      confidence: 0.88
    }
  },
  {
    id: 'h3',
    facilityName: 'Sefwi-Wiawso Municipal',
    region: 'Western North',
    reportDate: '2025-06-10',
    coordinates: [6.3248, -2.4833],
    unstructuredText: 'Rural outpost. No stable internet. We have basic surgical kits but no anesthesia machine. Transporting patients takes 6 hours to nearest hub.',
    anomalies: [
      {
        type: 'outdated_metrics',
        description: 'Staffing numbers have not been updated since Q3 2024.',
        severity: 'low'
      }
    ],
    extractedData: {
      beds: 50,
      specialties: ['General Medicine'],
      equipment: ['Basic Surgical Kit'],
      equipmentList: [
        { name: 'Basic Surgical Kit', status: 'Operational' },
        { name: 'Anesthesia', status: 'Offline' }
      ],
      gaps: ['Anesthesia', 'Telemedicine', 'Logistics'],
      verified: false,
      confidence: 0.75
    }
  },
  {
    id: 'h4',
    facilityName: 'Bolgatanga Central',
    region: 'Upper East',
    reportDate: '2025-07-01',
    coordinates: [10.8907, -0.8493],
    unstructuredText: 'Water shortages affecting dialysis unit. Only one physician on rotation for 500k residents.',
    extractedData: {
      beds: 250,
      specialties: ['Dialysis', 'Internal Medicine'],
      equipment: ['Hemodialysis Machines'],
      equipmentList: [
        { name: 'Hemodialysis Machines', status: 'Operational' },
        { name: 'Water Treatment', status: 'Offline' }
      ],
      gaps: ['Potable Water', 'Specialist Staff'],
      verified: true,
      confidence: 0.91
    }
  }
];

export const DESERT_REGIONS: MedicalDesert[] = [
  {
    id: 'd1',
    region: 'Northern Cluster',
    populationDensity: 'Medium',
    primaryGaps: ['Specialist surgeons', 'NICU equipment'],
    severity: 85,
    coordinates: [9.4007, -0.8393],
    predictedRisk: 0.82,
    predictiveGaps: ['Intensive Care capacity', 'Specialized trauma center']
  },
  {
    id: 'd2',
    region: 'Western North Hub',
    populationDensity: 'Low',
    primaryGaps: ['Emergency transport', 'Diagnostic imaging'],
    severity: 92,
    coordinates: [6.3248, -2.4833],
    predictedRisk: 0.95,
    predictiveGaps: ['Broadband for telemedicine', 'Cold chain storage']
  },
  {
    id: 'd3',
    region: 'Upper East Frontier',
    populationDensity: 'Low',
    primaryGaps: ['Physician saturation', 'Clean water'],
    severity: 78,
    coordinates: [10.8907, -0.8493],
    predictedRisk: 0.75,
    predictiveGaps: ['Solar infrastructure', 'Mobile health units']
  },
  {
    id: 'd4',
    region: 'Oti Corridor',
    populationDensity: 'Low',
    primaryGaps: ['Maternal care', 'Vaccine storage'],
    severity: 89,
    coordinates: [7.9, 0.4],
    predictedRisk: 0.88,
    predictiveGaps: ['Emergency air-lift', 'Blood bank']
  }
];
