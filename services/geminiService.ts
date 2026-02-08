
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getSimulatedMetrics = () => ({
  executionTime: Math.floor(Math.random() * 1200) + 300,
  successRate: 0.98 + Math.random() * 0.02,
  hallucinationScore: Math.random() * 0.02
});

// Discovery Specialist: Searches the live web for real reports
export const runDiscoveryAgent = async (region: string = "Ghana") => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `DISCOVERY_AGENT: Conduct a deep and thorough search for verified, recent health facility data (2024-2025) in ${region}. 
    Focus on tertiary and regional hospitals. Extract specific equipment statuses (Oxygen plants, MRI, Dialysis, Surgical capacity).
    Identify hospitals that have reported critical infrastructure failure or extreme staffing shortages.
    
    Format the output as a JSON array. Be accurate with coordinates.
    [{
      "facilityName": string,
      "region": string,
      "reportDate": string,
      "unstructuredText": string (a comprehensive summary of latest status),
      "coordinates": [number, number],
      "extractedData": {
        "beds": number,
        "specialties": string[],
        "equipmentList": [{"name": string, "status": "Operational" | "Limited" | "Offline"}],
        "gaps": string[],
        "verified": boolean,
        "confidence": number
      }
    }]`,
    config: {
      tools: [{ googleSearch: {} }],
    }
  });

  const rawText = response.text || "[]";
  let cleanedJson = rawText;
  const jsonMatch = rawText.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    cleanedJson = jsonMatch[0];
  }

  try {
    return {
      data: JSON.parse(cleanedJson),
      grounding: response.candidates?.[0]?.groundingMetadata?.groundingChunks,
      metrics: getSimulatedMetrics()
    };
  } catch (e) {
    console.error("Failed to parse Discovery Agent output:", rawText);
    return { data: [], metrics: getSimulatedMetrics() };
  }
};

// Specialist 1: Intelligent Document Parser (IDP) - Enhanced for Accuracy
export const runParserAgent = async (text: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `EXTRACTOR_AGENT: Perform an exhaustive analysis of the following medical report. 
    1. Identify all clinical specialties mentioned.
    2. Catalog every piece of equipment and its precise operational state.
    3. Detect any infrastructure contradictions (e.g., claiming MRI works while electricity is offline).
    4. Calculate a confidence score based on data specificity.
    
    Report: ${text}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          facilityName: { type: Type.STRING },
          beds: { type: Type.INTEGER },
          specialties: { type: Type.ARRAY, items: { type: Type.STRING } },
          equipmentList: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                status: { type: Type.STRING, description: 'Operational, Limited, or Offline' }
              }
            }
          },
          gaps: { type: Type.ARRAY, items: { type: Type.STRING } },
          confidence: { type: Type.NUMBER }
        }
      }
    }
  });
  return {
    ...JSON.parse(response.text),
    metrics: getSimulatedMetrics()
  };
};

// Specialist 3: Strategic Regional Planner - Enhanced for Thoroughness
export const runStrategistAgent = async (allReports: any[]) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview', 
    contents: `STRATEGIST_AGENT: Synthesize an elite-level strategic intervention plan for Ghana's healthcare infrastructure.
    Using the provided hospital data: ${allReports.map(r => r.facilityName).join(', ')}.
    
    Requirements:
    - Identify 'Critical Nodes' (hospitals where equipment failure affects largest population).
    - Map 'Expertise Gaps' where specific doctors are missing.
    - Calculate travel time impact for referrals.
    - Provide a month-by-month rollout for the Virtue Foundation.
    
    Presentation: Use sophisticated Markdown with tables, bullet points, and high-impact headings.`,
    config: {
      tools: [{ googleSearch: {} }],
    }
  });
  
  return {
    text: response.text,
    grounding: response.candidates?.[0]?.groundingMetadata?.groundingChunks,
    metrics: getSimulatedMetrics()
  };
};

// Matcher Agent - Enhanced
export const runMatcherAgent = async (reports: any[]) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `MATCHER_AGENT: Execute an advanced workforce optimization protocol. 
    Cross-reference facility equipment status with missing medical expertise. 
    If a hospital has an Oxygen Plant but no respiratory technician, that's a Critical Match.
    
    Reports: ${JSON.stringify(reports)}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          recommendations: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                facility: { type: Type.STRING },
                role: { type: Type.STRING },
                reason: { type: Type.STRING },
                priority: { type: Type.STRING }
              }
            }
          }
        }
      }
    }
  });
  return {
    ...JSON.parse(response.text),
    metrics: getSimulatedMetrics()
  };
};
