
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import json
import os
from datetime import datetime
import uuid

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data models
class Attribute(BaseModel):
    name: str
    type: str
    visibility: str

class Parameter(BaseModel):
    name: str
    type: str

class Method(BaseModel):
    name: str
    returnType: str
    parameters: List[Parameter]
    visibility: str

class Entity(BaseModel):
    name: str
    attributes: List[Attribute]
    methods: List[Method]

class Relationship(BaseModel):
    source: str
    target: str
    type: str
    label: Optional[str] = None

class ProcessSpecsRequest(BaseModel):
    description: str

class ProcessSpecsResponse(BaseModel):
    enhancedDescription: str
    entities: List[Entity]
    relationships: List[Relationship]

class GenerateUMLRequest(BaseModel):
    entities: List[Entity]
    relationships: List[Relationship]

class GenerateUMLResponse(BaseModel):
    umlSyntax: str

class SaveUMLRequest(BaseModel):
    title: str
    description: str
    umlSyntax: str
    entities: List[Entity]
    relationships: List[Relationship]

class SaveUMLResponse(BaseModel):
    id: str
    success: bool

class UMLDiagram(BaseModel):
    id: str
    title: str
    description: str
    umlSyntax: str
    entities: List[Entity]
    relationships: List[Relationship]
    createdAt: str

# Storage path
DATA_DIR = '/data'
DIAGRAMS_FILE = os.path.join(DATA_DIR, 'uml_diagrams.json')

# Ensure data directory exists
os.makedirs(DATA_DIR, exist_ok=True)

# Helper functions
def get_diagrams():
    if not os.path.exists(DIAGRAMS_FILE):
        return []
    try:
        with open(DIAGRAMS_FILE, 'r') as f:
            return json.load(f)
    except (json.JSONDecodeError, FileNotFoundError):
        return []

def save_diagrams(diagrams):
    with open(DIAGRAMS_FILE, 'w') as f:
        json.dump(diagrams, f)

@app.get("/")
def read_root():
    return {"status": "UML Diagram Generator API is running"}

@app.post("/process-specs", response_model=ProcessSpecsResponse)
def process_specs(request: ProcessSpecsRequest = Body(...)):
    # For now, we'll forward this to the mockData implementation in frontend
    # In a real implementation, this would process with an LLM
    # This is a placeholder to be replaced with actual LLM processing
    
    description = request.description
    # Extract potential class names - look for capitalized words
    potential_class_names = [
        word for word in set(description.replace('.', ' ').replace(',', ' ').split())
        if len(word) > 3 and word[0] == word[0].upper()
    ]
    
    # If no suitable class names found, extract other nouns
    if len(potential_class_names) < 2:
        common_words = ['the', 'and', 'a', 'an', 'with', 'for', 'to', 'in', 'on', 'at', 'by', 'of']
        potential_class_names = [
            word.capitalize() for word in set(description.replace('.', ' ').replace(',', ' ').split())
            if len(word) > 3 and word.lower() not in common_words
        ][:6]  # Limit to 6 classes
    
    # If still no suitable classes, use fallback default classes
    if len(potential_class_names) < 2:
        domain_keywords = {
            'shop': ['Product', 'Customer', 'Order', 'ShoppingCart'],
            'education': ['Student', 'Course', 'Professor', 'Assignment'],
            'hospital': ['Patient', 'Doctor', 'Appointment', 'Treatment'],
            'bank': ['Account', 'Customer', 'Transaction', 'Loan'],
            'library': ['Book', 'Member', 'Librarian', 'Borrowing'],
            'flight': ['Flight', 'Passenger', 'Booking', 'Ticket']
        }
        
        # Detect domain from description
        domain = next((key for key in domain_keywords if key in description.lower()), None)
        
        if domain:
            potential_class_names = domain_keywords[domain]
        else:
            potential_class_names = ['User', 'System', 'Data', 'Manager']
    
    # Generate entities
    entities = []
    for name in potential_class_names:
        attributes = [
            {"name": "id", "type": "string", "visibility": "private"},
            {"name": f"{name.lower()}Name", "type": "string", "visibility": "private"}
        ]
        
        # Add domain-specific attributes
        if any(word in description.lower() for word in ['date', 'time']):
            attributes.append({"name": "createdAt", "type": "Date", "visibility": "private"})
        
        if any(word in description.lower() for word in ['price', 'cost']):
            attributes.append({"name": "price", "type": "number", "visibility": "private"})
        
        if any(word in description.lower() for word in ['status', 'state']):
            attributes.append({"name": "status", "type": "string", "visibility": "private"})
        
        # Generate methods
        methods = [
            {
                "name": f"get{name}",
                "returnType": name,
                "parameters": [],
                "visibility": "public"
            }
        ]
        
        # Add crud methods based on context
        if any(word in description.lower() for word in ['update', 'edit']):
            methods.append({
                "name": f"update{name}",
                "returnType": "boolean",
                "parameters": [{"name": "data", "type": name}],
                "visibility": "public"
            })
        
        if any(word in description.lower() for word in ['delete', 'remove']):
            methods.append({
                "name": f"delete{name}",
                "returnType": "void",
                "parameters": [{"name": "id", "type": "string"}],
                "visibility": "public"
            })
        
        if any(word in description.lower() for word in ['validate', 'check']):
            methods.append({
                "name": "validate",
                "returnType": "boolean",
                "parameters": [],
                "visibility": "public"
            })
        
        entities.append({
            "name": name,
            "attributes": attributes,
            "methods": methods
        })
    
    # Create relationships
    relationships = []
    if len(entities) >= 2:
        has_association = any(word in description.lower() for word in ['has', 'with', 'contains'])
        has_inheritance = any(word in description.lower() for word in ['inherits', 'extends', 'type of'])
        has_dependency = any(word in description.lower() for word in ['uses', 'depends', 'requires'])
        has_aggregation = any(word in description.lower() for word in ['consists', 'comprises', 'composed'])
        
        # Add relationships between entities
        relationships.append({
            "source": entities[0]["name"],
            "target": entities[1]["name"],
            "type": "association" if has_association else "dependency" if has_dependency else "association"
        })
        
        if len(entities) >= 3:
            relationships.append({
                "source": entities[0]["name"],
                "target": entities[2]["name"],
                "type": "aggregation" if has_aggregation else "dependency",
                "label": "contains" if has_aggregation else "uses"
            })
        
        if len(entities) >= 4:
            if has_inheritance:
                relationships.append({
                    "source": entities[3]["name"],
                    "target": entities[1]["name"],
                    "type": "inheritance"
                })
            else:
                relationships.append({
                    "source": entities[2]["name"],
                    "target": entities[3]["name"],
                    "type": "association",
                    "label": "relates to"
                })
        
        if len(entities) >= 5:
            relationships.append({
                "source": entities[4]["name"],
                "target": entities[0]["name"],
                "type": "composition",
                "label": "part of"
            })
    
    # Create enhanced description
    enhanced_description = f"""
System Description:

This system comprises {len(entities)} main entities: {', '.join([e['name'] for e in entities])}.

"""
    
    # Add entity descriptions
    for entity in entities:
        enhanced_description += f"{entity['name']}: Contains {len(entity['attributes'])} attributes and {len(entity['methods'])} methods for data management.\n"
    
    enhanced_description += "\nRelationships:\n"
    
    # Add relationship descriptions
    for rel in relationships:
        relationship_text = ""
        if rel["type"] == "association":
            relationship_text = f"{rel['source']} is associated with {rel['target']}"
        elif rel["type"] == "inheritance":
            relationship_text = f"{rel['source']} inherits from {rel['target']}"
        elif rel["type"] == "composition":
            relationship_text = f"{rel['source']} is composed of {rel['target']}"
        elif rel["type"] == "aggregation":
            relationship_text = f"{rel['source']} contains {rel['target']}"
        elif rel["type"] == "dependency":
            relationship_text = f"{rel['source']} depends on {rel['target']}"
        
        label_text = f" ({rel['label']})" if "label" in rel and rel["label"] else ""
        enhanced_description += f"{relationship_text}{label_text}.\n"
    
    enhanced_description += "\nThis model represents a simplified interpretation of the system based on the input description."
    
    response = {
        "enhancedDescription": enhanced_description,
        "entities": entities,
        "relationships": relationships
    }
    
    return response

@app.post("/generate-uml", response_model=GenerateUMLResponse)
def generate_uml(request: GenerateUMLRequest = Body(...)):
    entities = request.entities
    relationships = request.relationships
    
    mermaid_syntax = "classDiagram\n"
    
    # Add classes with attributes and methods
    for entity in entities:
        mermaid_syntax += f"  class {entity.name} {{\n"
        
        # Add attributes
        for attr in entity.attributes:
            visibility = "-" if attr.visibility == "private" else "#" if attr.visibility == "protected" else "+"
            mermaid_syntax += f"    {visibility}{attr.name} : {attr.type}\n"
        
        # Add methods
        for method in entity.methods:
            visibility = "-" if method.visibility == "private" else "#" if method.visibility == "protected" else "+"
            params = ", ".join([f"{p.name}: {p.type}" for p in method.parameters])
            mermaid_syntax += f"    {visibility}{method.name}({params}) {method.returnType}\n"
        
        mermaid_syntax += "  }\n"
    
    # Add relationships
    for rel in relationships:
        relationship_symbol = {
            "inheritance": "--|>",
            "composition": "--*",
            "aggregation": "--o",
            "dependency": "..>",
            "association": "-->"
        }.get(rel.type, "-->")
        
        label = f" : {rel.label}" if rel.label else ""
        mermaid_syntax += f"  {rel.source} {relationship_symbol} {rel.target}{label}\n"
    
    return {"umlSyntax": mermaid_syntax}

@app.post("/save-uml", response_model=SaveUMLResponse)
def save_uml(request: SaveUMLRequest = Body(...)):
    diagrams = get_diagrams()
    
    new_diagram = {
        "id": str(uuid.uuid4()),
        "title": request.title or f"UML Diagram {len(diagrams) + 1}",
        "description": request.description,
        "umlSyntax": request.umlSyntax,
        "entities": [entity.dict() for entity in request.entities],
        "relationships": [rel.dict() for rel in request.relationships],
        "createdAt": datetime.now().isoformat()
    }
    
    diagrams.append(new_diagram)
    save_diagrams(diagrams)
    
    return {"id": new_diagram["id"], "success": True}

@app.get("/uml-history", response_model=List[UMLDiagram])
def get_uml_history():
    diagrams = get_diagrams()
    # Sort by createdAt in descending order (newest first)
    diagrams.sort(key=lambda x: x.get("createdAt", ""), reverse=True)
    return diagrams

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
