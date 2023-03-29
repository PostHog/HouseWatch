import React from 'react';
import './App.css';
import Sidebar from './Sidebar';
import ThemeCustomization from './themes'

function App() {
  return (
    <ThemeCustomization>
      <div className="App">
        <Sidebar />
      </div>
    </ThemeCustomization>
  );
}

export default App;
