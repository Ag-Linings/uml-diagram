
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { processSpecs, generateUML, ProcessSpecsResponse, Entity, Relationship } from '../services/api';
import { toast } from 'sonner';
import MermaidRenderer from './MermaidRenderer';
import EntityList from './EntityList';
import { examples } from '../utils/examples';
import { Lightbulb, RefreshCcw } from 'lucide-react';

const UMLGenerator: React.FC = () => {
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [processingStep, setProcessingStep] = useState<'idle' | 'processing' | 'generating'>('idle');
  const [processedSpecs, setProcessedSpecs] = useState<ProcessSpecsResponse | null>(null);
  const [umlSyntax, setUmlSyntax] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('specifications');

  const handleExampleClick = (exampleDescription: string) => {
    setDescription(exampleDescription);
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      toast.error('Please enter a system description');
      return;
    }

    try {
      setLoading(true);
      setProcessingStep('processing');
      
      // Step 1: Process the specifications with LLM
      const specsResponse = await processSpecs({ description });
      setProcessedSpecs(specsResponse);
      
      // Step 2: Generate the UML diagram
      setProcessingStep('generating');
      const umlResponse = await generateUML({
        entities: specsResponse.entities,
        relationships: specsResponse.relationships
      });
      
      setUmlSyntax(umlResponse.umlSyntax);
      toast.success('UML diagram generated successfully');
      setActiveTab('diagram');
    } catch (error) {
      console.error('Error generating UML:', error);
      toast.error('Failed to generate UML diagram');
    } finally {
      setLoading(false);
      setProcessingStep('idle');
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
    return null;
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">System Description</h2>
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
          
          <div className="flex justify-end">
            <Button 
              onClick={handleSubmit} 
              disabled={loading || !description.trim()} 
              className="bg-uml-primary hover:bg-blue-900"
            >
              Generate UML Diagram
            </Button>
          </div>
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
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};

export default UMLGenerator;
