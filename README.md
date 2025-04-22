# UML Diagram generator

A microservice that enables users to generate UML class diagrams from natural language system descriptions or manually defined entities and relationships. It uses a modern frontend stack and a TypeScript backend to provide a seamless and responsive user experience.

## Features 
- Natural Language Input for system descriptions to auto-generate UML class diagrams
- Manual Input Interface for defining custom entities, attributes, methods, and relationships
- Real-time UML Diagram Generation using Mermaid.js syntax
- Interactive Diagram Rendering with automatic updates based on user input
- User-Friendly Design with a responsive UI built for both desktop and mobile devices

## Infrastructure
- Frontend: React, TypeScript, Tailwind CSS
- Backend: TypeScript, Node.js
- Diagram Rendering: Mermaid.js

## Architecture

### Frontend
- React Application with TypeScript to build a dynamic and responsive user interface for users to input system descriptions and manually define entities and relationships.
- Tailwind CSS for efficient and responsive styling, ensuring a clean user interface.
- Interactive UML Diagram Renderer using Mermaid.js to generate and display UML diagrams in real time.
- Form for Project Description Input where users can input system descriptions in natural language, which are sent to the backend for processing.

### Backend
- TypeScript for the backend logic, providing APIs to process user input and generate UML diagrams.
- RESTful API for:
  - Processing System Descriptions to extract entities, attributes, methods, and relationships from natural language descriptions.
  - Generating UML Diagrams by converting the processed data into Mermaid.js syntax for rendering on the frontend.
- Mermaid.js for diagram generation and rendering in the frontend using the extracted and processed data.

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```


