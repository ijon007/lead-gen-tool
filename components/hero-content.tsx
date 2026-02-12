export default function HeroContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-dvh w-full overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "url(https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=2560&q=95&auto=format)",
        }}
      />
      <div className="absolute inset-0" aria-hidden />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, oklch(0.51 0.23 277 / 0.35) 0%, oklch(0.51 0.23 277 / 0.5) 100%)",
        }}
      />
      <div className="relative z-10 flex min-h-dvh flex-col items-center justify-center px-6">
        <div className="mx-auto w-full max-w-xl text-center">
          <p className="mb-5 text-xs font-medium uppercase tracking-[0.2em] text-primary-foreground/80">
            AI-Powered Lead Discovery
          </p>
          <h1 className="mb-6 text-4xl font-semibold tracking-tight text-primary-foreground sm:text-5xl sm:leading-[1.1]">
            Find the right leads.
            <br />
            <span className="text-white">Scale your pipeline.</span>
          </h1>
          <p className="mb-10 text-base leading-relaxed text-primary-foreground/90 sm:text-lg">
            Search by category and location. Export to CSV. Manage your
            leads—effortlessly.
          </p>
          {children}
        </div>
      </div>
    </div>
  );
}
