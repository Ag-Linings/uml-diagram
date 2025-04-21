import React, { useState, useRef, useEffect } from 'react';
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
import { Lightbulb, RefreshCcw, AlignJustify, SquareDashedBottom, Database } from 'lucide-react';
import EntityRelationshipEditor from './EntityRelationshipEditor';

const UMLDefinitionModal: React.FC<{ open: boolean, onClose: () => void }> = ({ open, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);

  useEffect(() => {
    if (!open) { setScrolledToBottom(false); }
  }, [open]);

  const handleScroll = () => {
    if (!modalRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = modalRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 5) { // 5px buffer
      setScrolledToBottom(true);
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">What is a UML class diagram?</h2>
        </div>
        <div
          className="flex-1 p-4 overflow-y-auto text-sm space-y-3"
          ref={modalRef}
          onScroll={handleScroll}
        >
          <p>
            <b>UML (Unified Modeling Language)</b> class diagrams are a type of static structure diagram that describes the structure of a system by showing its classes, attributes, methods, and the relationships among objects.
          </p>
          <ul className="list-disc ml-5">
            <li>
              <b>Entities (Classes):</b> Represent blueprints for objects in your system. Each should have at least one <b>attribute</b> (like a property or variable) and one <b>method</b> (like an action or function).
            </li>
            <li>
              <b>Attributes:</b> Characteristics or data held by each class (e.g., <code>name</code>, <code>id</code>).
            </li>
            <li>
              <b>Methods:</b> Actions or operations a class can perform (e.g., <code>save()</code>, <code>borrowBook()</code>).
            </li>
            <li>
              <b>Relationships:</b> Indicate how entities interact, such as associations (connections), inheritance (subclassing), or dependencies.
            </li>
          </ul>
          <p>
            <b>Example:</b><br />
            Entities: <code>Student</code>, <code>Course</code><br />
            Attributes: <code>Student.name</code>, <code>Course.title</code><br />
            Methods: <code>Student.enroll()</code>, <code>Course.addStudent()</code><br />
            Relationship: <code>Student</code> enrolls in <code>Course</code>
          </p>
          <p>
            Your UML must describe at least two entities, each with at least one attribute and one method, and at least one relationship for a valid diagram.
          </p>
        </div>
        <div className="border-t p-3 flex justify-end">
          <button
            className={`bg-primary px-4 py-2 rounded text-white disabled:opacity-50 ${!scrolledToBottom ? 'cursor-not-allowed' : ''}`}
            disabled={!scrolledToBottom}
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
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
  const [showUMLModal, setShowUMLModal] = useState(false);

  const handleExampleClick = (exampleDescription: string) => {
    setDescription(exampleDescription);
    setInputMode('unified');
  };

  const handleSubmit = async () => {
    if (inputMode === 'unified') {
      if (!description.trim()) {
        toast.error('Please enter a system description');
        return;
      }

      try {
        setLoading(true);
        setProcessingStep('processing');
        
        const userId = "user-" + Date.now().toString();
        
        const specsResponse = await processSpecs({
          description,
          userId: userId
        });
        setProcessedSpecs(specsResponse);
        
        setProcessingStep('generating');
        try {
          const umlResponse = await generateUML({
            entities: specsResponse.entities,
            relationships: specsResponse.relationships,
            userId: userId
          });
          setUmlSyntax(umlResponse.umlSyntax);
          
          setProcessingStep('saving');
          toast.success('UML diagram generated and saved to database');
          setActiveTab('diagram');
          setFailedAttempts(0);
        } catch (umlError: any) {
          if (
            umlError instanceof Error &&
            umlError.message &&
            umlError.message.includes('A UML diagram must have at least two entities')
          ) {
            setFailedAttempts(attempts => {
              const newVal = attempts + 1;
              if (newVal >= 3) setShowUMLModal(true);
              return newVal;
            });
            toast.error("Your description didn't meet the criteria for a valid UML diagram. See the guidelines.");
          } else {
            toast.error('Failed to generate UML diagram: ' + (umlError instanceof Error ? umlError.message : String(umlError)));
          }
        }
      } catch (error) {
        console.error('Error generating UML:', error);
        toast.error('Failed to generate UML diagram: ' + (error instanceof Error ? error.message : String(error)));
      } finally {
        setLoading(false);
        setProcessingStep('idle');
      }
    } else {
      try {
        if (manualEntities.length === 0) {
          toast.error('Please define at least one entity');
          return;
        }
        
        setLoading(true);
        setProcessingStep('generating');
        
        const userId = "user-" + Date.now().toString();
        
        const umlResponse = await generateUML({
          entities: manualEntities,
          relationships: manualRelationships,
          userId: userId
        });
        
        setUmlSyntax(umlResponse.umlSyntax);
        
        setProcessedSpecs({
          enhancedDescription: "Manually defined entities and relationships",
          entities: manualEntities,
          relationships: manualRelationships
        });
        
        setProcessingStep('saving');
        toast.success('UML diagram generated and saved to database');
        setActiveTab('diagram');
        setFailedAttempts(0);
      } catch (umlError: any) {
        if (
          umlError instanceof Error &&
          umlError.message &&
          umlError.message.includes('A UML diagram must have at least two entities')
        ) {
          setFailedAttempts(attempts => {
            const newVal = attempts + 1;
            if (newVal >= 3) setShowUMLModal(true);
            return newVal;
          });
          toast.error("Insufficient entities, attributes, or relationships for a UML diagram. See the guidelines.");
        } else {
          toast.error('Failed to generate UML diagram: ' + (umlError instanceof Error ? umlError.message : String(umlError)));
        }
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
    <div className="container mx-auto py-8 space-y-6">
      <UMLDefinitionModal open={showUMLModal} onClose={() => setShowUMLModal(false)} />
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
  );
};

export default UMLGenerator;
