import {useState} from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {Scale} from 'lucide-react';
import api from '../services/api';

const Login = () => {
    const [email,setEmail] = useState('');
    const [password,setPassword] = useState('');
    const [error,setError] = useState('');
    const [isLoading,setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) =>{
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try{
            const res = await api.post('/auth/login', {email,password});
            // Save the 15-minute access token
            localStorage.setItem('accessToken',res.data.accessToken);  
            
            navigate('/dashboard');
        } catch(err){
          setError(err.response?.data?.message || err.response?.data?.error || 'Login failed. Please try again.');
        } finally{
            setIsLoading(false);
        }
    }
    return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg border border-slate-100">
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-blue-50 rounded-full mb-4">
            <Scale className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Legal AI Workspace</h1>
          <p className="text-sm text-slate-500 mt-2">Sign in to access your research assistant</p>
        </div>

        {error && (
          <div className="p-3 mb-6 text-sm text-red-700 bg-red-50 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="lawyer@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-70"
          >
            {isLoading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-600 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-700">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;