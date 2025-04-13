
import { 
  ProcessSpecsResponse, 
  Entity, 
  Relationship, 
  GenerateUMLRequest,
  GenerateUMLResponse 
} from './api';

// Mock response for processSpecs endpoint
export const mockProcessSpecsResponse = (description: string): ProcessSpecsResponse => {
  // This is a simplified example that extracts potential class names from the input
  // In a real implementation, this would be done by an LLM
  
  // Basic extraction logic - capitalize words that could be class names
  const potentialClassNames = description
    .split(/[.,;:\s]/)
    .filter(word => word.length > 3)
    .filter(word => word[0].toUpperCase() === word[0])
    .filter((v, i, a) => a.indexOf(v) === i) // Remove duplicates
    .slice(0, 5); // Limit to 5 classes for demo
  
  if (potentialClassNames.length === 0) {
    potentialClassNames.push('User', 'System');
  }
  
  // Create mock entities
  const entities: Entity[] = potentialClassNames.map(name => ({
    name,
    attributes: [
      {
        name: 'id',
        type: 'string',
        visibility: 'private'
      },
      {
        name: 'name',
        type: 'string',
        visibility: 'private'
      },
      {
        name: 'createdAt',
        type: 'Date',
        visibility: 'private'
      }
    ],
    methods: [
      {
        name: 'getId',
        returnType: 'string',
        parameters: [],
        visibility: 'public'
      },
      {
        name: 'setName',
        returnType: 'void',
        parameters: [{ name: 'name', type: 'string' }],
        visibility: 'public'
      },
      {
        name: 'process',
        returnType: 'boolean',
        parameters: [{ name: 'data', type: 'any' }],
        visibility: 'public'
      }
    ]
  }));
  
  // Create mock relationships
  const relationships: Relationship[] = [];
  
  if (entities.length >= 2) {
    relationships.push({
      source: entities[0].name,
      target: entities[1].name,
      type: 'association'
    });
  }
  
  if (entities.length >= 3) {
    relationships.push({
      source: entities[0].name,
      target: entities[2].name,
      type: 'dependency'
    });
  }
  
  if (entities.length >= 4) {
    relationships.push({
      source: entities[3].name,
      target: entities[1].name,
      type: 'inheritance'
    });
  }
  
  // Enhanced description would come from LLM in real implementation
  const enhancedDescription = `
System Description:

This system comprises ${entities.length} main entities: ${entities.map(e => e.name).join(', ')}.

Each entity has standard identification attributes and basic CRUD operations.
${entities.length >= 2 ? `\n${entities[0].name} has a direct association with ${entities[1].name}.` : ''}
${entities.length >= 3 ? `\n${entities[0].name} depends on ${entities[2].name} for certain operations.` : ''}
${entities.length >= 4 ? `\n${entities[3].name} inherits properties and behaviors from ${entities[1].name}.` : ''}

This is a simplified representation based on the input description. A more detailed analysis would be provided by the LLM in a production environment.
  `;
  
  return {
    enhancedDescription,
    entities,
    relationships
  };
};

// Generate Mermaid syntax for UML class diagram
export const mockGenerateUMLResponse = (request: GenerateUMLRequest): GenerateUMLResponse => {
  const { entities, relationships } = request;
  
  let mermaidSyntax = "classDiagram\n";
  
  // Add classes with attributes and methods
  entities.forEach(entity => {
    mermaidSyntax += `  class ${entity.name} {\n`;
    
    // Add attributes
    entity.attributes.forEach(attr => {
      const visibility = attr.visibility === 'private' ? '-' : attr.visibility === 'protected' ? '#' : '+';
      mermaidSyntax += `    ${visibility}${attr.name} : ${attr.type}\n`;
    });
    
    // Add methods
    entity.methods.forEach(method => {
      const visibility = method.visibility === 'private' ? '-' : method.visibility === 'protected' ? '#' : '+';
      const params = method.parameters.map(p => `${p.name}: ${p.type}`).join(', ');
      mermaidSyntax += `    ${visibility}${method.name}(${params}) ${method.returnType}\n`;
    });
    
    mermaidSyntax += "  }\n";
  });
  
  // Add relationships
  relationships.forEach(rel => {
    let relationshipSymbol: string;
    
    switch (rel.type) {
      case 'inheritance':
        relationshipSymbol = "--|>";
        break;
      case 'composition':
        relationshipSymbol = "--*";
        break;
      case 'aggregation':
        relationshipSymbol = "--o";
        break;
      case 'dependency':
        relationshipSymbol = "..>";
        break;
      case 'association':
      default:
        relationshipSymbol = "-->";
    }
    
    const label = rel.label ? ` : ${rel.label}` : '';
    mermaidSyntax += `  ${rel.source} ${relationshipSymbol} ${rel.target}${label}\n`;
  });
  
  return {
    umlSyntax: mermaidSyntax
  };
};
