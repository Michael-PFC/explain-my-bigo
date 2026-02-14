export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <h1 className="text-4xl font-bold">Welcome to ExplainMyBigO!</h1>
      <p className="mt-4 text-lg text-gray-600">
        A simple AI-powered tool that estimates the time and space complexity (Big-O) of your code, highlights key assumptions, and gives a short, clear explanation.
      </p>
    </main>
  );
}