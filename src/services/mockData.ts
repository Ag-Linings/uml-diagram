
import { 
  ProcessSpecsResponse, 
  Entity, 
  Attribute,
  Method,
  Relationship, 
  GenerateUMLRequest,
  GenerateUMLResponse,
  SaveUMLRequest,
  SaveUMLResponse,
  UMLDiagram
} from './api';

// Local storage key for UML history
const UML_HISTORY_KEY = 'uml_diagram_history';

// Mock response for processSpecs endpoint
export const mockProcessSpecsResponse = (description: string): ProcessSpecsResponse => {
  // This is a simplified example that extracts potential class names from the input
  
  // Extract potential class names - look for capitalized words
  let potentialClassNames = description
    .split(/[.,;:\s]/)
    .filter(word => word.length > 3)
    .filter(word => word[0] === word[0].toUpperCase())
    .filter((v, i, a) => a.indexOf(v) === i); // Remove duplicates
  
  // If no suitable class names found, try to extract nouns
  if (potentialClassNames.length < 2) {
    const commonWords = ['the', 'and', 'a', 'an', 'with', 'for', 'to', 'in', 'on', 'at', 'by', 'of'];
    potentialClassNames = description
      .split(/[.,;:\s]/)
      .filter(word => word.length > 3)
      .filter(word => !commonWords.includes(word.toLowerCase()))
      .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize first letter
      .filter((v, i, a) => a.indexOf(v) === i) // Remove duplicates
      .slice(0, 6); // Limit to 6 classes
  }
  
  // If still no suitable classes, use fallback default classes based on domain detection
  if (potentialClassNames.length < 2) {
    const domainKeywords = {
      'shop': ['Product', 'Customer', 'Order', 'ShoppingCart'],
      'education': ['Student', 'Course', 'Professor', 'Assignment'],
      'hospital': ['Patient', 'Doctor', 'Appointment', 'Treatment'],
      'bank': ['Account', 'Customer', 'Transaction', 'Loan'],
      'library': ['Book', 'Member', 'Librarian', 'Borrowing'],
      'flight': ['Flight', 'Passenger', 'Booking', 'Ticket']
    };
    
    // Detect domain from description
    const domain = Object.keys(domainKeywords).find(key => 
      description.toLowerCase().includes(key)
    ) || 'general';
    
    if (domain !== 'general') {
      potentialClassNames = domainKeywords[domain as keyof typeof domainKeywords];
    } else {
      potentialClassNames = ['User', 'System', 'Data', 'Manager'];
    }
  }
  
  // Generate appropriate attributes and methods based on the description
  const entities: Entity[] = potentialClassNames.map(name => {
    // Generate attributes based on class name
    const attributes: Attribute[] = [
      {
        name: 'id',
        type: 'string',
        visibility: 'private'
      },
      {
        name: name.toLowerCase() + 'Name',
        type: 'string',
        visibility: 'private'
      }
    ];
    
    // Add some domain-specific attributes
    if (description.toLowerCase().includes('date') || description.toLowerCase().includes('time')) {
      attributes.push({
        name: 'createdAt',
        type: 'Date',
        visibility: 'private'
      });
    }
    
    if (description.toLowerCase().includes('price') || description.toLowerCase().includes('cost')) {
      attributes.push({
        name: 'price',
        type: 'number',
        visibility: 'private'
      });
    }
    
    if (description.toLowerCase().includes('status') || description.toLowerCase().includes('state')) {
      attributes.push({
        name: 'status',
        type: 'string',
        visibility: 'private'
      });
    }
    
    // Generate methods
    const methods: Method[] = [
      {
        name: 'get' + name,
        returnType: name,
        parameters: [],
        visibility: 'public'
      }
    ];
    
    // Add crud methods based on context
    if (description.toLowerCase().includes('update') || description.toLowerCase().includes('edit')) {
      methods.push({
        name: 'update' + name,
        returnType: 'boolean',
        parameters: [{ name: 'data', type: name }],
        visibility: 'public'
      });
    }
    
    if (description.toLowerCase().includes('delete') || description.toLowerCase().includes('remove')) {
      methods.push({
        name: 'delete' + name,
        returnType: 'void',
        parameters: [{ name: 'id', type: 'string' }],
        visibility: 'public'
      });
    }
    
    if (description.toLowerCase().includes('validate') || description.toLowerCase().includes('check')) {
      methods.push({
        name: 'validate',
        returnType: 'boolean',
        parameters: [],
        visibility: 'public'
      });
    }
    
    return {
      name,
      attributes,
      methods
    };
  });
  
  // Create relationships based on the description
  const relationships: Relationship[] = [];
  
  // Process words that might indicate relationships
  const hasAssociation = description.toLowerCase().includes('has') || 
                        description.toLowerCase().includes('with') ||
                        description.toLowerCase().includes('contains');
                        
  const hasInheritance = description.toLowerCase().includes('inherits') || 
                        description.toLowerCase().includes('extends') ||
                        description.toLowerCase().includes('type of');
                        
  const hasDependency = description.toLowerCase().includes('uses') ||
                        description.toLowerCase().includes('depends') ||
                        description.toLowerCase().includes('requires');
  
  const hasAggregation = description.toLowerCase().includes('consists') ||
                        description.toLowerCase().includes('comprises') ||
                        description.toLowerCase().includes('composed');
  
  // Create relationships between entities
  if (entities.length >= 2) {
    // Add at least one relationship between first and second entity
    relationships.push({
      source: entities[0].name,
      target: entities[1].name,
      type: hasAssociation ? 'association' : hasDependency ? 'dependency' : 'association'
    });
    
    // Add additional relationships if more entities exist
    if (entities.length >= 3) {
      relationships.push({
        source: entities[0].name,
        target: entities[2].name,
        type: hasAggregation ? 'aggregation' : 'dependency',
        label: hasAggregation ? 'contains' : 'uses'
      });
    }
    
    if (entities.length >= 4 && hasInheritance) {
      relationships.push({
        source: entities[3].name,
        target: entities[1].name,
        type: 'inheritance'
      });
    } else if (entities.length >= 4) {
      relationships.push({
        source: entities[2].name,
        target: entities[3].name,
        type: 'association',
        label: 'relates to'
      });
    }
    
    // Add one more relationship if enough entities
    if (entities.length >= 5) {
      relationships.push({
        source: entities[4].name,
        target: entities[0].name,
        type: 'composition',
        label: 'part of'
      });
    }
  }
  
  // Create enhanced description based on the extracted entities and relationships
  let enhancedDescription = `
System Description:

This system comprises ${entities.length} main entities: ${entities.map(e => e.name).join(', ')}.

`;
  
  // Add entity descriptions
  entities.forEach(entity => {
    enhancedDescription += `${entity.name}: Contains ${entity.attributes.length} attributes and ${entity.methods.length} methods for data management.\n`;
  });
  
  enhancedDescription += '\nRelationships:\n';
  
  // Add relationship descriptions
  relationships.forEach(rel => {
    let relationshipText = '';
    switch (rel.type) {
      case 'association':
        relationshipText = `${rel.source} is associated with ${rel.target}`;
        break;
      case 'inheritance':
        relationshipText = `${rel.source} inherits from ${rel.target}`;
        break;
      case 'composition':
        relationshipText = `${rel.source} is composed of ${rel.target}`;
        break;
      case 'aggregation':
        relationshipText = `${rel.source} contains ${rel.target}`;
        break;
      case 'dependency':
        relationshipText = `${rel.source} depends on ${rel.target}`;
        break;
    }
    enhancedDescription += `${relationshipText}${rel.label ? ` (${rel.label})` : ''}.\n`;
  });
  
  enhancedDescription += `\nThis model represents a simplified interpretation of the system based on the input description.`;
  
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

// Mock UML History storage using localStorage
const getHistoryFromStorage = (): UMLDiagram[] => {
  try {
    const historyStr = localStorage.getItem(UML_HISTORY_KEY);
    return historyStr ? JSON.parse(historyStr) : [];
  } catch (e) {
    console.error('Error loading UML history from localStorage:', e);
    return [];
  }
};

const saveHistoryToStorage = (diagrams: UMLDiagram[]): void => {
  try {
    localStorage.setItem(UML_HISTORY_KEY, JSON.stringify(diagrams));
  } catch (e) {
    console.error('Error saving UML history to localStorage:', e);
  }
};

// Mock save UML diagram endpoint
export const mockSaveUMLDiagram = (request: SaveUMLRequest): SaveUMLResponse => {
  const history = getHistoryFromStorage();
  
  const newDiagram: UMLDiagram = {
    id: Date.now().toString(),
    title: request.title || `UML Diagram ${history.length + 1}`,
    description: request.description,
    umlSyntax: request.umlSyntax,
    entities: request.entities,
    relationships: request.relationships,
    createdAt: new Date().toISOString()
  };
  
  history.push(newDiagram);
  saveHistoryToStorage(history);
  
  return {
    id: newDiagram.id,
    success: true
  };
};

// Mock get UML history endpoint
export const mockGetUMLHistory = (): UMLDiagram[] => {
  const history = getHistoryFromStorage();
  return history.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};
