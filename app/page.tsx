import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center px-4">
        <h1 className="text-5xl font-bold mb-4 text-gray-900">
          AI Video & Image Generator
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Powered by Volcengine AI
        </p>
        <div className="space-x-4">
          <Link
            href="/generate"
            className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
          >
            Start Generating
          </Link>
          <Link
            href="/pricing"
            className="inline-block bg-white hover:bg-gray-50 text-gray-800 font-semibold py-3 px-8 rounded-lg border border-gray-300 transition-colors"
          >
            Pricing
          </Link>
        </div>

        <div id="features" className="mt-16 max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-3xl mb-4">🎨</div>
              <h3 className="text-xl font-semibold mb-2">Image Generation</h3>
              <p className="text-gray-600">
                Create stunning images with AI using Seed 2.0 technology
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-3xl mb-4">🎬</div>
              <h3 className="text-xl font-semibold mb-2">Video Generation</h3>
              <p className="text-gray-600">
                Coming soon: Generate videos with Seedance 2.0
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-3xl mb-4">💳</div>
              <h3 className="text-xl font-semibold mb-2">Credit System</h3>
              <p className="text-gray-600">
                Pay as you go with our flexible credit packages
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
