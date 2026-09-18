import React from "react";

const MainLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
        {children}
      </div>
    </div>
  );
};

export default MainLayout;