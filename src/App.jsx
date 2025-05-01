import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Login from './Login';
import Signup from './Signup';
import Home from './Home';
import AddProduct from './AddProducts';
import ManageProducts from './Products';
import Orders from './Orders';
import Profile from './Profile';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  useEffect(() => {
    // Check if user is logged in by looking for token in localStorage
    const token = localStorage.getItem('authToken');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  // Protected route component
  const ProtectedRoute = ({ children }) => {
    if (!isAuthenticated) {
      // Redirect to auth page if not logged in
      return <Navigate to="/auth" />;
    }
    return children;
  };

  // Auth route component (redirects to home if already logged in)
  const AuthRoute = ({ children }) => {
    if (isAuthenticated) {
      // Redirect to home page if already logged in
      return <Navigate to="/" />;
    }
    return children;
  };

  return (
    <Router>
      <Routes>
        {/* Auth routes */}
        <Route path="/auth" element={
          <AuthRoute>
            <Login setIsAuthenticated={setIsAuthenticated} />
          </AuthRoute>
        } />
        <Route path="/signup" element={
          <AuthRoute>
            <Signup setIsAuthenticated={setIsAuthenticated} />
          </AuthRoute>
        } />
        
        {/* Protected routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        } />
        <Route path="/add-product" element={
          <ProtectedRoute>
            <AddProduct />
          </ProtectedRoute>
        } />
        <Route path="/products" element={
          <ProtectedRoute>
            <ManageProducts />
          </ProtectedRoute>
        } />
        <Route path="/orders" element={
          <ProtectedRoute>
            <Orders />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        
        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/auth"} />} />
      </Routes>
    </Router>
  );
}

export default App;