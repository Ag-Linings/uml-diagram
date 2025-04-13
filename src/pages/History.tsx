
import React, { useEffect, useState } from 'react';
import { getUMLHistory, UMLDiagram } from '@/services/api';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Clock, Eye } from 'lucide-react';

const History: React.FC = () => {
  const [diagrams, setDiagrams] = useState<UMLDiagram[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDiagrams();
  }, []);

  const fetchDiagrams = async () => {
    try {
      setLoading(true);
      const history = await getUMLHistory();
      setDiagrams(history);
    } catch (error) {
      toast.error("Failed to load UML history");
      console.error("Error loading UML history:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDiagram = (diagram: UMLDiagram) => {
    // Store the selected diagram in session storage to be retrieved by the UML Generator
    sessionStorage.setItem('selectedDiagram', JSON.stringify(diagram));
    navigate('/');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1 container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <Clock className="h-6 w-6" />
              UML Diagram History
            </CardTitle>
            <CardDescription>
              View and restore your previously created UML diagrams
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-uml-primary"></div>
              </div>
            ) : diagrams.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {diagrams.map((diagram) => (
                  <Card key={diagram.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <CardTitle>{diagram.title}</CardTitle>
                      <CardDescription>
                        Created: {formatDate(diagram.createdAt)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm text-gray-600">
                      <p className="line-clamp-3">{diagram.description}</p>
                      <p className="mt-2 text-xs">
                        Entities: {diagram.entities.length} | Relationships: {diagram.relationships.length}
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Button
                        onClick={() => handleViewDiagram(diagram)}
                        className="w-full flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        View Diagram
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center p-8 text-gray-500">
                <p>No UML diagrams have been saved yet.</p>
                <Button onClick={() => navigate('/')} className="mt-4">
                  Create Your First Diagram
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default History;
