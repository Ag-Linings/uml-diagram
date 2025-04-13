
import React from 'react';
import { Entity, Relationship } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface EntityListProps {
  entities: Entity[];
  relationships: Relationship[];
}

const EntityList: React.FC<EntityListProps> = ({ entities, relationships }) => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Entities</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {entities.map((entity) => (
          <Card key={entity.name}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{entity.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-1">Attributes</h4>
                <ul className="space-y-1">
                  {entity.attributes.map((attr, index) => (
                    <li key={index} className="text-sm">
                      <Badge variant={attr.visibility === 'private' ? "outline" : "secondary"} className="mr-2">
                        {attr.visibility === 'private' ? '-' : attr.visibility === 'protected' ? '#' : '+'}
                      </Badge>
                      <span className="font-medium">{attr.name}:</span> {attr.type}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">Methods</h4>
                <ul className="space-y-1">
                  {entity.methods.map((method, index) => (
                    <li key={index} className="text-sm">
                      <Badge variant={method.visibility === 'private' ? "outline" : "secondary"} className="mr-2">
                        {method.visibility === 'private' ? '-' : method.visibility === 'protected' ? '#' : '+'}
                      </Badge>
                      <span className="font-medium">{method.name}</span>
                      ({method.parameters.map(p => `${p.name}: ${p.type}`).join(', ')})
                      : {method.returnType}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <h2 className="text-xl font-semibold mt-6">Relationships</h2>
      <Card>
        <CardContent className="pt-4">
          <ul className="space-y-2">
            {relationships.map((rel, index) => (
              <li key={index} className="p-2 bg-gray-50 rounded-md">
                <div className="flex items-center">
                  <span className="font-medium">{rel.source}</span>
                  <span className="mx-2">
                    {rel.type === 'inheritance' && '▷'}
                    {rel.type === 'composition' && '◆'}
                    {rel.type === 'aggregation' && '◇'}
                    {rel.type === 'association' && '→'}
                    {rel.type === 'dependency' && '⤍'}
                  </span>
                  <span className="font-medium">{rel.target}</span>
                  <Badge className="ml-2" variant="outline">{rel.type}</Badge>
                  {rel.label && <span className="ml-2 text-sm text-gray-500">({rel.label})</span>}
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default EntityList;
