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
        <nav className="bg-gray-800 p-4">
          <ul className="flex space-x-4 text-white">
            <li>
              <Link to="/" className="hover:underline">Home</Link>
            </li>
            <li>
              <Link to="/login" className="hover:underline">Login</Link>
            </li>
            <li>
              <Link to="/register" className="hover:underline">Register</Link>
            </li>
            <li>
              <Link to="/recommendations" className="hover:underline">Movie Recommendations</Link>
            </li>
          </ul>
        </nav>

        <main className="p-4">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/recommendations" element={<MovieRecommendations />} /> {/* Added route */}
          </Routes>
        </main>
      </div>
    </Router>
  );
}

function Home() {
  return <h2 className="text-2xl font-bold">Welcome to the Movie Recommendation Site</h2>;
}

export default App;
