
// API Service for UML Generator

export interface ProcessSpecsRequest {
  description: string;
  userId?: string;
}

export interface ProcessSpecsResponse {
  enhancedDescription: string;
  entities: Entity[];
  relationships: Relationship[];
}

export interface Entity {
  name: string;
  attributes: Attribute[];
  methods: Method[];
}

export interface Attribute {
  name: string;
  type: string;
  visibility: 'public' | 'private' | 'protected';
}

export interface Method {
  name: string;
  returnType: string;
  parameters: Parameter[];
  visibility: 'public' | 'private' | 'protected';
}

export interface Parameter {
  name: string;
  type: string;
}

export interface Relationship {
  source: string;
  target: string;
  type: 'inheritance' | 'composition' | 'aggregation' | 'association' | 'dependency';
  label?: string;
}

export interface GenerateUMLRequest {
  entities: Entity[];
  relationships: Relationship[];
  userId?: string;
}

export interface GenerateUMLResponse {
  umlSyntax: string;
}

export interface SaveDiagramRequest {
  title: string;
  description: string;
  userId: string;
  entities: Entity[];
  relationships: Relationship[];
  umlSyntax: string;
}

export interface DiagramHistoryItem {
  id: number;
  title: string;
  description: string;
  created_at: string;
  entities: Entity[];
  relationships: Relationship[];
  umlSyntax: string;
}

// Get API URL from environment or default to localhost in development
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

console.log('Using API URL:', API_BASE_URL);

// Helper function to handle API responses
async function handleResponse(response: Response) {
  if (!response.ok) {
    let errorMsg = 'API error occurred';
    try {
      const errorData = await response.json();
      errorMsg = errorData.detail || `Error ${response.status}: ${response.statusText}`;
    } catch (e) {
      errorMsg = `Error ${response.status}: ${response.statusText}`;
    }
    console.error('API Error:', errorMsg);
    throw new Error(errorMsg);
  }
  return response.json();
}

// API calls to communicate with the backend
export const processSpecs = async (request: ProcessSpecsRequest): Promise<ProcessSpecsResponse> => {
  try {
    console.log('Sending request to process specs:', request);
    const response = await fetch(`${API_BASE_URL}/process-specs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const data = await handleResponse(response);
    console.log('Received specs response:', data);
    return data;
  } catch (error) {
    console.error('API Error in processSpecs:', error);
    throw error;
  }
};

export const generateUML = async (request: GenerateUMLRequest): Promise<GenerateUMLResponse> => {
  try {
    console.log('Sending request to generate UML:', request);
    const response = await fetch(`${API_BASE_URL}/generate-uml`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const data = await handleResponse(response);
    console.log('Received UML response:', data);
    return data;
  } catch (error) {
    console.error('API Error in generateUML:', error);
    throw error;
  }
};

export const saveDiagram = async (request: SaveDiagramRequest): Promise<{ diagramId: number }> => {
  try {
    console.log('Saving diagram:', request);
    const response = await fetch(`${API_BASE_URL}/save-diagram`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const result = await handleResponse(response);
    console.log('Save diagram response:', result);
    return { diagramId: result.diagram_id };
  } catch (error) {
    console.error('API Error in saveDiagram:', error);
    throw error;
  }
};

export const getDiagrams = async (userId: string): Promise<DiagramHistoryItem[]> => {
  try {
    console.log('Fetching diagrams for user:', userId);
    const response = await fetch(`${API_BASE_URL}/diagrams/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await handleResponse(response);
    console.log('Get diagrams response:', result);
    return result.diagrams;
  } catch (error) {
    console.error('API Error in getDiagrams:', error);
    throw error;
  }
};

export const getDiagram = async (diagramId: number): Promise<DiagramHistoryItem> => {
  try {
    console.log('Fetching diagram:', diagramId);
    const response = await fetch(`${API_BASE_URL}/diagram/${diagramId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await handleResponse(response);
    console.log('Get diagram response:', result);
    return result;
  } catch (error) {
    console.error('API Error in getDiagram:', error);
    throw error;
  }
};
