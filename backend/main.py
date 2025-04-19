
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import mysql.connector
from mysql.connector import Error
import json
import os
import datetime

app = FastAPI()

# Add CORS middleware to allow frontend to communicate with backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Environment variables for MySQL connection - will be provided by user
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "uml_generator")
DB_PORT = os.getenv("DB_PORT", "3306")

# Database connection function
def get_db_connection():
    try:
        connection = mysql.connector.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME,
            port=DB_PORT
        )
        return connection
    except Error as e:
        print(f"Error connecting to MySQL: {e}")
        raise HTTPException(status_code=500, detail=f"Database connection error: {str(e)}")


# Create necessary tables if they don't exist
def init_db():
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        
        # Create diagrams table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS diagrams (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id VARCHAR(255) NOT NULL,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
        ''')
        
        # Create entities table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS entities (
            id INT AUTO_INCREMENT PRIMARY KEY,
            diagram_id INT NOT NULL,
            name VARCHAR(255) NOT NULL,
            attributes JSON,
            methods JSON,
            FOREIGN KEY (diagram_id) REFERENCES diagrams(id) ON DELETE CASCADE
        )
        ''')
        
        # Create relationships table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS relationships (
            id INT AUTO_INCREMENT PRIMARY KEY,
            diagram_id INT NOT NULL,
            source VARCHAR(255) NOT NULL,
            target VARCHAR(255) NOT NULL,
            type VARCHAR(50) NOT NULL,
            label VARCHAR(255),
            FOREIGN KEY (diagram_id) REFERENCES diagrams(id) ON DELETE CASCADE
        )
        ''')
        
        connection.commit()
        print("Database tables created successfully!")
    except Error as e:
        print(f"Error creating database tables: {e}")
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()


# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    init_db()


# Models
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
    userId: Optional[str] = "anonymous"


class ProcessSpecsResponse(BaseModel):
    enhancedDescription: str
    entities: List[Entity]
    relationships: List[Relationship]


class GenerateUMLRequest(BaseModel):
    entities: List[Entity]
    relationships: List[Relationship]
    userId: Optional[str] = "anonymous"


class GenerateUMLResponse(BaseModel):
    umlSyntax: str


class SaveDiagramRequest(BaseModel):
    title: str
    description: str
    userId: str
    entities: List[Entity]
    relationships: List[Relationship]
    umlSyntax: str


class DiagramHistoryItem(BaseModel):
    id: int
    title: str
    description: str
    created_at: str
    entities: List[Entity]
    relationships: List[Relationship]
    umlSyntax: str


# LLM processing function - this would ideally call an actual LLM in production
def process_with_llm(description: str) -> ProcessSpecsResponse:
    # For demonstration purposes, we'll return a simple class structure
    # In a real implementation, this would call an LLM API
    
    # Example: University System
    if "university" in description.lower() or "school" in description.lower():
        return ProcessSpecsResponse(
            enhancedDescription=f"Enhanced: {description}\n\nThis system appears to be a university management system with students, courses, and professors.",
            entities=[
                Entity(
                    name="Student",
                    attributes=[
                        Attribute(name="id", type="int", visibility="private"),
                        Attribute(name="name", type="string", visibility="private"),
                        Attribute(name="email", type="string", visibility="private")
                    ],
                    methods=[
                        Method(name="enrollCourse", returnType="boolean", parameters=[Parameter(name="courseId", type="int")], visibility="public")
                    ]
                ),
                Entity(
                    name="Professor",
                    attributes=[
                        Attribute(name="id", type="int", visibility="private"),
                        Attribute(name="name", type="string", visibility="private"),
                        Attribute(name="department", type="string", visibility="private")
                    ],
                    methods=[
                        Method(name="assignCourse", returnType="void", parameters=[Parameter(name="courseId", type="int")], visibility="public")
                    ]
                ),
                Entity(
                    name="Course",
                    attributes=[
                        Attribute(name="id", type="int", visibility="private"),
                        Attribute(name="title", type="string", visibility="private"),
                        Attribute(name="credits", type="int", visibility="private")
                    ],
                    methods=[
                        Method(name="getEnrolledStudents", returnType="List<Student>", parameters=[], visibility="public")
                    ]
                )
            ],
            relationships=[
                Relationship(source="Student", target="Course", type="association", label="enrolls"),
                Relationship(source="Professor", target="Course", type="association", label="teaches")
            ]
        )
    # Example: E-commerce System
    elif "commerce" in description.lower() or "shop" in description.lower() or "store" in description.lower():
        return ProcessSpecsResponse(
            enhancedDescription=f"Enhanced: {description}\n\nThis system appears to be an e-commerce platform with products, customers, and orders.",
            entities=[
                Entity(
                    name="Product",
                    attributes=[
                        Attribute(name="id", type="int", visibility="private"),
                        Attribute(name="name", type="string", visibility="private"),
                        Attribute(name="price", type="decimal", visibility="private")
                    ],
                    methods=[
                        Method(name="getInventory", returnType="int", parameters=[], visibility="public")
                    ]
                ),
                Entity(
                    name="Customer",
                    attributes=[
                        Attribute(name="id", type="int", visibility="private"),
                        Attribute(name="name", type="string", visibility="private"),
                        Attribute(name="email", type="string", visibility="private")
                    ],
                    methods=[
                        Method(name="placeOrder", returnType="Order", parameters=[Parameter(name="products", type="List<Product>")], visibility="public")
                    ]
                ),
                Entity(
                    name="Order",
                    attributes=[
                        Attribute(name="id", type="int", visibility="private"),
                        Attribute(name="date", type="datetime", visibility="private"),
                        Attribute(name="total", type="decimal", visibility="private")
                    ],
                    methods=[
                        Method(name="getOrderItems", returnType="List<OrderItem>", parameters=[], visibility="public")
                    ]
                )
            ],
            relationships=[
                Relationship(source="Customer", target="Order", type="association", label="places"),
                Relationship(source="Order", target="Product", type="aggregation", label="contains")
            ]
        )
    else:
        # Default generic system
        return ProcessSpecsResponse(
            enhancedDescription=f"Enhanced: {description}\n\nThis appears to be a generic system with users and resources.",
            entities=[
                Entity(
                    name="User",
                    attributes=[
                        Attribute(name="id", type="int", visibility="private"),
                        Attribute(name="name", type="string", visibility="private"),
                        Attribute(name="email", type="string", visibility="private")
                    ],
                    methods=[
                        Method(name="login", returnType="boolean", parameters=[
                            Parameter(name="password", type="string")
                        ], visibility="public")
                    ]
                ),
                Entity(
                    name="Resource",
                    attributes=[
                        Attribute(name="id", type="int", visibility="private"),
                        Attribute(name="name", type="string", visibility="private"),
                        Attribute(name="type", type="string", visibility="private")
                    ],
                    methods=[
                        Method(name="access", returnType="void", parameters=[
                            Parameter(name="userId", type="int")
                        ], visibility="public")
                    ]
                )
            ],
            relationships=[
                Relationship(source="User", target="Resource", type="association", label="accesses")
            ]
        )


# Generate Mermaid UML syntax from entities and relationships
def generate_mermaid_uml(entities: List[Entity], relationships: List[Relationship]) -> str:
    # Build the class diagram in Mermaid syntax
    mermaid_syntax = "classDiagram\n"
    
    # Add classes with attributes and methods
    for entity in entities:
        mermaid_syntax += f"    class {entity.name} {{\n"
        
        # Add attributes
        for attr in entity.attributes:
            visibility = "+" if attr.visibility == "public" else "-" if attr.visibility == "private" else "#"
            mermaid_syntax += f"        {visibility}{attr.name}: {attr.type}\n"
        
        # Add methods
        for method in entity.methods:
            visibility = "+" if method.visibility == "public" else "-" if method.visibility == "private" else "#"
            params = ", ".join([f"{p.name}: {p.type}" for p in method.parameters])
            mermaid_syntax += f"        {visibility}{method.name}({params}): {method.returnType}\n"
        
        mermaid_syntax += "    }\n"
    
    # Add relationships
    for rel in relationships:
        arrow = "-->"
        if rel.type == "inheritance":
            arrow = "--|>"
        elif rel.type == "composition":
            arrow = "--*"
        elif rel.type == "aggregation":
            arrow = "--o"
        elif rel.type == "dependency":
            arrow = "..>"
        
        label = f" : {rel.label}" if rel.label else ""
        mermaid_syntax += f"    {rel.source} {arrow} {rel.target}{label}\n"
    
    return mermaid_syntax


# API Routes
@app.post("/process-specs", response_model=ProcessSpecsResponse)
async def process_specs(request: ProcessSpecsRequest):
    try:
        return process_with_llm(request.description)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing specs: {str(e)}")


@app.post("/generate-uml", response_model=GenerateUMLResponse)
async def generate_uml(request: GenerateUMLRequest):
    try:
        uml_syntax = generate_mermaid_uml(request.entities, request.relationships)
        return GenerateUMLResponse(umlSyntax=uml_syntax)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating UML: {str(e)}")


@app.post("/save-diagram")
async def save_diagram(request: SaveDiagramRequest, connection=Depends(get_db_connection)):
    try:
        cursor = connection.cursor()
        
        # Insert diagram
        cursor.execute(
            "INSERT INTO diagrams (user_id, title, description) VALUES (%s, %s, %s)",
            (request.userId, request.title, request.description)
        )
        diagram_id = cursor.lastrowid
        
        # Insert entities
        for entity in request.entities:
            cursor.execute(
                "INSERT INTO entities (diagram_id, name, attributes, methods) VALUES (%s, %s, %s, %s)",
                (
                    diagram_id,
                    entity.name,
                    json.dumps([attr.dict() for attr in entity.attributes]),
                    json.dumps([method.dict() for method in entity.methods])
                )
            )
        
        # Insert relationships
        for rel in request.relationships:
            cursor.execute(
                "INSERT INTO relationships (diagram_id, source, target, type, label) VALUES (%s, %s, %s, %s, %s)",
                (diagram_id, rel.source, rel.target, rel.type, rel.label)
            )
        
        connection.commit()
        
        return {"status": "success", "diagram_id": diagram_id}
    except Exception as e:
        connection.rollback()
        raise HTTPException(status_code=500, detail=f"Error saving diagram: {str(e)}")
    finally:
        if connection.is_connected():
            cursor.close()


@app.get("/diagrams/{user_id}")
async def get_diagrams(user_id: str, connection=Depends(get_db_connection)):
    try:
        cursor = connection.cursor(dictionary=True)
        
        # Get all diagrams for the user
        cursor.execute(
            "SELECT id, title, description, created_at FROM diagrams WHERE user_id = %s ORDER BY created_at DESC",
            (user_id,)
        )
        diagrams = cursor.fetchall()
        
        # Format the timestamp to string
        for diagram in diagrams:
            if isinstance(diagram['created_at'], datetime.datetime):
                diagram['created_at'] = diagram['created_at'].isoformat()
        
        return {"diagrams": diagrams}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching diagrams: {str(e)}")
    finally:
        if connection.is_connected():
            cursor.close()


@app.get("/diagram/{diagram_id}")
async def get_diagram(diagram_id: int, connection=Depends(get_db_connection)):
    try:
        cursor = connection.cursor(dictionary=True)
        
        # Get diagram details
        cursor.execute(
            "SELECT id, title, description, created_at FROM diagrams WHERE id = %s",
            (diagram_id,)
        )
        diagram = cursor.fetchone()
        
        if not diagram:
            raise HTTPException(status_code=404, detail="Diagram not found")
        
        # Format the timestamp
        if isinstance(diagram['created_at'], datetime.datetime):
            diagram['created_at'] = diagram['created_at'].isoformat()
        
        # Get entities for this diagram
        cursor.execute(
            "SELECT name, attributes, methods FROM entities WHERE diagram_id = %s",
            (diagram_id,)
        )
        entities_raw = cursor.fetchall()
        
        # Get relationships for this diagram
        cursor.execute(
            "SELECT source, target, type, label FROM relationships WHERE diagram_id = %s",
            (diagram_id,)
        )
        relationships_raw = cursor.fetchall()
        
        # Process entities
        entities = []
        for entity in entities_raw:
            attributes = json.loads(entity['attributes'])
            methods = json.loads(entity['methods'])
            entities.append({
                "name": entity['name'],
                "attributes": attributes,
                "methods": methods
            })
        
        # Process relationships
        relationships = []
        for rel in relationships_raw:
            relationships.append({
                "source": rel['source'],
                "target": rel['target'],
                "type": rel['type'],
                "label": rel['label']
            })
        
        # Generate UML syntax
        uml_syntax = generate_mermaid_uml(
            [Entity(**entity) for entity in entities],
            [Relationship(**rel) for rel in relationships]
        )
        
        # Combine all data
        result = {
            "id": diagram['id'],
            "title": diagram['title'],
            "description": diagram['description'],
            "created_at": diagram['created_at'],
            "entities": entities,
            "relationships": relationships,
            "umlSyntax": uml_syntax
        }
        
        return result
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching diagram: {str(e)}")
    finally:
        if connection.is_connected():
            cursor.close()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
