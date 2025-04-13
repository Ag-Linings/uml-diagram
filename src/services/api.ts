
import { toast } from "sonner";

export interface ProcessSpecsRequest {
  description: string;
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
}

export interface GenerateUMLResponse {
  umlSyntax: string;
}

export interface UMLDiagram {
  id: string;
  title: string;
  description: string;
  umlSyntax: string;
  entities: Entity[];
  relationships: Relationship[];
  createdAt: string;
}

export interface SaveUMLRequest {
  title: string;
  description: string;
  umlSyntax: string;
  entities: Entity[];
  relationships: Relationship[];
}

export interface SaveUMLResponse {
  id: string;
  success: boolean;
}

// Backend API base URL
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api' 
  : 'http://localhost:8000';

// API calls that interact with the backend
export const processSpecs = async (request: ProcessSpecsRequest): Promise<ProcessSpecsResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/process-specs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error processing specifications:", error);
    toast.error("Failed to process specifications");
    throw error;
  }
};

export const generateUML = async (request: GenerateUMLRequest): Promise<GenerateUMLResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/generate-uml`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error generating UML:", error);
    toast.error("Failed to generate UML diagram");
    throw error;
  }
};

export const saveUMLDiagram = async (request: SaveUMLRequest): Promise<SaveUMLResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/save-uml`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error saving UML diagram:", error);
    toast.error("Failed to save UML diagram");
    throw error;
  }
};

export const getUMLHistory = async (): Promise<UMLDiagram[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/uml-history`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error fetching UML history:", error);
    toast.error("Failed to fetch UML history");
    throw error;
  }
};
