
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Entity, Attribute, Method, Parameter, Relationship } from '../services/api';
import { Plus, Trash2, ArrowRight, Edit2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface EntityRelationshipEditorProps {
  entities: Entity[];
  setEntities: React.Dispatch<React.SetStateAction<Entity[]>>;
  relationships: Relationship[];
  setRelationships: React.Dispatch<React.SetStateAction<Relationship[]>>;
  disabled?: boolean;
}

const EntityRelationshipEditor: React.FC<EntityRelationshipEditorProps> = ({ 
  entities, 
  setEntities, 
  relationships, 
  setRelationships, 
  disabled = false 
}) => {
  const [activeTab, setActiveTab] = useState<string>('entities');
  
  // Entity form state
  const [entityName, setEntityName] = useState('');
  const [editingEntityIndex, setEditingEntityIndex] = useState<number | null>(null);
  
  // Attribute form state
  const [attributeName, setAttributeName] = useState('');
  const [attributeType, setAttributeType] = useState('');
  const [attributeVisibility, setAttributeVisibility] = useState<'public' | 'private' | 'protected'>('private');
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [editingAttributeIndex, setEditingAttributeIndex] = useState<number | null>(null);
  
  // Method form state
  const [methodName, setMethodName] = useState('');
  const [methodReturnType, setMethodReturnType] = useState('');
  const [methodVisibility, setMethodVisibility] = useState<'public' | 'private' | 'protected'>('public');
  const [methods, setMethods] = useState<Method[]>([]);
  const [editingMethodIndex, setEditingMethodIndex] = useState<number | null>(null);
  
  // Parameter form state
  const [paramName, setParamName] = useState('');
  const [paramType, setParamType] = useState('');
  const [parameters, setParameters] = useState<Parameter[]>([]);
  const [editingParamIndex, setEditingParamIndex] = useState<number | null>(null);
  
  // Relationship form state
  const [relationSource, setRelationSource] = useState('');
  const [relationTarget, setRelationTarget] = useState('');
  const [relationType, setRelationType] = useState<'association' | 'inheritance' | 'composition' | 'aggregation' | 'dependency'>('association');
  const [relationLabel, setRelationLabel] = useState('');
  const [editingRelationIndex, setEditingRelationIndex] = useState<number | null>(null);
  
  // Reset all entity form fields
  const resetEntityFormFields = () => {
    setEntityName('');
    setAttributes([]);
    setMethods([]);
    setEditingEntityIndex(null);
  };
  
  // Reset attribute form
  const resetAttributeForm = () => {
    setAttributeName('');
    setAttributeType('');
    setAttributeVisibility('private');
    setEditingAttributeIndex(null);
  };
  
  // Reset method form
  const resetMethodForm = () => {
    setMethodName('');
    setMethodReturnType('');
    setMethodVisibility('public');
    setParameters([]);
    setEditingMethodIndex(null);
  };
  
  // Reset parameter form
  const resetParamForm = () => {
    setParamName('');
    setParamType('');
    setEditingParamIndex(null);
  };
  
  // Reset relationship form
  const resetRelationshipForm = () => {
    setRelationSource('');
    setRelationTarget('');
    setRelationType('association');
    setRelationLabel('');
    setEditingRelationIndex(null);
  };
  
  // Add parameter
  const handleAddParameter = () => {
    if (!paramName || !paramType) return;
    
    const newParam: Parameter = {
      name: paramName,
      type: paramType
    };
    
    if (editingParamIndex !== null) {
      const updatedParams = [...parameters];
      updatedParams[editingParamIndex] = newParam;
      setParameters(updatedParams);
    } else {
      setParameters([...parameters, newParam]);
    }
    
    resetParamForm();
  };
  
  // Edit parameter
  const handleEditParameter = (index: number) => {
    const param = parameters[index];
    setParamName(param.name);
    setParamType(param.type);
    setEditingParamIndex(index);
  };
  
  // Delete parameter
  const handleDeleteParameter = (index: number) => {
    setParameters(parameters.filter((_, i) => i !== index));
  };
  
  // Add attribute
  const handleAddAttribute = () => {
    if (!attributeName || !attributeType) return;
    
    const newAttribute: Attribute = {
      name: attributeName,
      type: attributeType,
      visibility: attributeVisibility
    };
    
    if (editingAttributeIndex !== null) {
      const updatedAttributes = [...attributes];
      updatedAttributes[editingAttributeIndex] = newAttribute;
      setAttributes(updatedAttributes);
    } else {
      setAttributes([...attributes, newAttribute]);
    }
    
    resetAttributeForm();
  };
  
  // Edit attribute
  const handleEditAttribute = (index: number) => {
    const attr = attributes[index];
    setAttributeName(attr.name);
    setAttributeType(attr.type);
    setAttributeVisibility(attr.visibility);
    setEditingAttributeIndex(index);
  };
  
  // Delete attribute
  const handleDeleteAttribute = (index: number) => {
    setAttributes(attributes.filter((_, i) => i !== index));
  };
  
  // Add method
  const handleAddMethod = () => {
    if (!methodName || !methodReturnType) return;
    
    const newMethod: Method = {
      name: methodName,
      returnType: methodReturnType,
      visibility: methodVisibility,
      parameters: [...parameters]
    };
    
    if (editingMethodIndex !== null) {
      const updatedMethods = [...methods];
      updatedMethods[editingMethodIndex] = newMethod;
      setMethods(updatedMethods);
    } else {
      setMethods([...methods, newMethod]);
    }
    
    resetMethodForm();
  };
  
  // Edit method
  const handleEditMethod = (index: number) => {
    const method = methods[index];
    setMethodName(method.name);
    setMethodReturnType(method.returnType);
    setMethodVisibility(method.visibility);
    setParameters([...method.parameters]);
    setEditingMethodIndex(index);
  };
  
  // Delete method
  const handleDeleteMethod = (index: number) => {
    setMethods(methods.filter((_, i) => i !== index));
  };
  
  // Add entity
  const handleAddEntity = () => {
    if (!entityName) return;
    
    const newEntity: Entity = {
      name: entityName,
      attributes: [...attributes],
      methods: [...methods]
    };
    
    if (editingEntityIndex !== null) {
      const updatedEntities = [...entities];
      updatedEntities[editingEntityIndex] = newEntity;
      setEntities(updatedEntities);
      
      // Also update any relationships that reference this entity
      const oldEntityName = entities[editingEntityIndex].name;
      if (oldEntityName !== entityName) {
        const updatedRelationships = relationships.map(rel => {
          if (rel.source === oldEntityName) {
            return { ...rel, source: entityName };
          }
          if (rel.target === oldEntityName) {
            return { ...rel, target: entityName };
          }
          return rel;
        });
        setRelationships(updatedRelationships);
      }
    } else {
      setEntities([...entities, newEntity]);
    }
    
    resetEntityFormFields();
  };
  
  // Edit entity
  const handleEditEntity = (index: number) => {
    const entity = entities[index];
    setEntityName(entity.name);
    setAttributes([...entity.attributes]);
    setMethods([...entity.methods]);
    setEditingEntityIndex(index);
  };
  
  // Delete entity
  const handleDeleteEntity = (index: number) => {
    const entityName = entities[index].name;
    
    // Remove the entity
    const updatedEntities = entities.filter((_, i) => i !== index);
    setEntities(updatedEntities);
    
    // Remove any relationships that reference this entity
    const updatedRelationships = relationships.filter(
      rel => rel.source !== entityName && rel.target !== entityName
    );
    setRelationships(updatedRelationships);
  };
  
  // Add relationship
  const handleAddRelationship = () => {
    if (!relationSource || !relationTarget || !relationType) return;
    
    const newRelationship: Relationship = {
      source: relationSource,
      target: relationTarget,
      type: relationType,
      label: relationLabel || undefined
    };
    
    if (editingRelationIndex !== null) {
      const updatedRelationships = [...relationships];
      updatedRelationships[editingRelationIndex] = newRelationship;
      setRelationships(updatedRelationships);
    } else {
      setRelationships([...relationships, newRelationship]);
    }
    
    resetRelationshipForm();
  };
  
  // Edit relationship
  const handleEditRelationship = (index: number) => {
    const rel = relationships[index];
    setRelationSource(rel.source);
    setRelationTarget(rel.target);
    setRelationType(rel.type);
    setRelationLabel(rel.label || '');
    setEditingRelationIndex(index);
  };
  
  // Delete relationship
  const handleDeleteRelationship = (index: number) => {
    setRelationships(relationships.filter((_, i) => i !== index));
  };
  
  // Visibility badge color
  const getVisibilityColor = (visibility: string) => {
    switch (visibility) {
      case 'public': return 'bg-green-100 text-green-800';
      case 'private': return 'bg-red-100 text-red-800';
      case 'protected': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Relationship type badge color
  const getRelationshipColor = (type: string) => {
    switch (type) {
      case 'inheritance': return 'bg-purple-100 text-purple-800';
      case 'composition': return 'bg-blue-100 text-blue-800';
      case 'aggregation': return 'bg-teal-100 text-teal-800';
      case 'dependency': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 w-[300px]">
          <TabsTrigger value="entities">Entities</TabsTrigger>
          <TabsTrigger value="relationships">Relationships</TabsTrigger>
        </TabsList>
        
        {/* Entities Tab */}
        <TabsContent value="entities">
          <Card className="p-4">
            <div className="space-y-6">
              {/* Entity Form */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">
                  {editingEntityIndex !== null ? 'Edit Entity' : 'Add Entity'}
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Entity Name</label>
                    <Input
                      placeholder="Entity Name"
                      value={entityName}
                      onChange={(e) => setEntityName(e.target.value)}
                      disabled={disabled}
                    />
                  </div>
                </div>
                
                {/* Attributes Section */}
                <div className="space-y-2">
                  <h4 className="text-md font-medium">Attributes</h4>
                  
                  {/* Attribute Form */}
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      placeholder="Name"
                      value={attributeName}
                      onChange={(e) => setAttributeName(e.target.value)}
                      disabled={disabled}
                      size={10}
                    />
                    <Input
                      placeholder="Type"
                      value={attributeType}
                      onChange={(e) => setAttributeType(e.target.value)}
                      disabled={disabled}
                      size={10}
                    />
                    <Select
                      value={attributeVisibility}
                      onValueChange={(value: 'public' | 'private' | 'protected') => setAttributeVisibility(value)}
                      disabled={disabled}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Visibility" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="private">Private</SelectItem>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="protected">Protected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleAddAttribute}
                    disabled={disabled || !attributeName || !attributeType}
                  >
                    {editingAttributeIndex !== null ? 'Update' : 'Add'} Attribute
                  </Button>
                  
                  {/* Attribute List */}
                  {attributes.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {attributes.map((attr, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 border rounded-md">
                          <Badge className={getVisibilityColor(attr.visibility)}>
                            {attr.visibility === 'public' ? '+' : attr.visibility === 'private' ? '-' : '#'}
                          </Badge>
                          <span className="flex-1">
                            {attr.name}: {attr.type}
                          </span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleEditAttribute(index)}
                            disabled={disabled}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDeleteAttribute(index)}
                            disabled={disabled}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Methods Section */}
                <div className="space-y-2 border-t pt-4">
                  <h4 className="text-md font-medium">Methods</h4>
                  
                  {/* Method Form */}
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      placeholder="Name"
                      value={methodName}
                      onChange={(e) => setMethodName(e.target.value)}
                      disabled={disabled}
                      size={10}
                    />
                    <Input
                      placeholder="Return Type"
                      value={methodReturnType}
                      onChange={(e) => setMethodReturnType(e.target.value)}
                      disabled={disabled}
                      size={10}
                    />
                    <Select
                      value={methodVisibility}
                      onValueChange={(value: 'public' | 'private' | 'protected') => setMethodVisibility(value)}
                      disabled={disabled}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Visibility" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="private">Private</SelectItem>
                        <SelectItem value="protected">Protected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Parameters Section */}
                  <div className="pl-4 space-y-2">
                    <h5 className="text-sm font-medium">Parameters</h5>
                    
                    {/* Parameter Form */}
                    <div className="flex gap-2">
                      <Input
                        placeholder="Name"
                        value={paramName}
                        onChange={(e) => setParamName(e.target.value)}
                        disabled={disabled}
                        className="flex-1"
                        size={10}
                      />
                      <Input
                        placeholder="Type"
                        value={paramType}
                        onChange={(e) => setParamType(e.target.value)}
                        disabled={disabled}
                        className="flex-1"
                        size={10}
                      />
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleAddParameter}
                        disabled={disabled || !paramName || !paramType}
                      >
                        {editingParamIndex !== null ? 'Update' : 'Add'}
                      </Button>
                    </div>
                    
                    {/* Parameter List */}
                    {parameters.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {parameters.map((param, index) => (
                          <div key={index} className="flex items-center gap-2 p-1 border rounded-md">
                            <span className="flex-1 text-sm">
                              {param.name}: {param.type}
                            </span>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleEditParameter(index)}
                              disabled={disabled}
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleDeleteParameter(index)}
                              disabled={disabled}
                            >
                              <Trash2 className="h-3 w-3 text-red-500" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleAddMethod}
                    disabled={disabled || !methodName || !methodReturnType}
                    className="mt-2"
                  >
                    {editingMethodIndex !== null ? 'Update' : 'Add'} Method
                  </Button>
                  
                  {/* Method List */}
                  {methods.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {methods.map((method, index) => (
                        <div key={index} className="p-2 border rounded-md">
                          <div className="flex items-center gap-2">
                            <Badge className={getVisibilityColor(method.visibility)}>
                              {method.visibility === 'public' ? '+' : method.visibility === 'private' ? '-' : '#'}
                            </Badge>
                            <span className="flex-1">
                              {method.name}({method.parameters.map(p => `${p.name}: ${p.type}`).join(', ')}): {method.returnType}
                            </span>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleEditMethod(index)}
                              disabled={disabled}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleDeleteMethod(index)}
                              disabled={disabled}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end space-x-2">
                  {editingEntityIndex !== null && (
                    <Button 
                      variant="outline"
                      onClick={resetEntityFormFields}
                      disabled={disabled}
                    >
                      Cancel
                    </Button>
                  )}
                  <Button 
                    onClick={handleAddEntity}
                    disabled={disabled || !entityName}
                  >
                    {editingEntityIndex !== null ? 'Update' : 'Add'} Entity
                  </Button>
                </div>
              </div>
              
              {/* Entity List */}
              {entities.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Defined Entities</h3>
                  <div className="grid gap-2 md:grid-cols-2">
                    {entities.map((entity, index) => (
                      <Card key={index} className="p-3">
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold">{entity.name}</h4>
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleEditEntity(index)}
                              disabled={disabled}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleDeleteEntity(index)}
                              disabled={disabled}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                        
                        {entity.attributes.length > 0 && (
                          <div className="mt-2">
                            <h5 className="text-sm font-medium">Attributes:</h5>
                            <ul className="pl-4 list-disc text-sm">
                              {entity.attributes.map((attr, i) => (
                                <li key={i}>
                                  {attr.visibility === 'public' ? '+' : attr.visibility === 'private' ? '-' : '#'}
                                  {attr.name}: {attr.type}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {entity.methods.length > 0 && (
                          <div className="mt-2">
                            <h5 className="text-sm font-medium">Methods:</h5>
                            <ul className="pl-4 list-disc text-sm">
                              {entity.methods.map((method, i) => (
                                <li key={i}>
                                  {method.visibility === 'public' ? '+' : method.visibility === 'private' ? '-' : '#'}
                                  {method.name}({method.parameters.map(p => `${p.name}: ${p.type}`).join(', ')}): {method.returnType}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>
        
        {/* Relationships Tab */}
        <TabsContent value="relationships">
          <Card className="p-4">
            <div className="space-y-6">
              {/* Relationship Form */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">
                  {editingRelationIndex !== null ? 'Edit Relationship' : 'Add Relationship'}
                </h3>
                
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium mb-1">Source Entity</label>
                    <Select 
                      value={relationSource} 
                      onValueChange={(value) => setRelationSource(value)}
                      disabled={disabled || entities.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select source entity" />
                      </SelectTrigger>
                      <SelectContent>
                        {entities.map((entity, index) => (
                          <SelectItem key={index} value={entity.name}>{entity.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Target Entity</label>
                    <Select 
                      value={relationTarget} 
                      onValueChange={(value) => setRelationTarget(value)}
                      disabled={disabled || entities.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select target entity" />
                      </SelectTrigger>
                      <SelectContent>
                        {entities.map((entity, index) => (
                          <SelectItem key={index} value={entity.name}>{entity.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium mb-1">Relationship Type</label>
                    <Select 
                      value={relationType} 
                      onValueChange={(value: 'association' | 'inheritance' | 'composition' | 'aggregation' | 'dependency') => 
                        setRelationType(value)
                      }
                      disabled={disabled}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select relationship type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="association">Association</SelectItem>
                        <SelectItem value="inheritance">Inheritance</SelectItem>
                        <SelectItem value="composition">Composition</SelectItem>
                        <SelectItem value="aggregation">Aggregation</SelectItem>
                        <SelectItem value="dependency">Dependency</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Label (Optional)</label>
                    <Input
                      placeholder="Relationship Label"
                      value={relationLabel}
                      onChange={(e) => setRelationLabel(e.target.value)}
                      disabled={disabled}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2">
                  {editingRelationIndex !== null && (
                    <Button 
                      variant="outline"
                      onClick={resetRelationshipForm}
                      disabled={disabled}
                    >
                      Cancel
                    </Button>
                  )}
                  <Button 
                    onClick={handleAddRelationship}
                    disabled={disabled || !relationSource || !relationTarget || !relationType || relationSource === relationTarget}
                  >
                    {editingRelationIndex !== null ? 'Update' : 'Add'} Relationship
                  </Button>
                </div>
              </div>
              
              {/* Relationships List */}
              {relationships.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Defined Relationships</h3>
                  <div className="space-y-2">
                    {relationships.map((rel, index) => (
                      <Card key={index} className="p-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{rel.source}</span>
                          <ArrowRight className="h-4 w-4" />
                          <span className="font-medium">{rel.target}</span>
                          <Badge className={`ml-2 ${getRelationshipColor(rel.type)}`}>
                            {rel.type}
                          </Badge>
                          {rel.label && (
                            <span className="text-sm text-gray-500">
                              "{rel.label}"
                            </span>
                          )}
                          <div className="flex-grow"></div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleEditRelationship(index)}
                            disabled={disabled}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDeleteRelationship(index)}
                            disabled={disabled}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EntityRelationshipEditor;
