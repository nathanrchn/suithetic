import Link from "next/link";
import Title from "@/components/title";

export default function Home() {
  const appLink = "https://app.suithetic.com";

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight"><Link href="/">Suithetic</Link></h1>
          </div>
          <Link 
            href={appLink} 
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            Launch App
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <section className="w-full flex items-center min-h-[calc(100vh-4rem)]">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <Title />
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    Secure, private, and efficient synthetic data generation for all your needs.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link 
                    href={appLink} 
                    className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    Get Started
                  </Link>
                  <Link 
                    href="#learn-more" 
                    className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-8 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    Learn More
                  </Link>
                </div>
              </div>
              <div className="hidden lg:block">
                {(() => {
                  // Dimensions and perspective settings
                  const blockWidth = 200; // Increased width
                  const blockHeight = 40;  // Increased height (proportionally)
                  const isoAngle = 30;     // Isometric angle in degrees
                  const isoSkewY = Math.tan(isoAngle * Math.PI / 180);
                  const perspectiveDepth = blockWidth * 0.5 * isoSkewY;
                  const spacing = 20;     // Increased vertical spacing
                  const strokeWidth = 2;
                  const paddingRight = -60; // Negative padding to push it further right (partially off-screen)
                  const paddingTop = 20;   // Padding from the top edge

                  // Calculate base Y positions for each block (bottom starts lowest)
                  const yBase3 = (blockHeight + spacing) * 2;
                  const yBase2 = blockHeight + spacing;
                  const yBase1 = 0;

                  // Calculate total size (needed for positioning)
                  const totalHeight = (blockHeight + spacing) * 2 + blockHeight + perspectiveDepth;
                  const totalWidth = blockWidth + (blockWidth * 0.5); // Approximation for iso width

                  // Position near top-right
                  const translateX = 300 - totalWidth - paddingRight;
                  const translateY = paddingTop;

                  // Helper function to create points string for polygons
                  const points = (coords: [number, number][]): string => coords.map((p: [number, number]) => `${p[0]},${p[1]}`).join(' ');

                  // Block definitions (points calculated relative to block's top-left corner)
                  const createBlock = (yBase: number, topColor: string, sideColor: string) => {
                    // Top face points (Rhombus)
                    const topPoints = points([
                      [0, yBase + blockHeight],
                      [blockWidth * 0.5, yBase + blockHeight - perspectiveDepth],
                      [blockWidth, yBase + blockHeight],
                      [blockWidth * 0.5, yBase + blockHeight + perspectiveDepth]
                    ]);
                    // Left side face points (Parallelogram)
                    const leftSidePoints = points([
                      [0, yBase + blockHeight],
                      [blockWidth * 0.5, yBase + blockHeight + perspectiveDepth],
                      [blockWidth * 0.5, yBase + blockHeight * 2 + perspectiveDepth],
                      [0, yBase + blockHeight * 2]
                    ]);
                     // Right side face points (Parallelogram)
                    const rightSidePoints = points([
                      [blockWidth, yBase + blockHeight],
                      [blockWidth * 0.5, yBase + blockHeight + perspectiveDepth],
                      [blockWidth * 0.5, yBase + blockHeight * 2 + perspectiveDepth],
                      [blockWidth, yBase + blockHeight * 2]
                    ]);

                    return (
                      <g key={yBase}>
                        <polygon points={leftSidePoints} fill={sideColor} stroke="black" strokeWidth={strokeWidth} />
                        <polygon points={rightSidePoints} fill={sideColor} stroke="black" strokeWidth={strokeWidth} />
                        <polygon points={topPoints} fill={topColor} stroke="black" strokeWidth={strokeWidth} />
                      </g>
                    );
                  };

                  return (
                    <svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto rounded-lg">
                      <g transform={`translate(${translateX}, ${translateY})`}>
                        {createBlock(yBase3, '#ffcdd2' /* Light Red/Coral */, '#ef5350' /* Darker Red/Coral */)}
                        {createBlock(yBase2, '#b3e5fc' /* Light Blue */, '#4fc3f7' /* Darker Blue */)}
                        {createBlock(yBase1, '#e0cffc' /* Light Lavender */, '#b39ddb' /* Darker Lavender */)}
                      </g>
                    </svg>
                  );
                })()}
              </div>
            </div>
          </div>
        </section>

        <section id="learn-more" className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto flex max-w-[58rem] flex-col items-center justify-center gap-4 text-center">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Powered by State-of-the-Art Technologies
              </h2>
              <p className="max-w-[85%] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Suithetic combines the best technologies for secure, efficient synthetic data generation
              </p>
            </div>
            <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:grid-cols-3 lg:gap-8 mt-8">
              <div className="flex flex-col items-center justify-center space-y-2 p-4 rounded-lg border bg-card">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"></path><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"></path><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"></path></svg>
                </div>
                <h3 className="text-xl font-bold">SUI Blockchain</h3>
                <p className="text-center text-muted-foreground">
                  Built on the fast and scalable SUI blockchain for secure transactions
                </p>
              </div>
              <div className="flex flex-col items-center justify-center space-y-2 p-4 rounded-lg border bg-card">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="m12 8-9.04 9.06a2.82 2.82 0 1 0 3.98 3.98L16 12"></path><circle cx="17" cy="7" r="5"></circle></svg>
                </div>
                <h3 className="text-xl font-bold">Atoma Network</h3>
                <p className="text-center text-muted-foreground">
                  Advanced LLM generation capabilities for high-quality synthetic data
                </p>
              </div>
              <div className="flex flex-col items-center justify-center space-y-2 p-4 rounded-lg border bg-card">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"></rect><path d="M12 6v4"></path><line x1="9" x2="15" y1="12" y2="12"></line></svg>
                </div>
                <h3 className="text-xl font-bold">Walrus Storage</h3>
                <p className="text-center text-muted-foreground">
                  Reliable and efficient storage solutions for your synthetic data
                </p>
              </div>
              <div className="flex flex-col items-center justify-center space-y-2 p-4 rounded-lg border bg-card">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                </div>
                <h3 className="text-xl font-bold">Seal Encryption</h3>
                <p className="text-center text-muted-foreground">
                  Industry-leading encryption to keep your data secure and private
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-[58rem] flex flex-col items-center justify-center gap-4 text-center">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Ready to generate synthetic data?
              </h2>
              <p className="max-w-[85%] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Start using Suithetic today and transform your data workflow
              </p>
              <Link
                href={appLink}
                className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-8 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                Launch App
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full border-t py-6 md:py-0">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Suithetic. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
              Terms
            </Link>
            <Link href="/privacy" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
