
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

// API calls to communicate with the backend
export const processSpecs = async (request: ProcessSpecsRequest): Promise<ProcessSpecsResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/process-specs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to process specifications');
    }

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const generateUML = async (request: GenerateUMLRequest): Promise<GenerateUMLResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/generate-uml`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to generate UML diagram');
    }

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const saveDiagram = async (request: SaveDiagramRequest): Promise<{ diagramId: number }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/save-diagram`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to save diagram');
    }

    const result = await response.json();
    return { diagramId: result.diagram_id };
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const getDiagrams = async (userId: string): Promise<DiagramHistoryItem[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/diagrams/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to fetch diagrams');
    }

    const result = await response.json();
    return result.diagrams;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const getDiagram = async (diagramId: number): Promise<DiagramHistoryItem> => {
  try {
    const response = await fetch(`${API_BASE_URL}/diagram/${diagramId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to fetch diagram');
    }

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};
