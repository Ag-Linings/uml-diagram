from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import mysql.connector
from mysql.connector import Error
import json
import os
import datetime
import time
import logging
import traceback

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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
DB_PASSWORD = os.getenv("DB_PASSWORD", "****")
DB_NAME = os.getenv("DB_NAME", "uml_generator")
DB_PORT = os.getenv("DB_PORT", "3306")

logger.info(f"Database configuration: Host={DB_HOST}, User={DB_USER}, DB={DB_NAME}, Port={DB_PORT}")

# Max retries for DB connection
MAX_RETRIES = 10
RETRY_DELAY = 5  # seconds

# Database connection function with retry logic
def get_db_connection():
    retry_count = 0
    while retry_count < MAX_RETRIES:
        try:
            connection = mysql.connector.connect(
                host=DB_HOST,
                user=DB_USER,
                password=DB_PASSWORD,
                database=DB_NAME,
                port=int(DB_PORT),
                auth_plugin='mysql_native_password',
                connection_timeout=30
            )
            if connection.is_connected():
                logger.info("Successfully connected to MySQL database")
                return connection
        except Error as e:
            retry_count += 1
            logger.error(f"Error connecting to MySQL (Attempt {retry_count}/{MAX_RETRIES}): {e}")
            logger.error(traceback.format_exc())
            if retry_count < MAX_RETRIES:
                logger.info(f"Retrying in {RETRY_DELAY} seconds...")
                time.sleep(RETRY_DELAY)
            else:
                logger.error("Max retries reached. Could not connect to database.")
                raise HTTPException(status_code=500, detail=f"Database connection error: {str(e)}")
    
    # If we get here, we've exhausted all retries
    raise HTTPException(status_code=500, detail="Could not connect to database after multiple attempts")


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
            uml_syntax TEXT,
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
        logger.info("Database tables created successfully!")

        # Test insert to verify write access
        try:
            cursor.execute(
                "INSERT INTO diagrams (user_id, title, description, uml_syntax) VALUES (%s, %s, %s, %s)",
                ("test-user", "Test Diagram", "This is a test", "classDiagram\n    class Test")
            )
            connection.commit()
            logger.info("Test insert successful - database is ready for writing")
        except Exception as e:
            logger.error(f"Test insert failed: {e}")
            logger.error(traceback.format_exc())

    except Error as e:
        logger.error(f"Error creating database tables: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Database initialization error: {str(e)}")
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()


# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    logger.info("Starting application and initializing database...")
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
    # Example: Library System
    elif "library" in description.lower() or "book" in description.lower() or "borrowing" in description.lower():
        return ProcessSpecsResponse(
            enhancedDescription=f"Enhanced: {description}\n\nThis system appears to be a library management system with books, members, and librarians.",
            entities=[
                Entity(
                    name="Book",
                    attributes=[
                        Attribute(name="id", type="int", visibility="private"),
                        Attribute(name="title", type="string", visibility="private"),
                        Attribute(name="author", type="string", visibility="private"),
                        Attribute(name="isbn", type="string", visibility="private")
                    ],
                    methods=[
                        Method(name="isAvailable", returnType="boolean", parameters=[], visibility="public")
                    ]
                ),
                Entity(
                    name="Member",
                    attributes=[
                        Attribute(name="id", type="int", visibility="private"),
                        Attribute(name="name", type="string", visibility="private"),
                        Attribute(name="email", type="string", visibility="private"),
                        Attribute(name="membershipExpiry", type="date", visibility="private")
                    ],
                    methods=[
                        Method(name="borrowBook", returnType="boolean", parameters=[Parameter(name="bookId", type="int")], visibility="public")
                    ]
                ),
                Entity(
                    name="Librarian",
                    attributes=[
                        Attribute(name="id", type="int", visibility="private"),
                        Attribute(name="name", type="string", visibility="private"),
                        Attribute(name="staffId", type="string", visibility="private")
                    ],
                    methods=[
                        Method(name="addBook", returnType="void", parameters=[Parameter(name="bookDetails", type="BookDetails")], visibility="public")
                    ]
                ),
                Entity(
                    name="BorrowRecord",
                    attributes=[
                        Attribute(name="id", type="int", visibility="private"),
                        Attribute(name="borrowDate", type="date", visibility="private"),
                        Attribute(name="returnDate", type="date", visibility="private")
                    ],
                    methods=[
                        Method(name="isOverdue", returnType="boolean", parameters=[], visibility="public")
                    ]
                )
            ],
            relationships=[
                Relationship(source="Member", target="Book", type="association", label="borrows"),
                Relationship(source="Librarian", target="Book", type="association", label="manages"),
                Relationship(source="BorrowRecord", target="Book", type="association", label="references"),
                Relationship(source="BorrowRecord", target="Member", type="association", label="belongsTo")
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
    
    return mermaid_syntax.strip()


# Save diagram data to database after API call
def save_uml_data_to_db(userId: str, entities: List[Entity], relationships: List[Relationship], uml_syntax: str) -> int:
    connection = None
    try:
        logger.info(f"Attempting to save UML data to DB for user {userId}")
        connection = get_db_connection()
        cursor = connection.cursor()

        # Generate a title and description from the data
        entity_names = ", ".join([entity.name for entity in entities])
        title = f"UML Diagram - {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
        description = f"Auto-generated diagram with entities: {entity_names}"

        logger.info(f"Inserting diagram into MySQL with title: {title}")
        
        # Insert diagram
        cursor.execute(
            "INSERT INTO diagrams (user_id, title, description, uml_syntax) VALUES (%s, %s, %s, %s)",
            (userId, title, description, uml_syntax)
        )
        diagram_id = cursor.lastrowid
        logger.info(f"Created diagram with ID: {diagram_id}")
        
        # Insert entities
        for entity in entities:
            attributes_json = json.dumps([
                {"name": attr.name, "type": attr.type, "visibility": attr.visibility}
                for attr in entity.attributes
            ])
            methods_json = json.dumps([
                {
                    "name": method.name,
                    "returnType": method.returnType,
                    "visibility": method.visibility,
                    "parameters": [{"name": p.name, "type": p.type} for p in method.parameters]
                }
                for method in entity.methods
            ])

            logger.info(f"Inserting entity {entity.name} into MySQL")
            cursor.execute(
                "INSERT INTO entities (diagram_id, name, attributes, methods) VALUES (%s, %s, %s, %s)",
                (diagram_id, entity.name, attributes_json, methods_json)
            )

        # Insert relationships
        for rel in relationships:
            logger.info(f"Inserting relationship {rel.source} -> {rel.target} into MySQL")
            cursor.execute(
                "INSERT INTO relationships (diagram_id, source, target, type, label) VALUES (%s, %s, %s, %s, %s)",
                (diagram_id, rel.source, rel.target, rel.type, rel.label)
            )

        connection.commit()
        logger.info(f"Successfully saved diagram {diagram_id} to database")
        return diagram_id
    
    except Exception as e:
        logger.error(f"Error saving diagram data to DB: {e}")
        logger.error(traceback.format_exc())
        if connection:
            connection.rollback()
        raise e
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()


# API Routes
@app.post("/process-specs", response_model=ProcessSpecsResponse)
async def process_specs(request: ProcessSpecsRequest):
    try:
        logger.info(f"Processing specs for user {request.userId}")
        return process_with_llm(request.description)
    except Exception as e:
        logger.error(f"Error processing specs: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error processing specs: {str(e)}")


@app.post("/generate-uml", response_model=GenerateUMLResponse)
async def generate_uml(request: GenerateUMLRequest):
    try:
        logger.info(f"Generating UML for user {request.userId}")
        uml_syntax = generate_mermaid_uml(request.entities, request.relationships)
        
        # Save to database automatically when UML is generated
        try:
            diagram_id = save_uml_data_to_db(
                userId=request.userId,
                entities=request.entities,
                relationships=request.relationships,
                uml_syntax=uml_syntax
            )
            logger.info(f"UML data automatically saved to database with ID: {diagram_id}")
        except Exception as db_error:
            logger.error(f"Database save failed, but continuing with UML generation: {db_error}")
            logger.error(traceback.format_exc())
        
        return GenerateUMLResponse(umlSyntax=uml_syntax)
    except Exception as e:
        logger.error(f"Error generating UML: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error generating UML: {str(e)}")


@app.post("/save-diagram")
async def save_diagram(request: SaveDiagramRequest):
    connection = None
    try:
        logger.info(f"Explicitly saving diagram for user {request.userId}")
        connection = get_db_connection()
        cursor = connection.cursor()

        # Insert diagram with umlSyntax
        cursor.execute(
            "INSERT INTO diagrams (user_id, title, description, uml_syntax) VALUES (%s, %s, %s, %s)",
            (request.userId, request.title, request.description, request.umlSyntax)
        )
        diagram_id = cursor.lastrowid
        logger.info(f"Created diagram with ID: {diagram_id}")

        # Insert entities
        for entity in request.entities:
            attributes_json = json.dumps([
                {"name": attr.name, "type": attr.type, "visibility": attr.visibility}
                for attr in entity.attributes
            ])
            methods_json = json.dumps([
                {
                    "name": method.name,
                    "returnType": method.returnType,
                    "visibility": method.visibility,
                    "parameters": [{"name": p.name, "type": p.type} for p in method.parameters]
                }
                for method in method.methods
            ])

            cursor.execute(
                "INSERT INTO entities (diagram_id, name, attributes, methods) VALUES (%s, %s, %s, %s)",
                (diagram_id, entity.name, attributes_json, methods_json)
            )

        # Insert relationships
        for rel in request.relationships:
            cursor.execute(
                "INSERT INTO relationships (diagram_id, source, target, type, label) VALUES (%s, %s, %s, %s, %s)",
                (diagram_id, rel.source, rel.target, rel.type, rel.label)
            )

        connection.commit()
        logger.info(f"Successfully saved diagram {diagram_id} to database")
        return {"status": "success", "diagram_id": diagram_id}

    except Exception as e:
        logger.error(f"Error saving diagram: {e}")
        logger.error(traceback.format_exc())
        if connection:
            connection.rollback()
        raise HTTPException(status_code=500, detail=f"Error saving diagram: {str(e)}")
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()


@app.get("/diagrams/{user_id}")
async def get_diagrams(user_id: str):
    connection = None
    try:
        logger.info(f"Fetching diagrams for user {user_id}")
        connection = get_db_connection()
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
        
        logger.info(f"Found {len(diagrams)} diagrams for user {user_id}")
        return {"diagrams": diagrams}
    except Exception as e:
        logger.error(f"Error fetching diagrams: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error fetching diagrams: {str(e)}")
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()


@app.get("/diagram/{diagram_id}")
async def get_diagram(diagram_id: int):
    connection = None
    try:
        logger.info(f"Fetching diagram with ID {diagram_id}")
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Get diagram details
        cursor.execute(
            "SELECT id, title, description, created_at, uml_syntax FROM diagrams WHERE id = %s",
            (diagram_id,)
        )
        diagram = cursor.fetchone()
        
        if not diagram:
            logger.warning(f"Diagram not found with ID {diagram_id}")
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
            attributes_json = entity['attributes']
            methods_json = entity['methods']
            
            # Handle string or bytes
            if isinstance(attributes_json, bytes):
                attributes_json = attributes_json.decode('utf-8')
            if isinstance(methods_json, bytes):
                methods_json = methods_json.decode('utf-8')
                
            attributes = json.loads(attributes_json)
            methods = json.loads(methods_json)
            
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
        
        # Use stored UML syntax if available, otherwise regenerate
        uml_syntax = diagram.get('uml_syntax')
        if not uml_syntax:
            # Generate UML syntax
            uml_syntax = generate_mermaid_uml(
                [Entity(
                    name=entity['name'],
                    attributes=[Attribute(**attr) for attr in entity['attributes']],
                    methods=[Method(
                        name=method['name'],
                        returnType=method['returnType'],
                        visibility=method['visibility'],
                        parameters=[Parameter(**param) for param in method['parameters']]
                    ) for method in entity['methods']]
                ) for entity in entities],
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
        
        logger.info(f"Successfully retrieved diagram {diagram_id}")
        return result
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error fetching diagram: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error fetching diagram: {str(e)}")
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()


@app.get("/health")
async def health_check():
    try:
        # Test database connection
        connection = get_db_connection()
        if connection.is_connected():
            cursor = connection.cursor()
            cursor.execute("SHOW TABLES")
            tables = cursor.fetchall()
            
            # Count records in diagrams table
            cursor.execute("SELECT COUNT(*) FROM diagrams")
            diagram_count = cursor.fetchone()[0]
            
            cursor.close()
            connection.close()
            return {
                "status": "healthy", 
                "database": "connected", 
                "tables_found": len(tables),
                "diagram_count": diagram_count
            }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        logger.error(traceback.format_exc())
        return {"status": "unhealthy", "database": "disconnected", "error": str(e)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
