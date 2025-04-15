
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Entity, Attribute, Method, Parameter, Relationship } from '../services/api';
import { PlusCircle, Trash2, Edit, Check, X, Plus } from 'lucide-react';
import { Card } from '@/components/ui/card';

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
  const [activeTab, setActiveTab] = useState('entities');
  const [newEntityName, setNewEntityName] = useState('');
  
  // Entity editing states
  const [editingEntity, setEditingEntity] = useState<Entity | null>(null);
  const [newAttribute, setNewAttribute] = useState<Partial<Attribute>>({
    name: '',
    type: '',
    visibility: 'public'
  });
  const [newMethod, setNewMethod] = useState<Partial<Method>>({
    name: '',
    returnType: '',
    parameters: [],
    visibility: 'public'
  });
  const [newParameter, setNewParameter] = useState<Partial<Parameter>>({
    name: '',
    type: ''
  });

  // Relationship editing states
  const [newRelationship, setNewRelationship] = useState<Partial<Relationship>>({
    source: '',
    target: '',
    type: 'association',
    label: ''
  });

  const handleAddEntity = () => {
    if (!newEntityName.trim()) return;
    
    const newEntity: Entity = {
      name: newEntityName.trim(),
      attributes: [],
      methods: []
    };
    
    setEntities([...entities, newEntity]);
    setNewEntityName('');
  };

  const handleDeleteEntity = (index: number) => {
    const updatedEntities = [...entities];
    const deletedEntityName = updatedEntities[index].name;
    
    // Remove the entity
    updatedEntities.splice(index, 1);
    setEntities(updatedEntities);
    
    // Remove any relationships involving this entity
    const updatedRelationships = relationships.filter(
      rel => rel.source !== deletedEntityName && rel.target !== deletedEntityName
    );
    setRelationships(updatedRelationships);
  };

  const handleEditEntity = (entity: Entity) => {
    setEditingEntity({...entity});
  };

  const handleSaveEntity = () => {
    if (!editingEntity) return;
    
    const updatedEntities = entities.map(entity => 
      entity.name === editingEntity.name ? editingEntity : entity
    );
    
    setEntities(updatedEntities);
    setEditingEntity(null);
  };

  const handleCancelEdit = () => {
    setEditingEntity(null);
  };

  const handleAddAttribute = () => {
    if (!editingEntity || !newAttribute.name || !newAttribute.type) return;
    
    const attribute: Attribute = {
      name: newAttribute.name,
      type: newAttribute.type,
      visibility: newAttribute.visibility as 'public' | 'private' | 'protected'
    };
    
    setEditingEntity({
      ...editingEntity,
      attributes: [...editingEntity.attributes, attribute]
    });
    
    setNewAttribute({
      name: '',
      type: '',
      visibility: 'public'
    });
  };

  const handleDeleteAttribute = (index: number) => {
    if (!editingEntity) return;
    
    const updatedAttributes = [...editingEntity.attributes];
    updatedAttributes.splice(index, 1);
    
    setEditingEntity({
      ...editingEntity,
      attributes: updatedAttributes
    });
  };

  const handleAddParameter = () => {
    if (!newParameter.name || !newParameter.type) return;
    
    const parameter: Parameter = {
      name: newParameter.name,
      type: newParameter.type
    };
    
    setNewMethod({
      ...newMethod,
      parameters: [...newMethod.parameters || [], parameter]
    });
    
    setNewParameter({
      name: '',
      type: ''
    });
  };

  const handleDeleteParameter = (index: number) => {
    if (!newMethod.parameters) return;
    
    const updatedParameters = [...newMethod.parameters];
    updatedParameters.splice(index, 1);
    
    setNewMethod({
      ...newMethod,
      parameters: updatedParameters
    });
  };

  const handleAddMethod = () => {
    if (!editingEntity || !newMethod.name) return;
    
    const method: Method = {
      name: newMethod.name,
      returnType: newMethod.returnType || 'void',
      parameters: newMethod.parameters || [],
      visibility: newMethod.visibility as 'public' | 'private' | 'protected'
    };
    
    setEditingEntity({
      ...editingEntity,
      methods: [...editingEntity.methods, method]
    });
    
    setNewMethod({
      name: '',
      returnType: '',
      parameters: [],
      visibility: 'public'
    });
  };

  const handleDeleteMethod = (index: number) => {
    if (!editingEntity) return;
    
    const updatedMethods = [...editingEntity.methods];
    updatedMethods.splice(index, 1);
    
    setEditingEntity({
      ...editingEntity,
      methods: updatedMethods
    });
  };

  const handleAddRelationship = () => {
    if (!newRelationship.source || !newRelationship.target || !newRelationship.type) return;
    
    const relationship: Relationship = {
      source: newRelationship.source,
      target: newRelationship.target,
      type: newRelationship.type as 'inheritance' | 'composition' | 'aggregation' | 'association' | 'dependency',
      label: newRelationship.label
    };
    
    setRelationships([...relationships, relationship]);
    
    setNewRelationship({
      source: '',
      target: '',
      type: 'association',
      label: ''
    });
  };

  const handleDeleteRelationship = (index: number) => {
    const updatedRelationships = [...relationships];
    updatedRelationships.splice(index, 1);
    setRelationships(updatedRelationships);
  };

  const renderEntityList = () => (
    <div className="space-y-4">
      <div className="flex items-end space-x-2">
        <div className="flex-1">
          <Label htmlFor="entityName">New Entity Name</Label>
          <Input
            id="entityName"
            value={newEntityName}
            onChange={(e) => setNewEntityName(e.target.value)}
            placeholder="Enter entity name (e.g., Student)"
            disabled={disabled}
          />
        </div>
        <Button 
          onClick={handleAddEntity} 
          disabled={!newEntityName.trim() || disabled}
          style={{ backgroundColor: '#a89467' }}
          className="text-white hover:opacity-90"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Entity
        </Button>
      </div>
      
      <div className="space-y-3 mt-6">
        <h3 className="text-lg font-medium">Defined Entities</h3>
        {entities.length === 0 ? (
          <p className="text-sm text-gray-500">No entities defined yet. Add entities above.</p>
        ) : (
          entities.map((entity, index) => (
            <Card key={index} className="p-3 flex justify-between items-center">
              <div>
                <p className="font-medium">{entity.name}</p>
                <p className="text-xs text-gray-500">
                  {entity.attributes.length} attributes, {entity.methods.length} methods
                </p>
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => handleEditEntity(entity)}
                  disabled={disabled}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  variant="destructive" 
                  size="icon"
                  onClick={() => handleDeleteEntity(index)}
                  disabled={disabled}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );

  const renderEntityEditor = () => {
    if (!editingEntity) return null;
    
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 bg-white">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">Edit Entity: {editingEntity.name}</h3>
            <div className="flex space-x-2">
              <Button 
                variant="outline"
                onClick={handleCancelEdit}
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button 
                onClick={handleSaveEntity}
                style={{ backgroundColor: '#a89467' }}
                className="text-white hover:opacity-90"
              >
                <Check className="h-4 w-4 mr-1" />
                Save
              </Button>
            </div>
          </div>
          
          <Tabs defaultValue="attributes">
            <TabsList>
              <TabsTrigger value="attributes">Attributes</TabsTrigger>
              <TabsTrigger value="methods">Methods</TabsTrigger>
            </TabsList>
            
            <TabsContent value="attributes" className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-md space-y-3">
                <h4 className="font-medium">Add New Attribute</h4>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label htmlFor="attrName">Name</Label>
                    <Input
                      id="attrName"
                      value={newAttribute.name}
                      onChange={(e) => setNewAttribute({...newAttribute, name: e.target.value})}
                      placeholder="age"
                    />
                  </div>
                  <div>
                    <Label htmlFor="attrType">Type</Label>
                    <Input
                      id="attrType"
                      value={newAttribute.type}
                      onChange={(e) => setNewAttribute({...newAttribute, type: e.target.value})}
                      placeholder="number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="attrVisibility">Visibility</Label>
                    <Select 
                      value={newAttribute.visibility} 
                      onValueChange={(value) => setNewAttribute({...newAttribute, visibility: value as 'public' | 'private' | 'protected'})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Visibility" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">public</SelectItem>
                        <SelectItem value="private">private</SelectItem>
                        <SelectItem value="protected">protected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button
                  onClick={handleAddAttribute}
                  disabled={!newAttribute.name || !newAttribute.type}
                  className="mt-2"
                  style={{ backgroundColor: '#a89467' }}
                  size="sm"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Attribute
                </Button>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium">Current Attributes</h4>
                {editingEntity.attributes.length === 0 ? (
                  <p className="text-sm text-gray-500">No attributes defined yet.</p>
                ) : (
                  editingEntity.attributes.map((attr, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-mono">
                          {attr.visibility === 'public' ? '+' : attr.visibility === 'private' ? '-' : '#'}
                        </span>
                        <span>{attr.name}</span>
                        <span className="text-gray-500">: {attr.type}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteAttribute(index)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="methods" className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-md space-y-3">
                <h4 className="font-medium">Add New Method</h4>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label htmlFor="methodName">Name</Label>
                    <Input
                      id="methodName"
                      value={newMethod.name}
                      onChange={(e) => setNewMethod({...newMethod, name: e.target.value})}
                      placeholder="calculateTotal"
                    />
                  </div>
                  <div>
                    <Label htmlFor="methodReturnType">Return Type</Label>
                    <Input
                      id="methodReturnType"
                      value={newMethod.returnType}
                      onChange={(e) => setNewMethod({...newMethod, returnType: e.target.value})}
                      placeholder="number (or void)"
                    />
                  </div>
                  <div>
                    <Label htmlFor="methodVisibility">Visibility</Label>
                    <Select 
                      value={newMethod.visibility} 
                      onValueChange={(value) => setNewMethod({...newMethod, visibility: value as 'public' | 'private' | 'protected'})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Visibility" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">public</SelectItem>
                        <SelectItem value="private">private</SelectItem>
                        <SelectItem value="protected">protected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="mt-2 border-t pt-2">
                  <h5 className="text-sm font-medium mb-2">Parameters</h5>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="paramName">Parameter Name</Label>
                      <Input
                        id="paramName"
                        value={newParameter.name}
                        onChange={(e) => setNewParameter({...newParameter, name: e.target.value})}
                        placeholder="amount"
                        size="sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="paramType">Parameter Type</Label>
                      <Input
                        id="paramType"
                        value={newParameter.type}
                        onChange={(e) => setNewParameter({...newParameter, type: e.target.value})}
                        placeholder="number"
                        size="sm"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleAddParameter}
                    disabled={!newParameter.name || !newParameter.type}
                    className="mt-2"
                    variant="outline"
                    size="sm"
                  >
                    Add Parameter
                  </Button>
                  
                  {(newMethod.parameters || []).length > 0 && (
                    <div className="mt-2 space-y-2">
                      <h6 className="text-xs font-medium">Current Parameters:</h6>
                      {(newMethod.parameters || []).map((param, index) => (
                        <div key={index} className="flex items-center justify-between text-sm bg-gray-100 p-1 rounded">
                          <span>{param.name}: {param.type}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteParameter(index)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <Button
                  onClick={handleAddMethod}
                  disabled={!newMethod.name}
                  className="mt-3"
                  style={{ backgroundColor: '#a89467' }}
                  size="sm"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Method
                </Button>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium">Current Methods</h4>
                {editingEntity.methods.length === 0 ? (
                  <p className="text-sm text-gray-500">No methods defined yet.</p>
                ) : (
                  editingEntity.methods.map((method, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                      <div>
                        <div className="flex items-center space-x-1">
                          <span className="text-xs font-mono">
                            {method.visibility === 'public' ? '+' : method.visibility === 'private' ? '-' : '#'}
                          </span>
                          <span>{method.name}</span>
                          <span className="text-gray-600">(</span>
                          <span className="text-gray-500 text-xs">
                            {method.parameters.map((p, i) => 
                              `${p.name}: ${p.type}${i < method.parameters.length - 1 ? ', ' : ''}`
                            )}
                          </span>
                          <span className="text-gray-600">)</span>
                          <span className="text-gray-500">: {method.returnType}</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteMethod(index)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    );
  };

  const renderRelationshipEditor = () => (
    <div className="space-y-4">
      <div className="bg-gray-50 p-4 rounded-md space-y-3">
        <h3 className="font-medium">Add New Relationship</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="relSource">Source Entity</Label>
            <Select 
              value={newRelationship.source} 
              onValueChange={(value) => setNewRelationship({...newRelationship, source: value})}
              disabled={disabled || entities.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select source entity" />
              </SelectTrigger>
              <SelectContent>
                {entities.map((entity, index) => (
                  <SelectItem key={index} value={entity.name}>
                    {entity.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="relTarget">Target Entity</Label>
            <Select 
              value={newRelationship.target} 
              onValueChange={(value) => setNewRelationship({...newRelationship, target: value})}
              disabled={disabled || entities.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select target entity" />
              </SelectTrigger>
              <SelectContent>
                {entities.map((entity, index) => (
                  <SelectItem key={index} value={entity.name}>
                    {entity.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="relType">Relationship Type</Label>
            <Select 
              value={newRelationship.type} 
              onValueChange={(value) => setNewRelationship({...newRelationship, type: value as any})}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select relationship type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inheritance">Inheritance</SelectItem>
                <SelectItem value="composition">Composition</SelectItem>
                <SelectItem value="aggregation">Aggregation</SelectItem>
                <SelectItem value="association">Association</SelectItem>
                <SelectItem value="dependency">Dependency</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="relLabel">Relationship Label (Optional)</Label>
            <Input
              id="relLabel"
              value={newRelationship.label || ''}
              onChange={(e) => setNewRelationship({...newRelationship, label: e.target.value})}
              placeholder="e.g., enrolls in, manages"
              disabled={disabled}
            />
          </div>
        </div>
        <Button
          onClick={handleAddRelationship}
          disabled={!newRelationship.source || !newRelationship.target || !newRelationship.type || disabled}
          className="mt-2"
          style={{ backgroundColor: '#a89467' }}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Relationship
        </Button>
      </div>
      
      <div className="space-y-3 mt-2">
        <h3 className="text-lg font-medium">Defined Relationships</h3>
        {relationships.length === 0 ? (
          <p className="text-sm text-gray-500">No relationships defined yet. Add relationships above.</p>
        ) : (
          relationships.map((rel, index) => (
            <Card key={index} className="p-3 flex justify-between items-center">
              <div>
                <div className="flex items-center space-x-2">
                  <p className="font-medium">{rel.source}</p>
                  <p className="text-xs text-gray-500">({rel.type})</p>
                  <p className="text-xs italic text-gray-500">{rel.label}</p>
                  <p className="font-medium">{rel.target}</p>
                </div>
              </div>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => handleDeleteRelationship(index)}
                disabled={disabled}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Remove
              </Button>
            </Card>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="entities">Entities</TabsTrigger>
          <TabsTrigger value="relationships">Relationships</TabsTrigger>
        </TabsList>
        
        <TabsContent value="entities" className="mt-4">
          {renderEntityList()}
        </TabsContent>
        
        <TabsContent value="relationships" className="mt-4">
          {renderRelationshipEditor()}
        </TabsContent>
      </Tabs>
      
      {editingEntity && renderEntityEditor()}
    </div>
  );
};

export default EntityRelationshipEditor;
