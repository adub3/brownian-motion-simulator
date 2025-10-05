import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ComposedChart, Bar } from 'recharts';
import { Play, RefreshCw, Info, Moon, Sun, Settings, X } from 'lucide-react';

const BrownianMotion = () => {
  const [activeTab, setActiveTab] = useState('passage');
  const [darkMode, setDarkMode] = useState(true);
  const [showControls, setShowControls] = useState(false);
  
  const [mu, setMu] = useState(0.05);
  const [sigma, setSigma] = useState(1.0);
  const [barrier, setBarrier] = useState(2.0);
  const [fpPaths, setFpPaths] = useState(1000);
  const [fpSimulating, setFpSimulating] = useState(false);
  const [fpResults, setFpResults] = useState(null);
  
  const [arcPaths, setArcPaths] = useState(5000);
  const [arcSimulating, setArcSimulating] = useState(false);
  const [arcResults, setArcResults] = useState(null);

  useEffect(() => {
    simulateFirstPassage();
    simulateArcsineLaws();
  }, []);

  const randn = () => {
    const u1 = Math.random();
    const u2 = Math.random();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  };

  const normcdf = (x) => {
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp(-x * x / 2);
    const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return x > 0 ? 1 - prob : prob;
  };

  const simulateFirstPassage = () => {
    setFpSimulating(true);
    setTimeout(() => {
      const T = 10;
      const dt = 0.01;
      const steps = Math.floor(T / dt);
      let hitCount = 0;
      const samplePaths = [];
      const numSamplePaths = Math.min(10, fpPaths);
      
      for (let p = 0; p < fpPaths; p++) {
        let x = 0;
        let hit = false;
        const path = p < numSamplePaths ? [{ t: 0, x: 0 }] : null;
        
        for (let i = 1; i <= steps; i++) {
          const dW = Math.sqrt(dt) * randn();
          x += mu * dt + sigma * dW;
          
          if (path) path.push({ t: i * dt, x });
          
          if (x >= barrier && !hit) {
            hit = true;
            hitCount++;
            break;
          }
        }
        
        if (path) samplePaths.push({ path, hit });
      }
      
      const empirical = hitCount / fpPaths;
      const drift_term = mu * T;
      const vol_term = sigma * Math.sqrt(T);
      const d1 = (barrier - drift_term) / vol_term;
      const d2 = (-barrier - drift_term) / vol_term;
      const theoretical = 1 - normcdf(d1) + Math.exp(2 * mu * barrier / (sigma * sigma)) * normcdf(d2);
      
      setFpResults({ empirical, theoretical, samplePaths, T, hitCount });
      setFpSimulating(false);
    }, 100);
  };

  const simulateArcsineLaws = () => {
    setArcSimulating(true);
    setTimeout(() => {
      const T = 1;
      const dt = 0.001;
      const steps = Math.floor(T / dt);
      
      const fractionAbove = [];
      const lastZero = [];
      const timeOfMax = [];
      
      for (let p = 0; p < arcPaths; p++) {
        let x = 0;
        let timeAbove = 0;
        let lastZeroTime = 0;
        let maxVal = 0;
        let maxTime = 0;
        
        for (let i = 1; i <= steps; i++) {
          const prevX = x;
          x += Math.sqrt(dt) * randn();
          
          if (x > 0) timeAbove += dt;
          if (prevX * x <= 0) lastZeroTime = i * dt;
          
          if (x > maxVal) {
            maxVal = x;
            maxTime = i * dt;
          }
        }
        
        fractionAbove.push(timeAbove / T);
        lastZero.push(lastZeroTime / T);
        timeOfMax.push(maxTime / T);
      }
      
      setArcResults({ fractionAbove, lastZero, timeOfMax });
      setArcSimulating(false);
    }, 100);
  };

  const arcsineDensity = (x) => {
    if (x <= 0 || x >= 1) return 0;
    return 1 / (Math.PI * Math.sqrt(x * (1 - x)));
  };

  const createHistogramData = (values, numBins = 40) => {
    const bins = Array(numBins).fill(0).map((_, i) => ({
      x: (i + 0.5) / numBins,
      empirical: 0,
      theoretical: 0
    }));
    
    values.forEach(v => {
      const idx = Math.floor(v * numBins);
      if (idx >= 0 && idx < numBins) bins[idx].empirical++;
    });
    
    const binWidth = 1 / numBins;
    bins.forEach(bin => {
      bin.empirical = bin.empirical / (values.length * binWidth);
      bin.theoretical = arcsineDensity(bin.x);
    });
    
    return bins;
  };

  const theme = darkMode ? {
    bg: 'bg-black',
    glass: 'bg-white/[0.03] backdrop-blur-2xl border border-white/[0.05]',
    text: 'text-slate-100',
    textMuted: 'text-slate-400',
    accent: 'from-violet-500 to-fuchsia-500',
    chartGrid: '#ffffff10',
    chartAxis: '#ffffff40'
  } : {
    bg: 'bg-gradient-to-br from-slate-100 via-white to-slate-50',
    glass: 'bg-white/40 backdrop-blur-2xl border border-slate-200/50',
    text: 'text-slate-800',
    textMuted: 'text-slate-500',
    accent: 'from-indigo-500 to-purple-500',
    chartGrid: '#00000008',
    chartAxis: '#00000030'
  };

  if (!fpResults || !arcResults) {
    return (
      <div className={`w-full min-h-screen ${theme.bg} flex items-center justify-center`}>
        <div className="text-center">
          <RefreshCw className="animate-spin text-violet-500 mx-auto mb-4" size={48} />
          <p className={theme.text}>Running simulations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full min-h-screen ${theme.bg} transition-all duration-500 p-8`}>
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-4xl font-light tracking-tight ${theme.text} mb-2`}>
              Stochastic Brownian Motion
            </h1>
            <p className={`text-sm ${theme.textMuted} font-mono`}>
              First-passage time analysis · Lévy's arcsine laws
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowControls(!showControls)}
              className={`${theme.glass} p-3 rounded-2xl hover:bg-white/10 transition-all ${theme.text}`}
            >
              {showControls ? <X size={20} /> : <Settings size={20} />}
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`${theme.glass} p-3 rounded-2xl hover:bg-white/10 transition-all`}
            >
              {darkMode ? <Sun className="text-amber-400" size={20} /> : <Moon className="text-indigo-600" size={20} />}
            </button>
          </div>
        </div>
      </div>

      {showControls && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-8" onClick={() => setShowControls(false)}>
          <div className={`${theme.glass} rounded-3xl p-8 max-w-2xl w-full ${theme.text}`} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-light">Controls</h2>
              <button onClick={() => setShowControls(false)} className="p-2 hover:bg-white/10 rounded-xl transition">
                <X size={20} />
              </button>
            </div>
            
            {activeTab === 'passage' ? (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className={`block text-xs font-mono uppercase tracking-wider ${theme.textMuted} mb-2`}>
                      Drift: <span className={theme.text}>{mu.toFixed(3)}</span>
                    </label>
                    <input
                      type="range" min="-0.2" max="0.2" step="0.01" value={mu}
                      onChange={(e) => setMu(parseFloat(e.target.value))}
                      className="w-full" disabled={fpSimulating}
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-xs font-mono uppercase tracking-wider ${theme.textMuted} mb-2`}>
                      Volatility: <span className={theme.text}>{sigma.toFixed(2)}</span>
                    </label>
                    <input
                      type="range" min="0.5" max="2.0" step="0.1" value={sigma}
                      onChange={(e) => setSigma(parseFloat(e.target.value))}
                      className="w-full" disabled={fpSimulating}
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-xs font-mono uppercase tracking-wider ${theme.textMuted} mb-2`}>
                      Barrier: <span className={theme.text}>{barrier.toFixed(2)}</span>
                    </label>
                    <input
                      type="range" min="0.5" max="5.0" step="0.1" value={barrier}
                      onChange={(e) => setBarrier(parseFloat(e.target.value))}
                      className="w-full" disabled={fpSimulating}
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-xs font-mono uppercase tracking-wider ${theme.textMuted} mb-2`}>
                      Paths: <span className={theme.text}>{fpPaths}</span>
                    </label>
                    <input
                      type="range" min="100" max="5000" step="100" value={fpPaths}
                      onChange={(e) => setFpPaths(parseInt(e.target.value))}
                      className="w-full" disabled={fpSimulating}
                    />
                  </div>
                </div>

                <button
                  onClick={() => { simulateFirstPassage(); setShowControls(false); }}
                  disabled={fpSimulating}
                  className={`w-full bg-gradient-to-r ${theme.accent} text-white px-6 py-3 rounded-2xl hover:shadow-lg hover:scale-[1.02] transition-all font-medium disabled:opacity-50 flex items-center justify-center gap-2`}
                >
                  {fpSimulating ? <RefreshCw className="animate-spin" size={20} /> : <Play size={20} />}
                  {fpSimulating ? 'Simulating...' : 'Run Simulation'}
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <label className={`block text-xs font-mono uppercase tracking-wider ${theme.textMuted} mb-2`}>
                    Sample size: <span className={theme.text}>{arcPaths}</span>
                  </label>
                  <input
                    type="range" min="1000" max="10000" step="500" value={arcPaths}
                    onChange={(e) => setArcPaths(parseInt(e.target.value))}
                    className="w-full" disabled={arcSimulating}
                  />
                </div>

                <button
                  onClick={() => { simulateArcsineLaws(); setShowControls(false); }}
                  disabled={arcSimulating}
                  className={`w-full bg-gradient-to-r ${theme.accent} text-white px-6 py-3 rounded-2xl hover:shadow-lg hover:scale-[1.02] transition-all font-medium disabled:opacity-50 flex items-center justify-center gap-2`}
                >
                  {arcSimulating ? <RefreshCw className="animate-spin" size={20} /> : <Play size={20} />}
                  {arcSimulating ? 'Simulating...' : 'Run Simulation'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <div className={`${theme.glass} rounded-3xl p-2 mb-6 inline-flex`}>
          <button
            onClick={() => setActiveTab('passage')}
            className={`px-8 py-3 rounded-2xl font-medium transition-all ${
              activeTab === 'passage'
                ? `bg-gradient-to-r ${theme.accent} text-white shadow-lg`
                : `${theme.text} hover:bg-white/5`
            }`}
          >
            First-Passage
          </button>
          <button
            onClick={() => setActiveTab('arcsine')}
            className={`px-8 py-3 rounded-2xl font-medium transition-all ${
              activeTab === 'arcsine'
                ? `bg-gradient-to-r ${theme.accent} text-white shadow-lg`
                : `${theme.text} hover:bg-white/5`
            }`}
          >
            Arcsine Laws
          </button>
          <button
            onClick={() => setActiveTab('theory')}
            className={`px-8 py-3 rounded-2xl font-medium transition-all ${
              activeTab === 'theory'
                ? `bg-gradient-to-r ${theme.accent} text-white shadow-lg`
                : `${theme.text} hover:bg-white/5`
            }`}
          >
            Theory
          </button>
        </div>

        {activeTab === 'passage' && (
          <div className="space-y-6">
            <div className="mb-8">
              <h3 className={`text-2xl font-light ${theme.text} mb-2`}>Sample Path Realizations</h3>
              <LineChart width={1000} height={400} margin={{ top: 20, right: 40, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.chartGrid} />
                <XAxis dataKey="t" type="number" domain={[0, fpResults.T]} stroke={theme.chartAxis} />
                <YAxis stroke={theme.chartAxis} />
                <Tooltip contentStyle={{ background: darkMode ? '#1e293b' : '#ffffff', border: 'none', borderRadius: '12px' }} />
                <Line data={[{ t: 0, b: barrier }, { t: fpResults.T, b: barrier }]} type="monotone" dataKey="b" stroke="#ef4444" strokeWidth={3} strokeDasharray="5 5" dot={false} />
                {fpResults.samplePaths.map((pathData, idx) => (
                  <Line key={idx} data={pathData.path} type="monotone" dataKey="x" stroke={pathData.hit ? '#ef4444' : '#3b82f6'} strokeWidth={2} dot={false} opacity={0.6} />
                ))}
              </LineChart>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className={`${theme.glass} p-8 rounded-3xl`}>
                <div className={`text-xs uppercase tracking-wider font-mono ${theme.textMuted} mb-3`}>Empirical</div>
                <div className="text-5xl font-light bg-gradient-to-r from-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
                  {(fpResults.empirical * 100).toFixed(2)}%
                </div>
                <div className={`text-xs font-mono ${theme.textMuted} mt-3`}>
                  {fpResults.hitCount}/{fpPaths} paths
                </div>
              </div>
              <div className={`${theme.glass} p-8 rounded-3xl`}>
                <div className={`text-xs uppercase tracking-wider font-mono ${theme.textMuted} mb-3`}>Theoretical</div>
                <div className="text-5xl font-light bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                  {(fpResults.theoretical * 100).toFixed(2)}%
                </div>
                <div className={`text-xs font-mono ${theme.textMuted} mt-3`}>
                  Error: {Math.abs(fpResults.empirical - fpResults.theoretical).toFixed(4)}
                </div>
              </div>
            </div>

            <div className={`${theme.glass} p-8 rounded-3xl`}>
              <div className="flex items-start gap-4">
                <Info className="text-violet-500 mt-1 flex-shrink-0" size={24} />
                <div>
                  <h4 className={`font-medium ${theme.text} mb-2`}>Reflection Principle</h4>
                  <p className={`text-sm ${theme.textMuted} leading-relaxed`}>
                    The probability of reaching barrier b before time T is computed using the reflection principle, comparing Monte Carlo estimates against the analytical formula.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'arcsine' && (
          <div className="space-y-6">
            <div>
              <h3 className={`text-xl font-light ${theme.text} mb-4`}>Occupation Time Above Zero</h3>
              <ComposedChart width={1000} height={350} data={createHistogramData(arcResults.fractionAbove)} margin={{ top: 20, right: 40, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.chartGrid} />
                <XAxis dataKey="x" stroke={theme.chartAxis} />
                <YAxis stroke={theme.chartAxis} />
                <Tooltip contentStyle={{ background: darkMode ? '#1e293b' : '#ffffff', border: 'none', borderRadius: '12px' }} />
                <Bar dataKey="empirical" fill="#8b5cf6" opacity={0.7} />
                <Line type="monotone" dataKey="theoretical" stroke="#ef4444" strokeWidth={3} dot={false} />
              </ComposedChart>
            </div>

            <div>
              <h3 className={`text-xl font-light ${theme.text} mb-4`}>Last Zero-Crossing Time</h3>
              <ComposedChart width={1000} height={350} data={createHistogramData(arcResults.lastZero)} margin={{ top: 20, right: 40, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.chartGrid} />
                <XAxis dataKey="x" stroke={theme.chartAxis} />
                <YAxis stroke={theme.chartAxis} />
                <Tooltip contentStyle={{ background: darkMode ? '#1e293b' : '#ffffff', border: 'none', borderRadius: '12px' }} />
                <Bar dataKey="empirical" fill="#06b6d4" opacity={0.7} />
                <Line type="monotone" dataKey="theoretical" stroke="#ef4444" strokeWidth={3} dot={false} />
              </ComposedChart>
            </div>

            <div>
              <h3 className={`text-xl font-light ${theme.text} mb-4`}>Maximum Achievement Time</h3>
              <ComposedChart width={1000} height={350} data={createHistogramData(arcResults.timeOfMax)} margin={{ top: 20, right: 40, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.chartGrid} />
                <XAxis dataKey="x" stroke={theme.chartAxis} />
                <YAxis stroke={theme.chartAxis} />
                <Tooltip contentStyle={{ background: darkMode ? '#1e293b' : '#ffffff', border: 'none', borderRadius: '12px' }} />
                <Bar dataKey="empirical" fill="#10b981" opacity={0.7} />
                <Line type="monotone" dataKey="theoretical" stroke="#ef4444" strokeWidth={3} dot={false} />
              </ComposedChart>
            </div>

            <div className={`${theme.glass} p-8 rounded-3xl`}>
              <div className="flex items-start gap-4">
                <Info className="text-purple-500 mt-1 flex-shrink-0" size={24} />
                <div>
                  <h4 className={`font-medium ${theme.text} mb-2`}>Levy Arcsine Laws</h4>
                  <p className={`text-sm ${theme.textMuted} leading-relaxed mb-3`}>
                    Paul Levy proved that three fundamental quantities share the arcsine distribution. The empirical histograms validate these laws through Monte Carlo simulation.
                  </p>
                  <p className={`text-sm ${theme.textMuted} leading-relaxed`}>
                    <strong className={theme.text}>Why This Matters:</strong> Understanding these phenomena is crucial in quantitative finance, statistical physics, and mathematical statistics.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'theory' && (
          <div className={`${theme.glass} p-12 rounded-3xl max-w-5xl mx-auto`}>
            <h2 className={`text-3xl font-light ${theme.text} mb-8`}>Understanding Brownian Motion Through Simulation</h2>
            
            <div className={`${theme.text} space-y-8 text-base leading-relaxed`}>
              <section>
                <h3 className="text-2xl font-light mb-4">What is Brownian Motion?</h3>
                <p className={theme.textMuted}>
                  Brownian motion describes the random wandering of particles suspended in a fluid, first observed by botanist Robert Brown in 1827 while studying pollen grains in water. Mathematically, it represents the continuous limit of a random walk—imagine flipping a coin infinitely fast, taking infinitesimally small steps left or right.
                </p>
                <p className={`${theme.textMuted} mt-4`}>
                  The process is characterized by the stochastic differential equation:
                </p>
                <div className="my-6 p-6 bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 rounded-xl border border-violet-500/20">
                  <p className={`${theme.text} text-xl font-mono text-center`}>
                    dX<sub>t</sub> = μ dt + σ dW<sub>t</sub>
                  </p>
                  <p className={`${theme.textMuted} text-sm text-center mt-3`}>
                    where μ is the drift (systematic trend), σ is volatility (randomness intensity), and W<sub>t</sub> is the Wiener process
                  </p>
                </div>
                <p className={theme.textMuted}>
                  Think of drift as a river current carrying you downstream, while volatility represents the choppy waves buffeting you randomly. Together, they determine whether you'll reach a particular destination and when.
                </p>
              </section>

              <section>
                <h3 className="text-2xl font-light mb-4">The First-Passage Time Problem</h3>
                <p className={theme.textMuted}>
                  Imagine standing at a riverbank, watching a leaf floating on the water. How long until it reaches the opposite shore? This is the essence of first-passage time—the moment a random process first crosses a threshold.
                </p>
                <p className={`${theme.textMuted} mt-4`}>
                  The reflection principle, discovered by Désiré André in 1887, gives us an elegant formula:
                </p>
                <div className="my-6 p-6 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-xl border border-indigo-500/20">
                  <p className={`${theme.text} font-mono text-center mb-2`}>
                    P(reaching barrier b before time T)
                  </p>
                  <p className={`${theme.text} text-lg font-mono text-center`}>
                    = Φ(−d₁) + exp(2μb/σ²) Φ(d₂)
                  </p>
                </div>
                <p className={theme.textMuted}>
                  This formula tells us the probability that our wandering particle hits the barrier. The exponential term captures a surprising symmetry: paths that cross the barrier can be "reflected" back, creating a bijection that lets us count them precisely. Our simulator validates this theoretical prediction by actually running thousands of paths and comparing the empirical hit rate.
                </p>
              </section>

              <section>
                <h3 className="text-2xl font-light mb-4">Lévy's Arcsine Laws: The Counterintuitive Heart of Randomness</h3>
                <p className={theme.textMuted}>
                  Paul Lévy discovered in 1939 that Brownian motion has a bizarre temporal structure. Most people expect a random walk to spend about half its time above zero—after all, it should be "balanced." But reality is far stranger.
                </p>
                <p className={`${theme.textMuted} mt-4`}>
                  The arcsine distribution has the form:
                </p>
                <div className="my-6 p-6 bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 rounded-xl border border-cyan-500/20">
                  <p className={`${theme.text} text-xl font-mono text-center`}>
                    f(x) = 1 / (π √(x(1−x)))
                  </p>
                  <p className={`${theme.textMuted} text-sm text-center mt-3`}>
                    defined on the interval [0,1]
                  </p>
                </div>
                <p className={theme.textMuted}>
                  This U-shaped density has a shocking implication: Brownian motion tends to spend most of its time either predominantly positive or predominantly negative, with very little time near 50-50. If you flip a coin for an hour, you're more likely to see heads winning for 55 minutes than for 30 minutes!
                </p>
                <p className={`${theme.textMuted} mt-4`}>
                  Three fundamental quantities follow this law:
                </p>
                <ul className={`${theme.textMuted} mt-3 space-y-2 ml-6`}>
                  <li><strong className={theme.text}>Occupation time:</strong> The fraction of time spent above zero clusters near 0 or 1, not 0.5</li>
                  <li><strong className={theme.text}>Last zero crossing:</strong> The final time the process visits zero tends to occur very early or very late</li>
                  <li><strong className={theme.text}>Time of maximum:</strong> The process typically achieves its maximum value near the beginning or end, rarely in the middle</li>
                </ul>
                <p className={`${theme.textMuted} mt-4`}>
                  This isn't just mathematical curiosity—it has profound implications. In financial markets, it means bull and bear markets last longer than expected. In physics, it explains why diffusing particles exhibit memory-like behavior. Our simulator demonstrates these laws empirically: run it and watch the histograms match the theoretical U-shaped curve.
                </p>
              </section>

              <section>
                <h3 className="text-2xl font-light mb-4">How the Simulation Works</h3>
                <p className={theme.textMuted}>
                  We implement the Euler-Maruyama method, which discretizes continuous-time stochastic processes into manageable computational steps:
                </p>
                <ol className={`${theme.textMuted} mt-4 space-y-3 ml-6 list-decimal`}>
                  <li><strong className={theme.text}>Generate random shocks:</strong> Use the Box-Muller transform to create Gaussian random variables from uniform noise</li>
                  <li><strong className={theme.text}>Evolve the process:</strong> At each tiny time step dt, update position by adding μ·dt (drift) plus σ·√dt·Z (random shock)</li>
                  <li><strong className={theme.text}>Monte Carlo aggregation:</strong> Simulate thousands of independent paths and compute empirical statistics</li>
                  <li><strong className={theme.text}>Compare theory vs. reality:</strong> Plot the results against analytical predictions</li>
                </ol>
                <p className={`${theme.textMuted} mt-4`}>
                  Monte Carlo methods converge slowly—cutting error in half requires 4× more samples—but they're remarkably robust and applicable to problems where exact solutions don't exist.
                </p>
              </section>

              <section>
                <h3 className="text-2xl font-light mb-4">Why This Matters: Real-World Applications</h3>
                
                <p className={`${theme.textMuted} mb-4`}>
                  <strong className={theme.text}>Quantitative Finance:</strong> Options traders pay billions for barrier derivatives whose values depend on first-passage times. A "knock-out" option becomes worthless if the stock price hits a barrier—pricing this requires understanding the probability distributions we simulate here. The arcsine laws reveal that markets exhibit persistence: bull markets last longer than intuition suggests, changing how portfolio managers rebalance positions.
                </p>
                
                <p className={`${theme.textMuted} mb-4`}>
                  <strong className={theme.text}>Statistical Physics:</strong> Brownian motion was Einstein's 1905 proof that atoms exist. The same mathematics describes how molecules diffuse through cell membranes, how polymers fold, and how phase transitions occur. First-passage times determine chemical reaction rates—how long until molecules collide and react.
                </p>
                
                <p className={`${theme.textMuted} mb-4`}>
                  <strong className={theme.text}>Neuroscience:</strong> Neurons fire when their voltage crosses a threshold—a first-passage time problem. Understanding the statistics of spike timing helps decode neural signals and design brain-computer interfaces. The randomness isn't noise; it's computational substrate.
                </p>
                
                <p className={`${theme.textMuted} mb-4`}>
                  <strong className={theme.text}>Machine Learning:</strong> Modern generative models like diffusion models (which create images from noise) are built on stochastic differential equations. Score-based generative modeling reverses Brownian motion to transform random noise into structured data. Understanding these dynamics is essential for training stable models.
                </p>
              </section>

              <section>
                <h3 className="text-2xl font-light mb-4">The Beauty of Interactive Mathematics</h3>
                <p className={theme.textMuted}>
                  Stochastic processes are notoriously counterintuitive. Equations on a blackboard can't convey the visceral surprise of watching thousands of random paths exhibit precisely the U-shaped distribution Lévy predicted. By adjusting parameters and immediately seeing results, you build intuition that would take months of theoretical study.
                </p>
                <p className={`${theme.textMuted} mt-4`}>
                  This simulator democratizes access to computational mathematics. A century ago, verifying these results required years of hand calculations. Fifty years ago, it needed expensive mainframes. Today, your browser can run sophisticated Monte Carlo simulations in real time, making cutting-edge probability theory accessible to anyone curious enough to explore.
                </p>
                <p className={`${theme.textMuted} mt-4`}>
                  Mathematics isn't just abstract symbols—it's a lens for understanding reality. Brownian motion governs phenomena from stock markets to molecule diffusion to neural firing. By simulating these processes, we don't just verify theory; we develop geometric intuition about randomness itself.
                </p>
              </section>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BrownianMotion;