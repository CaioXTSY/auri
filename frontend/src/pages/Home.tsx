export const Home = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl">
          AURI
        </h1>
        <p className="mt-4 text-lg text-slate-600">
          Plataforma Gamificada de Ensino de Programação
        </p>
        <div className="mt-8">
          <button className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
            Começar
          </button>
        </div>
      </div>
    </div>
  );
};
