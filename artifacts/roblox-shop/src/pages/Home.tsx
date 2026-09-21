import { Link } from "wouter";
import { motion } from "framer-motion";
import { useState } from "react";
import {
  getGetDeltaInstallCountQueryKey,
  useGetDeltaInstallCount,
} from "@workspace/api-client-react";
import { SiVisa, SiMastercard, SiBitcoin } from "react-icons/si";
import { products } from "@/data/products";
import { ProductCard } from "@/components/ui/ProductCard";
import { ShieldCheck, Zap, Clock, HeadphonesIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const featuredProducts = products.slice(0, 6);
  const { toast } = useToast();
  const [showLauncher, setShowLauncher] = useState(true);
  const [showInstallPrompt, setShowInstallPrompt] = useState(true);
  const { data: deltaInstallData } = useGetDeltaInstallCount({
    query: {
      queryKey: getGetDeltaInstallCountQueryKey(),
      refetchInterval: 2000,
    },
  });

  const handleDeltaInstall = () => {
    const recorded = navigator.sendBeacon("/api/delta-install");

    if (!recorded) {
      void fetch("/api/delta-install", {
        method: "POST",
        keepalive: true,
      });
    }
  };

  const handleComingSoon = (sign: "E" | "K") => {
    toast({
      title: `${sign} SIGN`,
      description: `${sign} Sign is coming soon.`,
    });
  };

  if (showLauncher) {
    return (
      <div className="fixed inset-0 z-[100] flex min-h-screen items-center justify-center overflow-hidden bg-[#050d1a] px-5 text-center">
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage: `repeating-linear-gradient(rgba(255,122,0,0.08) 0 1px, transparent 1px 100%), repeating-linear-gradient(90deg, rgba(255,122,0,0.08) 0 1px, transparent 1px 100%)`,
            backgroundSize: "40px 40px",
          }}
        />
        <motion.div
          className="absolute left-1/2 top-1/2 h-[360px] w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[120px]"
          animate={{ scale: [1, 1.12, 1], opacity: [0.45, 0.7, 0.45] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="absolute right-4 top-4 z-10 text-right font-display text-[9px] font-bold uppercase leading-relaxed tracking-[0.16em] text-primary/80 sm:right-8 sm:top-6 sm:text-xs">
          <div>K SIGN IS COMING SOON</div>
          <div>E SIGN IS COMING SOON</div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.88, y: 18 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="relative z-10 w-full max-w-lg border border-primary/40 bg-black/65 p-6 shadow-[0_0_55px_rgba(255,122,0,0.16)] sm:p-10"
        >
          <div className="corner-tl" />
          <div className="corner-tr" />
          <div className="corner-bl" />
          <div className="corner-br" />
          <div className="font-display text-[10px] tracking-[0.32em] text-primary sm:text-xs">
            [ SELECT EXECUTOR ]
          </div>
          <h1 className="mt-5 font-display text-2xl font-black uppercase tracking-tight text-white sm:text-4xl">
            Choose Your Sign
          </h1>
          <p className="mt-3 font-sans text-sm text-muted-foreground sm:text-base">
            Select an available protocol to continue.
          </p>

          <div className="mt-8 grid gap-3">
            <motion.button
              type="button"
              onClick={() => handleComingSoon("E")}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full border border-primary/50 bg-primary/5 px-5 py-4 font-display text-sm font-bold uppercase tracking-[0.18em] text-primary transition-colors hover:bg-primary/15"
            >
              [ E SIGN SOON ]
            </motion.button>
            <motion.button
              type="button"
              onClick={() => handleComingSoon("K")}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full border border-primary/50 bg-primary/5 px-5 py-4 font-display text-sm font-bold uppercase tracking-[0.18em] text-primary transition-colors hover:bg-primary/15"
            >
              [ K SIGN SOON ]
            </motion.button>
            <motion.button
              type="button"
              onClick={() => setShowLauncher(false)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full border border-primary bg-primary px-5 py-4 font-display text-sm font-bold uppercase tracking-[0.18em] text-black transition-colors hover:bg-white"
            >
              [ DELTA EXECUTOR ]
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (showInstallPrompt) {
    return (
      <div className="fixed inset-0 z-[100] flex min-h-screen items-center justify-center overflow-hidden bg-[#050d1a] px-6 text-center">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `repeating-linear-gradient(rgba(255,122,0,0.08) 0 1px, transparent 1px 100%), repeating-linear-gradient(90deg, rgba(255,122,0,0.08) 0 1px, transparent 1px 100%)`,
            backgroundSize: "40px 40px",
          }}
        />
        <div className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[130px]" />
        <div className="absolute right-4 top-4 z-10 text-right font-display text-[9px] font-bold uppercase leading-relaxed tracking-[0.16em] text-primary/80 sm:right-8 sm:top-6 sm:text-xs">
          <div>K SIGN IS COMING SOON</div>
          <div>E SIGN IS COMING SOON</div>
        </div>

        <div className="relative z-10 w-full max-w-xl border border-primary/30 bg-black/50 p-8 shadow-[0_0_40px_rgba(255,122,0,0.12)] sm:p-12">
          <div className="mb-4 font-display text-xs tracking-[0.3em] text-primary">
            [ DELTA INSTALLATION PROTOCOL ]
          </div>
          <div className="mt-5 font-display text-sm font-bold uppercase tracking-[0.2em] text-primary">
            [ {deltaInstallData?.count ?? 0} PEOPLE PRESSED YES ]
          </div>
          <h1 className="mt-4 font-display text-3xl font-black uppercase tracking-tight text-white sm:text-5xl">
            Do You WAnt to Install Delta
          </h1>
          <p className="mt-5 font-sans text-base text-muted-foreground sm:text-lg">
            Choose an option to continue.
          </p>

          <div className="mt-9 flex flex-col justify-center gap-4 sm:flex-row">
            <a
              href="itms-services://?action=download-manifest&url=https://cocox.wtf/manifest.plist"
              onClick={handleDeltaInstall}
              className="w-full border border-primary bg-primary/10 px-8 py-4 font-display font-bold uppercase tracking-[0.2em] text-primary transition-all hover:bg-primary hover:text-black hover:shadow-[0_0_30px_rgba(255,122,0,0.6)] sm:w-auto"
            >
              [ YES ]
            </a>
            <button
              type="button"
              onClick={() => setShowInstallPrompt(false)}
              className="w-full border border-white/20 bg-transparent px-8 py-4 font-display font-bold uppercase tracking-[0.2em] text-white transition-colors hover:border-primary hover:text-primary sm:w-auto"
            >
              [ NO ]
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent flex flex-col w-full relative">
      {/* Particle field */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-primary rounded-full shadow-[0_0_5px_rgba(255,122,0,0.8)]"
            initial={{ 
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000), 
              y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1000),
              opacity: Math.random() * 0.5 + 0.1 
            }}
            animate={{ 
              y: [null, Math.random() * -200],
              opacity: [null, 0]
            }}
            transition={{ 
              duration: Math.random() * 10 + 10, 
              repeat: Infinity, 
              ease: "linear" 
            }}
          />
        ))}
      </div>

      {/* Hero Section */}
      <section className="relative pt-24 pb-32 px-4 overflow-hidden z-10">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px] pointer-events-none" />
        
        {/* Faint circuit board SVG pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 10 L90 10 L90 90 L10 90 Z' stroke='%23ff7a00' stroke-width='0.5' fill='none' /%3E%3Cpath d='M30 30 L70 30 L70 70 L30 70 Z' stroke='%23ff7a00' stroke-width='0.5' fill='none' /%3E%3C/svg%3E")`,
          backgroundSize: '100px 100px'
        }}></div>

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="font-display font-black text-white leading-none tracking-tighter" style={{ fontSize: "clamp(3rem, 8vw, 7rem)" }}>
              UNLOCK THE<br />
              <span className="text-primary drop-shadow-[0_0_30px_rgba(255,122,0,0.6)] glitch inline-block relative">
                IMPOSSIBLE
                <span className="absolute top-0 left-0 -ml-[2px] text-primary opacity-50 clip-half-1">IMPOSSIBLE</span>
                <span className="absolute top-0 left-0 ml-[2px] text-primary opacity-50 clip-half-2">IMPOSSIBLE</span>
              </span>
            </h1>
          </motion.div>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-sans"
          >
            {"> "} CocoX Scripts and Moza Scripts with fast delivery and responsive support.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/products" className="w-full sm:w-auto bg-primary/10 border border-primary text-primary hover:bg-primary hover:text-black font-display font-bold uppercase tracking-widest py-4 px-8 rounded-sm shadow-[0_0_20px_rgba(255,122,0,0.3)] hover:shadow-[0_0_30px_rgba(255,122,0,0.6)] transition-all flex justify-center items-center gap-2">
              [ START MISSION ]
            </Link>
            <button
              onClick={() => toast({ title: "CLIENT PORTAL", description: "Account access is not configured yet. You can continue as a guest from the catalog." })}
              className="w-full sm:w-auto bg-transparent border border-white/20 hover:border-primary text-white font-display font-bold uppercase tracking-widest py-4 px-8 rounded-sm transition-colors flex justify-center items-center gap-2"
            >
              [ CLIENT PORTAL ↗ ]
            </button>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm font-display tracking-widest text-muted-foreground uppercase"
          >
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 font-bold">[● SYS: ONLINE]</span>
            </div>
            <div className="hidden sm:block text-primary/30">|</div>
            <div className="flex items-center gap-1.5">
              <span className="text-primary">[★ 100K+ USERS]</span>
            </div>
            <div className="hidden sm:block text-primary/30">|</div>
            <div className="flex items-center gap-1.5">
              <span className="text-primary">[⚡ INSTANT DELIVERY]</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-10 flex flex-col items-center justify-center gap-3 opacity-50 grayscale hover:grayscale-0 transition-all duration-300"
          >
            <div className="text-xs font-display tracking-widest text-primary mb-2">[ PAYMENT PROTOCOLS ]</div>
            <div className="flex items-center gap-3">
              <div className="border border-white/10 bg-black p-2 rounded-sm"><SiVisa className="h-6 w-auto text-white" /></div>
              <div className="border border-white/10 bg-black p-2 rounded-sm"><SiMastercard className="h-6 w-auto text-white" /></div>
              <div className="border border-white/10 bg-black p-2 rounded-sm"><SiBitcoin className="h-6 w-auto text-white" /></div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-24 px-4 bg-black/40 border-t border-primary/20 relative z-20">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-10 border-b border-primary/20 pb-4 relative">
            <div className="absolute bottom-0 left-0 w-32 h-[1px] bg-primary drop-shadow-[0_0_5px_rgba(255,122,0,0.8)]"></div>
            <div>
              <h2 className="text-2xl md:text-3xl font-display font-bold text-white mb-2 uppercase tracking-wider">
                <span className="text-primary mr-2">//</span>FEATURED SYSTEMS
              </h2>
              <p className="text-muted-foreground font-sans">{">"} The optimal tools for execution.</p>
            </div>
            <Link href="/products" className="hidden sm:flex text-primary font-display text-sm tracking-widest hover:text-white transition-colors items-center gap-1">
              [ VIEW ALL ↗ ]
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          
          <div className="mt-8 sm:hidden">
            <Link href="/products" className="block w-full border border-primary/30 text-center py-3 rounded-sm text-primary font-display tracking-widest hover:bg-primary/10 transition-colors uppercase">
              [ VIEW ALL ]
            </Link>
          </div>
        </div>
      </section>

      {/* Trust & Stats */}
      <section className="py-24 px-4 relative z-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="relative bg-card border border-primary/20 p-8 rounded-none flex flex-col items-center text-center hover:border-primary/50 transition-colors group overflow-hidden">
              <div className="corner-tl"></div><div className="corner-tr"></div><div className="corner-bl"></div><div className="corner-br"></div>
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="w-12 h-12 border border-primary/30 bg-black text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform relative z-10 shadow-[0_0_15px_rgba(255,122,0,0.2)]">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div className="text-3xl font-display font-bold text-white mb-1 relative z-10">100K+</div>
              <div className="text-sm font-sans font-bold uppercase tracking-widest text-primary relative z-10">ACTIVE USERS</div>
            </div>
            
            <div className="relative bg-card border border-primary/20 p-8 rounded-none flex flex-col items-center text-center hover:border-primary/50 transition-colors group overflow-hidden">
              <div className="corner-tl"></div><div className="corner-tr"></div><div className="corner-bl"></div><div className="corner-br"></div>
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="w-12 h-12 border border-primary/30 bg-black text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform relative z-10 shadow-[0_0_15px_rgba(255,122,0,0.2)]">
                <Zap className="h-6 w-6" />
              </div>
              <div className="text-3xl font-display font-bold text-white mb-1 relative z-10">50+</div>
              <div className="text-sm font-sans font-bold uppercase tracking-widest text-primary relative z-10">SYSTEMS</div>
            </div>
            
            <div className="relative bg-card border border-primary/20 p-8 rounded-none flex flex-col items-center text-center hover:border-primary/50 transition-colors group overflow-hidden">
              <div className="corner-tl"></div><div className="corner-tr"></div><div className="corner-bl"></div><div className="corner-br"></div>
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="w-12 h-12 border border-primary/30 bg-black text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform relative z-10 shadow-[0_0_15px_rgba(255,122,0,0.2)]">
                <Clock className="h-6 w-6" />
              </div>
              <div className="text-3xl font-display font-bold text-white mb-1 relative z-10">INSTANT</div>
              <div className="text-sm font-sans font-bold uppercase tracking-widest text-primary relative z-10">DEPLOYMENT</div>
            </div>
            
            <div className="relative bg-card border border-primary/20 p-8 rounded-none flex flex-col items-center text-center hover:border-primary/50 transition-colors group overflow-hidden">
              <div className="corner-tl"></div><div className="corner-tr"></div><div className="corner-bl"></div><div className="corner-br"></div>
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="w-12 h-12 border border-primary/30 bg-black text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform relative z-10 shadow-[0_0_15px_rgba(255,122,0,0.2)]">
                <HeadphonesIcon className="h-6 w-6" />
              </div>
              <div className="text-3xl font-display font-bold text-white mb-1 relative z-10">24/7</div>
              <div className="text-sm font-sans font-bold uppercase tracking-widest text-primary relative z-10">SUPPORT COMM</div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
