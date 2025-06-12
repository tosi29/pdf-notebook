import React from 'react'

function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-8">
          <div className="uppercase tracking-wide text-sm text-indigo-500 font-semibold">
            PDF Notebook
          </div>
          <h1 className="block mt-1 text-lg leading-tight font-medium text-black">
            React + Tailwind CSS
          </h1>
          <p className="mt-2 text-gray-500">
            最小限の構成でReactとTailwind CSSが正常に動作しています。
          </p>
          <div className="mt-4">
            <button className="bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded">
              ボタンテスト
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App