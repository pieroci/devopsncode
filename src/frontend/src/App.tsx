import { useEffect } from 'react';
import { AppRouter } from './router';
import { useAuthStore } from './store/authStore';
import './App.css';

function App() {
  const { loadFromStorage } = useAuthStore();

  useEffect(() => {
    // Load auth state from localStorage on app start
    loadFromStorage();
  }, [loadFromStorage]);

  return <AppRouter />;
}

export default App;
