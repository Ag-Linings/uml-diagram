import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { processSpecs, generateUML, ProcessSpecsResponse, Entity, Relationship } from '../services/api';
import { toast } from 'sonner';
import MermaidRenderer from './MermaidRenderer';
import EntityList from './EntityList';
import { examples } from '../utils/examples';
import { Lightbulb, RefreshCcw, AlignJustify, SquareDashedBottom, Database, AlertTriangle } from 'lucide-react';
import EntityRelationshipEditor from './EntityRelationshipEditor';
import UMLDefinitionModal from "./UMLDefinitionModal";

const REQUIRED_WORDS = ["attribute", "method", "relationship", "entity", "class"];
const REQUIRED_WORD_SETS = [
  ["attribute"],
  ["method"],
  ["relationship"],
  ["entity", "class"], // can match either
];

const getMissingWords = (desc: string) => {
  const lower = desc.toLowerCase();
  return REQUIRED_WORD_SETS.filter(ws => !ws.some(word => lower.includes(word)));
};

const checkUMLValidity = (specs: ProcessSpecsResponse) => {
  // At least 2 entities
  if (!specs.entities || specs.entities.length < 2) return false;
  // Every entity has at least 1 attribute and at least 1 method
  if (!specs.entities.every(e => e.attributes?.length > 0 && e.methods?.length > 0)) return false;
  // At least 1 relationship
  if (!specs.relationships || specs.relationships.length < 1) return false;
  return true;
};

const createMockResponse = (description: string): ProcessSpecsResponse => {
  const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  // Extract potential entity names from the description (this is very simplistic)
  const words = description.split(/\s+/);
  const potentialEntities = words
    .filter(word => word.length > 3 && /^[A-Z]/.test(word))
    .slice(0, 3)
    .map(name => {
      // Remove any trailing commas from the entity name
      return capitalizeFirstLetter(name.replace(/,+$/, ''));
    })
    .filter((value, index, self) => self.indexOf(value) === index); // Remove duplicates

  // Ensure we have at least 2 entities, add generic ones if needed
  if (potentialEntities.length < 2) {
    potentialEntities.push("Entity1", "Entity2");
  }

  const entities: Entity[] = potentialEntities.slice(0, 3).map(name => ({
    name,
    attributes: [
      { name: "id", type: "int", visibility: "private" },
      { name: "name", type: "string", visibility: "public" }
    ],
    methods: [
      { name: "get" + name, returnType: name, parameters: [], visibility: "public" },
      { name: "update" + name, returnType: "boolean", parameters: [{ name: "data", type: name }], visibility: "public" }
    ]
  }));

  const relationships: Relationship[] = [
    {
      source: entities[0].name,
      target: entities[1].name,
      type: "association",
      label: "relates to"
    }
  ];

  return {
    enhancedDescription: `This is a mock response for: ${description}\n\nAPI connection appears to be unavailable. Using sample data.`,
    entities,
    relationships
  };
};

const UMLGenerator: React.FC = () => {
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [processingStep, setProcessingStep] = useState<'idle' | 'processing' | 'generating' | 'saving'>('idle');
  const [processedSpecs, setProcessedSpecs] = useState<ProcessSpecsResponse | null>(null);
  const [umlSyntax, setUmlSyntax] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('specifications');
  const [inputMode, setInputMode] = useState<'unified' | 'separate'>('unified');
  const [lastDiagramId, setLastDiagramId] = useState<number | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [showDefinition, setShowDefinition] = useState(false);
  const [apiConnectionError, setApiConnectionError] = useState(false);

  const [manualEntities, setManualEntities] = useState<Entity[]>([]);
  const [manualRelationships, setManualRelationships] = useState<Relationship[]>([]);

  const handleExampleClick = (exampleDescription: string) => {
    setDescription(exampleDescription);
    setInputMode('unified');
  };

  const generateMockUmlSyntax = (specs: ProcessSpecsResponse): string => {
    let umlCode = 'classDiagram\n';
    
    // Add classes with attributes and methods
    specs.entities.forEach(entity => {
      // Clean entity name (remove commas)
      const cleanName = entity.name.replace(/,/g, '');
      umlCode += `class ${cleanName} {\n`;
      
      // Add attributes
      entity.attributes.forEach(attr => {
        const visibility = attr.visibility === 'private' ? '-' : 
                          attr.visibility === 'protected' ? '#' : '+';
        umlCode += `  ${visibility}${attr.name} : ${attr.type}\n`;
      });
      
      // Add methods
      entity.methods.forEach(method => {
        const visibility = method.visibility === 'private' ? '-' : 
                          method.visibility === 'protected' ? '#' : '+';
        const params = method.parameters.map(p => `${p.name}: ${p.type.replace(/,/g, '')}`).join(', ');
        umlCode += `  ${visibility}${method.name.replace(/,/g, '')}(${params}) ${method.returnType.replace(/,/g, '')}\n`;
      });
      
      umlCode += '}\n';
    });
    
    // Add relationships
    specs.relationships.forEach(rel => {
      // Clean source and target names
      const cleanSource = rel.source.replace(/,/g, '');
      const cleanTarget = rel.target.replace(/,/g, '');
      
      let arrow;
      switch (rel.type) {
        case 'inheritance': arrow = '<|--'; break;
        case 'composition': arrow = '*--'; break;
        case 'aggregation': arrow = 'o--'; break;
        case 'dependency': arrow = '<..'; break;
        default: arrow = '-->';
      }
      
      umlCode += `${cleanSource} ${arrow} ${cleanTarget}`;
      if (rel.label) {
        umlCode += ` : ${rel.label}`;
      }
      umlCode += '\n';
    });
    
    return umlCode;
  };

  const handleSubmit = async () => {
    if (inputMode === "unified") {
      if (!description.trim()) {
        toast.error("Please enter a system description");
        return;
      }
      // --- Validate required words
      const missingWordsArr = getMissingWords(description);
      if (missingWordsArr.length > 0) {
        toast.error(
          "Your description must include the following words: " +
            missingWordsArr.map(ws => ws.join("/")).join(", ")
        );
        setFailedAttempts(failedAttempts + 1);
        if (failedAttempts + 1 >= 3) setShowDefinition(true);
        return;
      }

      try {
        setLoading(true);
        setProcessingStep("processing");
        const userId = "user-" + Date.now().toString();
        
        let specsResponse: ProcessSpecsResponse;
        
        try {
          // Step 1. Process the specifications with LLM
          specsResponse = await processSpecs({
            description,
            userId: userId,
          });
        } catch (error) {
          console.error('API Error in processSpecs:', error);
          setApiConnectionError(true);
          // If API fails, use mock data instead
          toast.error("Unable to connect to the backend API. Using sample data instead.");
          specsResponse = createMockResponse(description);
        }
        
        // New check: ensure specsResponse meets the minimal UML requirements
        const valid = checkUMLValidity(specsResponse);
        if (!valid) {
          toast.error(
            "Your system definition must have at least two entities with attributes and methods, and at least one relationship."
          );
          setFailedAttempts(failedAttempts + 1);
          if (failedAttempts + 1 >= 3) setShowDefinition(true);
          return;
        }
        setProcessedSpecs(specsResponse);

        // Step 2. Generate the UML diagram
        setProcessingStep("generating");
        let umlResponse;
        try {
          umlResponse = await generateUML({
            entities: specsResponse.entities,
            relationships: specsResponse.relationships,
            userId: userId,
          });
          setUmlSyntax(umlResponse.umlSyntax);
        } catch (error) {
          console.error('Error generating UML:', error);
          // If API fails, generate mock UML
          const mockUmlSyntax = generateMockUmlSyntax(specsResponse);
          setUmlSyntax(mockUmlSyntax);
          if (!apiConnectionError) {
            toast.error('API connection failed. Using generated diagram instead.');
            setApiConnectionError(true);
          }
        }
        
        setProcessingStep("saving");

        toast.success(apiConnectionError ? 
          "UML diagram generated (in offline mode)" : 
          "UML diagram generated and saved to database"
        );
        setActiveTab("diagram");
        setFailedAttempts(0); // Success resets counter
      } catch (error) {
        console.error('Error in UML generation flow:', error);
        toast.error('Failed to generate UML diagram: ' + (error instanceof Error ? error.message : String(error)));
      } finally {
        setLoading(false);
        setProcessingStep("idle");
      }
    } else {
      // For separate input mode, skip the LLM processing
      try {
        if (manualEntities.length < 2) {
          toast.error('Please define at least two entities');
          return;
        }
        
        if (!manualEntities.every(e => e.attributes?.length > 0 && e.methods?.length > 0)) {
          toast.error('Each entity must have at least one attribute and one method');
          return;
        }
        
        if (manualRelationships.length < 1) {
          toast.error('Please define at least one relationship');
          return;
        }
        
        setLoading(true);
        setProcessingStep('generating');
        
        const userId = "user-" + Date.now().toString();
        
        try {
          // Generate UML directly from manually entered entities and relationships
          const umlResponse = await generateUML({
            entities: manualEntities,
            relationships: manualRelationships,
            userId: userId
          });
          
          setUmlSyntax(umlResponse.umlSyntax);
        } catch (error) {
          console.error('API Error in generateUML:', error);
          setApiConnectionError(true);
          // If API fails, generate mock UML
          const mockUmlSyntax = generateMockUmlSyntax({
            enhancedDescription: "Manually defined entities and relationships",
            entities: manualEntities,
            relationships: manualRelationships
          });
          setUmlSyntax(mockUmlSyntax);
          toast.error('API connection failed. Using generated diagram instead.');
        }
        
        // Create a simplified processed specs to show in the structured view
        setProcessedSpecs({
          enhancedDescription: "Manually defined entities and relationships",
          entities: manualEntities,
          relationships: manualRelationships
        });
        
        setProcessingStep('saving');
        toast.success(apiConnectionError ? 
          "UML diagram generated (in offline mode)" : 
          "UML diagram generated and saved to database"
        );
        setActiveTab('diagram');
      } catch (error) {
        console.error('Error generating UML:', error);
        toast.error('Failed to generate UML diagram: ' + (error instanceof Error ? error.message : String(error)));
      } finally {
        setLoading(false);
        setProcessingStep('idle');
      }
    }
  };

  const renderLoadingState = () => {
    if (processingStep === 'processing') {
      return (
        <div className="flex items-center space-x-2 bg-blue-50 p-4 rounded-md">
          <RefreshCcw className="animate-spin h-5 w-5 text-blue-500" />
          <span className="text-blue-700">Processing system description with LLM...</span>
        </div>
      );
    }
    if (processingStep === 'generating') {
      return (
        <div className="flex items-center space-x-2 bg-blue-50 p-4 rounded-md">
          <RefreshCcw className="animate-spin h-5 w-5 text-blue-500" />
          <span className="text-blue-700">Generating UML diagram...</span>
        </div>
      );
    }
    if (processingStep === 'saving') {
      return (
        <div className="flex items-center space-x-2 bg-green-50 p-4 rounded-md">
          <Database className="h-5 w-5 text-green-500" />
          <span className="text-green-700">Saving UML data to database...</span>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <UMLDefinitionModal open={showDefinition} onClose={() => setShowDefinition(false)} />

      <div className="container mx-auto py-8 space-y-6">
        {apiConnectionError && (
          <div className="flex items-center space-x-2 bg-amber-50 p-4 rounded-md border border-amber-200">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <span className="text-amber-700">
              Backend API connection unavailable. The application is running in offline mode with sample data.
            </span>
          </div>
        )}
        
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">System Description</h2>
            <ToggleGroup type="single" value={inputMode} onValueChange={(value) => value && setInputMode(value as 'unified' | 'separate')}>
              <ToggleGroupItem value="unified" aria-label="Unified input">
                <AlignJustify className="h-4 w-4 mr-2" />
                Text Description
              </ToggleGroupItem>
              <ToggleGroupItem value="separate" aria-label="Separate input">
                <SquareDashedBottom className="h-4 w-4 mr-2" />
                Entities & Relationships
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          
          {inputMode === 'unified' ? (
            <div className="space-y-4">
              <Textarea
                placeholder="Describe your system here. For example: A university management system with students, professors, courses, and departments. Students can enroll in courses, professors teach courses, and departments manage courses and professors."
                className="min-h-[150px]"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
              />
              
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center">
                  <Lightbulb className="h-4 w-4 mr-1 text-amber-500" />
                  <span className="text-sm text-gray-500 mr-2">Try an example:</span>
                </div>
                {examples.map((example, index) => (
                  <Button 
                    key={index} 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleExampleClick(example.description)}
                    disabled={loading}
                  >
                    {example.title}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <EntityRelationshipEditor
              entities={manualEntities}
              setEntities={setManualEntities}
              relationships={manualRelationships}
              setRelationships={setManualRelationships}
              disabled={loading}
            />
          )}
          
          <div className="flex justify-end mt-4">
            <Button 
              onClick={handleSubmit} 
              disabled={loading || (inputMode === 'unified' ? !description.trim() : manualEntities.length === 0)} 
              style={{ backgroundColor: '#a89467' }}
              className="text-white hover:opacity-90"
            >
              {loading ? 'Processing...' : 'Generate UML Diagram'}
            </Button>
          </div>
        </Card>

        {renderLoadingState()}
        
        {processedSpecs && (
          <div className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-2 w-[400px]">
                <TabsTrigger value="specifications">Structured Specifications</TabsTrigger>
                <TabsTrigger value="diagram">UML Class Diagram</TabsTrigger>
              </TabsList>
              
              <TabsContent value="specifications" className="space-y-6">
                <Card className="p-6">
                  <h3 className="text-xl font-semibold mb-4">Enhanced System Description</h3>
                  <div className="p-4 bg-gray-50 rounded-md whitespace-pre-wrap">
                    {processedSpecs.enhancedDescription}
                  </div>
                </Card>
                
                <EntityList 
                  entities={processedSpecs.entities} 
                  relationships={processedSpecs.relationships} 
                />
              </TabsContent>
              
              <TabsContent value="diagram">
                <Card className="p-6">
                  <h3 className="text-xl font-semibold mb-4">UML Class Diagram</h3>
                  {umlSyntax ? (
                    <MermaidRenderer chart={umlSyntax} />
                  ) : (
                    <div className="p-4 bg-gray-50 text-gray-500 text-center rounded-md">
                      UML diagram will appear here
                    </div>
                  )}
                  {lastDiagramId && (
                    <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-md">
                      <Database className="inline-block h-4 w-4 mr-2" />
                      Diagram successfully saved with ID: {lastDiagramId}
                    </div>
                  )}
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </>
  );
};

export default UMLGenerator;
