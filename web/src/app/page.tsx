import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight, Database, Lock, BarChart3, Layers, Shield, ExternalLink } from "lucide-react";

export default function Home() {
  const appLink = "https://app.suithetic.com";

  return (
    <div className="flex min-h-screen flex-col bg-[#fffdf3]">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Image
              src="/logo.svg"
              alt="Suithetic Logo"
              width={32}
              height={32}
              className="rounded-md"
            />
            <Link href="/" className="text-xl font-bold">
              Suithetic
            </Link>
          </div>
          <nav className="hidden md:flex gap-6">
            <Link href="#features" className="text-sm font-medium transition-colors hover:text-primary">
              Features
            </Link>
            <Link href="#how-it-works" className="text-sm font-medium transition-colors hover:text-primary">
              How It Works
            </Link>
            <Link href="#use-cases" className="text-sm font-medium transition-colors hover:text-primary">
              Use Cases
            </Link>
            <Link href="#marketplace" className="text-sm font-medium transition-colors hover:text-primary">
              Marketplace
            </Link>
          </nav>
          <div>
            <Button asChild className="bg-[#6750A4]">
              <Link href={appLink} className="flex items-center gap-1">
                Launch App <ExternalLink className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    Verified Structured Synthetic Data on SUI for Agentic AI Training
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    Suithetic generates structured, verifiable synthetic data using LLMs, securely
                    stores it on-chain, and provides a marketplace for high-quality datasets.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button size="lg" asChild className="bg-[#6750A4]">
                    <Link href={appLink}>
                      Launch App <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="outline" size="lg" asChild>
                    <Link href="#features">
                      Learn More <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="relative h-[350px] w-full overflow-hidden rounded-lg bg-muted">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#6750A4]/20 to-[#6750A4]/30 opacity-70"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative w-full h-full flex items-center justify-center">
                      {/* Central AI/LLM Node */}
                      <div className="absolute z-30 w-24 h-24 rounded-full bg-[#6750A4]/80 flex items-center justify-center border-2 border-[#6750A4] shadow-lg shadow-[#6750A4]/20">
                        <div className="text-white font-bold text-lg">LLM</div>
                      </div>

                      {/* Blockchain Layer */}
                      <div className="absolute w-64 h-64 rounded-full border-4 border-dashed border-[#6750A4]/40 animate-[spin_20s_linear_infinite]"></div>

                      {/* Data Nodes */}
                      {Array.from({ length: 8 }).map((_, i) => (
                        <div
                          key={i}
                          className="absolute w-12 h-12 rounded-lg bg-background/80 backdrop-blur-sm flex items-center justify-center shadow-md"
                          style={{
                            transform: `rotate(${i * 45}deg) translateX(120px) rotate(-${i * 45}deg)`,
                            animation: `pulse 3s infinite ease-in-out ${i * 0.2}s`,
                          }}
                        >
                          {i % 4 === 0 && <Database className="h-5 w-5 text-[#6750A4]" />}
                          {i % 4 === 1 && <Lock className="h-5 w-5 text-[#6750A4]" />}
                          {i % 4 === 2 && <BarChart3 className="h-5 w-5 text-[#6750A4]" />}
                          {i % 4 === 3 && <Layers className="h-5 w-5 text-[#6750A4]" />}
                        </div>
                      ))}

                      {/* Connection Lines */}
                      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 400">
                        <defs>
                          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#6750A4" stopOpacity="0.2" />
                            <stop offset="50%" stopColor="#6750A4" stopOpacity="0.6" />
                            <stop offset="100%" stopColor="#6750A4" stopOpacity="0.2" />
                          </linearGradient>
                        </defs>
                        {Array.from({ length: 8 }).map((_, i) => {
                          const angle = i * 45 * (Math.PI / 180)
                          const x = 200 + 120 * Math.cos(angle)
                          const y = 200 + 120 * Math.sin(angle)
                          return (
                            <line
                              key={i}
                              x1="200"
                              y1="200"
                              x2={x}
                              y2={y}
                              stroke="url(#lineGradient)"
                              strokeWidth="2"
                              strokeDasharray="5,5"
                              className="animate-pulse"
                            />
                          )
                        })}
                      </svg>

                      {/* Structured Data Visualization */}
                      <div className="absolute bottom-6 right-6 bg-background/80 backdrop-blur-sm p-3 rounded-lg border border-[#6750A4]/30">
                        <div className="text-xs font-mono text-[#6750A4]">
                          {"{"}
                          <br />
                          &nbsp;&nbsp;"structured": true,
                          <br />
                          &nbsp;&nbsp;"verified": true,
                          <br />
                          &nbsp;&nbsp;"source": "suithetic"
                          <br />
                          {"}"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">Core Features</div>
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
                  Revolutionizing Data Generation & Access
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Suithetic combines the power of LLMs with blockchain technology to create a new paradigm for data
                  generation and marketplace access.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-3 lg:gap-12">
              <div className="flex flex-col justify-center space-y-4 rounded-lg border p-6 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Layers className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">Structured Synthetic Data</h3>
                  <p className="text-muted-foreground">
                    Generate structured, verifiable synthetic data optimized for training next-gen agentic AI models and
                    tool-using applications.
                  </p>
                </div>
              </div>
              <div className="flex flex-col justify-center space-y-4 rounded-lg border p-6 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Database className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">On-Chain Storage</h3>
                  <p className="text-muted-foreground">
                    Securely store generated data on-chain using Walrus, ensuring immutability and transparency.
                  </p>
                </div>
              </div>
              <div className="flex flex-col justify-center space-y-4 rounded-lg border p-6 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">Encrypted Security</h3>
                  <p className="text-muted-foreground">
                    Protect the generated dataset with on-chain encryption using Seal, maintaining privacy while preserving
                    verifiability.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="w-full py-12 md:py-24 lg:py-32 bg-background">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-background px-3 py-1 text-sm">Technology</div>
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">How Suithetic Works</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Our innovative stack combines multiple blockchain technologies to create a seamless, secure data
                  ecosystem.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-2 lg:gap-12">
              <Image
                src="/placeholder.svg?height=400&width=500"
                width={500}
                height={400}
                alt="Suithetic Technology Stack"
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover object-center sm:w-full"
              />
              <div className="flex flex-col justify-center space-y-4">
                <ul className="grid gap-6">
                  <li>
                    <div className="grid gap-1">
                      <h3 className="text-xl font-bold">1. Structured Data Generation</h3>
                      <p className="text-muted-foreground">
                        Leverage Atoma Network to generate structured, verifiable synthetic data using state-of-the-art
                        LLMs directly on the SUI blockchain, optimized for agentic AI training.
                      </p>
                    </div>
                  </li>
                  <li>
                    <div className="grid gap-1">
                      <h3 className="text-xl font-bold">2. Secure Storage</h3>
                      <p className="text-muted-foreground">
                        Store generated data on-chain using Walrus, ensuring data integrity and permanent availability.
                      </p>
                    </div>
                  </li>
                  <li>
                    <div className="grid gap-1">
                      <h3 className="text-xl font-bold">3. Encryption</h3>
                      <p className="text-muted-foreground">
                        Protect the generated dataset with Seal's on-chain encryption, maintaining privacy while
                        preserving verifiability.
                      </p>
                    </div>
                  </li>
                  <li>
                    <div className="grid gap-1">
                      <h3 className="text-xl font-bold">4. Marketplace Access</h3>
                      <p className="text-muted-foreground">
                        Buy and sell access to verified datasets through our decentralized marketplace, creating a new
                        data economy.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section id="use-cases" className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">Applications</div>
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
                  Transforming Industries with Verified Data
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Discover how Suithetic is revolutionizing data usage across multiple sectors.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl gap-6 py-12 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  title: "Agentic AI Training",
                  description:
                    "Create structured synthetic data to train and improve next-generation agentic AI models and tool-using applications.",
                  icon: <Layers className="h-10 w-10 text-primary" />,
                },
                {
                  title: "Financial Services",
                  description: "Generate verified market data and financial models with complete audit trails.",
                  icon: <BarChart3 className="h-10 w-10 text-primary" />,
                },
                {
                  title: "Healthcare",
                  description: "Create synthetic patient data for research while maintaining privacy and compliance.",
                  icon: <Shield className="h-10 w-10 text-primary" />,
                },
                {
                  title: "Supply Chain",
                  description: "Track and verify product data across complex global supply networks.",
                  icon: <Layers className="h-10 w-10 text-primary" />,
                },
                {
                  title: "Research & Development",
                  description: "Access verified datasets to accelerate innovation and scientific discovery.",
                  icon: <Database className="h-10 w-10 text-primary" />,
                },
                {
                  title: "Media & Entertainment",
                  description: "Generate and verify content with clear provenance and attribution.",
                  icon: <ExternalLink className="h-10 w-10 text-primary" />,
                },
              ].map((useCase, index) => (
                <div
                  key={index}
                  className="flex flex-col items-center space-y-2 rounded-lg border p-6 text-center shadow-sm"
                >
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">{useCase.icon}</div>
                  <h3 className="text-xl font-bold">{useCase.title}</h3>
                  <p className="text-muted-foreground">{useCase.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="marketplace" className="w-full py-12 md:py-24 lg:py-32 bg-background">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">Marketplace</div>
                  <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl xl:text-5xl/none">
                    Access a World of Verified Datasets
                  </h2>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    Buy and sell access to high-quality, verifiable datasets through our decentralized marketplace
                    powered by SUI.
                  </p>
                </div>
                <ul className="grid gap-2">
                  <li className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
                      <ArrowRight className="h-4 w-4 text-primary" />
                    </div>
                    <span>Transparent pricing and access controls</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
                      <ArrowRight className="h-4 w-4 text-primary" />
                    </div>
                    <span>Verifiable data provenance and quality</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
                      <ArrowRight className="h-4 w-4 text-primary" />
                    </div>
                    <span>Secure, encrypted data transfer</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
                      <ArrowRight className="h-4 w-4 text-primary" />
                    </div>
                    <span>Monetize your own datasets</span>
                  </li>
                </ul>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button size="lg" asChild className="bg-[#6750A4]">
                    <Link href={appLink}>
                      Explore Marketplace <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="relative h-[400px] w-full overflow-hidden rounded-lg bg-muted">
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-purple-700/30 opacity-70"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Image
                      src="/placeholder.svg?height=300&width=400"
                      width={400}
                      height={300}
                      alt="Data Marketplace Visualization"
                      className="rounded-lg object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full border-t bg-muted py-6 md:py-12">
        <div className="container mx-auto flex flex-col items-center justify-center gap-4 px-4 md:px-6 md:flex-row md:justify-between">
          <div className="flex items-center gap-2">
            <Image
              src="/logo.svg"
              alt="Suithetic Logo"
              width={32}
              height={32}
              className="rounded-md"
            />
            <span className="text-lg font-bold">Suithetic</span>
          </div>
          <p className="text-center text-sm text-muted-foreground md:text-left">
            &copy; {new Date().getFullYear()} Suithetic. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
              Privacy Policy
            </Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
