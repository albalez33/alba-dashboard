export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-block w-14 h-14 rounded-2xl bg-gradient-to-tr from-accent to-accent2 mb-4" />
          <h1 className="text-2xl font-semibold tracking-tight">Alba Lez · Analytics</h1>
          <p className="text-sm text-zinc-500 mt-1">Dashboard privado de Instagram</p>
        </div>
        <form
          method="POST"
          action="/api/login"
          className="bg-card border border-cardBorder rounded-2xl p-6 space-y-4"
        >
          <label className="block text-sm text-zinc-400">
            Contraseña
            <input
              type="password"
              name="password"
              autoFocus
              required
              className="mt-2 w-full rounded-xl bg-bg border border-cardBorder px-4 py-3 text-white outline-none focus:border-accent transition-colors"
            />
          </label>
          {searchParams.error && (
            <p className="text-sm text-rose-400">Contraseña incorrecta.</p>
          )}
          <button
            type="submit"
            className="w-full rounded-xl bg-gradient-to-r from-accent to-accent2 py-3 font-medium text-white hover:opacity-90 transition-opacity"
          >
            Entrar
          </button>
        </form>
      </div>
    </main>
  );
}
