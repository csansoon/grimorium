import { useState } from "react";

function App() {
    const [count, setCount] = useState(0);

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full mx-4">
                <h1 className="text-4xl font-bold text-gray-800 mb-6 text-center">
                    Grimoire
                </h1>
                <p className="text-gray-600 mb-6 text-center">
                    A Progressive Web App built with Vite, React, TypeScript,
                    and Tailwind CSS
                </p>

                <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg p-6 mb-6">
                    <p className="text-2xl font-semibold text-gray-700 text-center mb-4">
                        Count: {count}
                    </p>
                    <button
                        onClick={() => setCount((count) => count + 1)}
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 px-6 rounded-lg transition duration-300 transform hover:scale-105 active:scale-95"
                    >
                        Increment
                    </button>
                </div>

                <div className="space-y-3">
                    <a
                        href="https://vitejs.dev"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-center text-purple-600 hover:text-purple-800 font-medium transition duration-300"
                    >
                        Learn Vite
                    </a>
                    <a
                        href="https://react.dev"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-center text-purple-600 hover:text-purple-800 font-medium transition duration-300"
                    >
                        Learn React
                    </a>
                    <a
                        href="https://tailwindcss.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-center text-purple-600 hover:text-purple-800 font-medium transition duration-300"
                    >
                        Learn Tailwind CSS
                    </a>
                </div>
            </div>
        </div>
    );
}

export default App;
