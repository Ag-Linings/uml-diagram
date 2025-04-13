
import React from 'react';
import Navbar from '@/components/Navbar';
import UMLGenerator from '@/components/UMLGenerator';
import Footer from '@/components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1">
        <UMLGenerator />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
