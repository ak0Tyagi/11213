import React, { useState } from 'react';

interface LoginScreenProps {
    onLogin: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        // Mock authentication delay
        setTimeout(() => {
            if (username.toLowerCase() === 'admin' && password === 'admin123') {
                onLogin();
            } else {
                setError('Invalid credentials. Please try again.');
                setIsLoading(false);
            }
        }, 800);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f8f5f0] to-[#e8dcc6] p-4">
            <div className="bg-white p-8 sm:p-12 rounded-2xl shadow-2xl w-full max-w-md border-t-8 border-[#8b4513]">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-bold text-[#8b4513] mb-2 tracking-wide">Heritage Grand</h1>
                    <p className="text-gray-500 italic">Event Management System</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#cd853f] focus:ring-2 focus:ring-[#cd853f]/20 outline-none transition-all"
                            placeholder="Enter username"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#cd853f] focus:ring-2 focus:ring-[#cd853f]/20 outline-none transition-all"
                            placeholder="••••••••"
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200 text-center font-bold">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full py-3.5 bg-gradient-to-r from-[#8b4513] to-[#d2691e] text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {isLoading ? 'Authenticating...' : 'Sign In'}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-xs text-gray-400">
                        Restricted Access. Authorized Personnel Only.<br/>
                        Default: admin / admin123
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginScreen;