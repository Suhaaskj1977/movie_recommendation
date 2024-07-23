import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import MovieRecommendations from './components/MovieRecommendations'; // Import MovieRecommendations
import { useState } from 'react';

function App() {
  return (
    <Router>
      <div className="App">
        <main className="p-4">
          <Routes>
            
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/recommendations" element={<MovieRecommendations />} /> 
          </Routes>
        </main>
      </div>
    </Router>
  );
}



export default App;
