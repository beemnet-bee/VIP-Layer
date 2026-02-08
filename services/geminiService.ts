
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getSimulatedMetrics = () => ({
  executionTime: Math.floor(Math.random() * 1200) + 300,
  successRate: 0.95 + Math.random() * 0.05,
  hallucinationScore: Math.random() * 0.05
});

// Discovery Specialist: Searches the live web for real reports
export const runDiscoveryAgent = async (region: string = "Ghana") => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `DISCOVERY_AGENT: Search the internet for real, recent reports (2024-2025) concerning health facility capabilities, equipment status (oxygen plants, dialysis, MRI, etc.), and staffing shortages in ${region}. 
    Provide a list of at least 5 real hospitals or health centers with specific, currently reported challenges.
    
    Format the output as a JSON array of objects. Each object MUST strictly follow this schema:
    [{
      "facilityName": string,
      "region": string,
      "reportDate": string,
      "unstructuredText": string (detailed summary),
      "coordinates": [number, number] (latitude, longitude),
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
      // Note: responseMimeType is not used here to avoid conflict with grounding tool
    }
  });

  const rawText = response.text || "[]";
  // Manual extraction of JSON from response text as Search Grounding might wrap it
  let cleanedJson = rawText;
  const jsonMatch = rawText.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    cleanedJson = jsonMatch[0];
  } else {
    // If no array found, try to find an object and wrap it
    const objMatch = rawText.match(/\{[\s\S]*\}/);
    if (objMatch) cleanedJson = `[${objMatch[0]}]`;
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

// Specialist 1: Intelligent Document Parser (IDP)
export const runParserAgent = async (text: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `EXTRACTOR_AGENT: Parse this hospital report into structured medical capabilities. Extract specific equipment list with their operational status if mentioned. \n\n Report: ${text}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          facilityName: { type: Type.STRING },
          beds: { type: Type.INTEGER },
          specialties: { type: Type.ARRAY, items: { type: Type.STRING } },
          equipment: { type: Type.ARRAY, items: { type: Type.STRING } },
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

// Specialist 2: Medical Verification & Anomaly Agent
export const runVerifierAgent = async (structuredData: any, rawText: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `VERIFIER_AGENT: Cross-reference the extracted data with the raw text. 
    Focus on verifying equipment availability like X-ray machines, MRI scanners, and surgical equipment. 
    Use Google Search to verify the facility "${structuredData.facilityName}" and its reported capabilities.
    
    Data: ${JSON.stringify(structuredData)} 
    Raw: ${rawText}`,
    config: {
      tools: [{ googleSearch: {} }]
    }
  });
  
  return {
    text: response.text,
    grounding: response.candidates?.[0]?.groundingMetadata?.groundingChunks,
    metrics: getSimulatedMetrics()
  };
};

// Specialist 3: Strategic Regional Planner
export const runStrategistAgent = async (allReports: any[], location?: { lat: number, lng: number }) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview', 
    contents: `STRATEGIST_AGENT: Analyze regional medical deserts in Ghana.
    Find actual distances to nearest hubs for these facilities: ${allReports.map(r => r.facilityName).join(', ')}.
    Synthesize a 12-month resource allocation plan based on infrastructure gaps and distances.
    Present your findings with Markdown tables and clear headings.`,
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

// Specialist 4: Matcher Agent
export const runMatcherAgent = async (reports: any[]) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `MATCHER_AGENT: Based on these hospital reports and their extracted gaps, suggest optimal placements for medical professionals (Doctors, Nurses, Specialists). 
    Identify which hospital needs which specialty most urgently.
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

// Specialist 5: Predictor Agent
export const runPredictorAgent = async (reports: any[]) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `PREDICTOR_AGENT: Forecast future infrastructure needs and medical desert evolution based on these hospital reports and current trends.
    Reports: ${JSON.stringify(reports)}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          forecasts: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                region: { type: Type.STRING },
                futureGap: { type: Type.STRING },
                probability: { type: Type.NUMBER },
                timeframe: { type: Type.STRING }
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

// Specialist 6: Text2SQL / Natural Language Query
export const runQueryAgent = async (query: string, dataContext: any) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `QUERY_ENGINE: Answer this NGO planner query using the provided dataset and Google Search.
    Query: "${query}"
    Local Data: ${JSON.stringify(dataContext)}`,
    config: {
      tools: [{ googleSearch: {} }]
    }
  });
  
  return {
    text: response.text,
    grounding: response.candidates?.[0]?.groundingMetadata?.groundingChunks,
    metrics: getSimulatedMetrics()
  };
};
