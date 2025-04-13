
// These are the mock API endpoints that would be actual REST API calls 
// in a production environment with proper backend

import { mockProcessSpecsResponse, mockGenerateUMLResponse, mockSaveUMLDiagram, mockGetUMLHistory } from './mockData';
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

// Mock API calls that simulate server interaction
export const processSpecs = async (request: ProcessSpecsRequest): Promise<ProcessSpecsResponse> => {
  try {
    // In a real implementation, this would make an API call to /process-specs
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockProcessSpecsResponse(request.description));
      }, 1500); // Simulate network delay
    });
  } catch (error) {
    toast.error("Failed to process specifications");
    throw error;
  }
};

export const generateUML = async (request: GenerateUMLRequest): Promise<GenerateUMLResponse> => {
  try {
    // In a real implementation, this would make an API call to /generate-uml
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockGenerateUMLResponse(request));
      }, 800); // Simulate network delay
    });
  } catch (error) {
    toast.error("Failed to generate UML diagram");
    throw error;
  }
};

export const saveUMLDiagram = async (request: SaveUMLRequest): Promise<SaveUMLResponse> => {
  try {
    // In a real implementation, this would make an API call to /save-uml
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockSaveUMLDiagram(request));
      }, 500); // Simulate network delay
    });
  } catch (error) {
    toast.error("Failed to save UML diagram");
    throw error;
  }
};

export const getUMLHistory = async (): Promise<UMLDiagram[]> => {
  try {
    // In a real implementation, this would make an API call to /uml-history
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockGetUMLHistory());
      }, 700); // Simulate network delay
    });
  } catch (error) {
    toast.error("Failed to fetch UML history");
    throw error;
  }
};
