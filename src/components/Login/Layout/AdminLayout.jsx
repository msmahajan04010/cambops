import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Topbar';

export default function Layout({ children, title, subtitle }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-black flex">
      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <Header title={title} subtitle={subtitle} />

        {/* Content Area */}
        <div className="p-2">
          {children}
        </div>
      </main>
    </div>
  );
}