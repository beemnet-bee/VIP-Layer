
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
    The response MUST be a structured list matching our schema.`,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            facilityName: { type: Type.STRING },
            region: { type: Type.STRING },
            reportDate: { type: Type.STRING },
            unstructuredText: { type: Type.STRING, description: "A detailed summary of the findings from the web search." },
            coordinates: { 
              type: Type.ARRAY, 
              items: { type: Type.NUMBER },
              description: "[latitude, longitude]" 
            },
            extractedData: {
              type: Type.OBJECT,
              properties: {
                beds: { type: Type.INTEGER },
                specialties: { type: Type.ARRAY, items: { type: Type.STRING } },
                equipmentList: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      status: { type: Type.STRING }
                    }
                  }
                },
                gaps: { type: Type.ARRAY, items: { type: Type.STRING } },
                verified: { type: Type.BOOLEAN },
                confidence: { type: Type.NUMBER }
              }
            }
          }
        }
      }
    }
  });

  // Since response.text might contain markdown formatting around the JSON, we sanitize it
  const rawText = response.text || "[]";
  const jsonStr = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
  
  return {
    data: JSON.parse(jsonStr),
    grounding: response.candidates?.[0]?.groundingMetadata?.groundingChunks,
    metrics: getSimulatedMetrics()
  };
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
    model: 'gemini-2.5-flash', 
    contents: `STRATEGIST_AGENT: Analyze regional medical deserts in Ghana.
    Find actual distances to nearest hubs for these facilities: ${allReports.map(r => r.facilityName).join(', ')}.
    Synthesize a 12-month resource allocation plan based on infrastructure gaps and distances.`,
    config: {
      tools: [{ googleMaps: {} }, { googleSearch: {} }],
      toolConfig: {
        retrievalConfig: {
          latLng: location ? { latitude: location.lat, longitude: location.lng } : undefined
        }
      }
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
