
import React from 'react';
import { Activity } from "lucide-react";

const Navbar: React.FC = () => {
  return (
    <nav className="bg-[#a98467] text-white p-4 shadow-md">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Activity className="h-6 w-6" />
          <span className="text-xl font-semibold">UML Diagram Generator</span>
        </div>
        <div className="text-sm">
          Software Engineering Lab
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
