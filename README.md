# Stochastic Brownian Motion — Interactive Web App

An interactive React app that **simulates Brownian motion** and visualizes:

- **First-passage (barrier-hitting) probability** for drifted Brownian motion (Monte Carlo **vs.** closed-form via the reflection principle).
- **Lévy’s arcsine laws**: occupation time above zero, last zero-crossing time, and time of the maximum (empirical histograms overlaid with the arcsine density).

Built with **React**, **Tailwind CSS**, **Recharts**, and **lucide-react**.

---

## 🔗 Live Demo

- **Live demo:** https://adub3.github.io/brownian-motion-simulator/

> If you fork this repo, update the link above after you deploy (see **Deploy**).

---

## ✨ Features

- Real-time Monte Carlo simulations (Box–Muller Gaussian noise, Euler–Maruyama updates)
- Adjustable **drift (μ)**, **volatility (σ)**, **barrier (b)**, and **# paths**
- Arcsine-law histograms with the theoretical density overlay
- Light/Dark mode, glass UI, responsive layout
- “Theory” tab with concise explanations

---

## 🧩 Tech Stack

- **React** (functional components & hooks)
- **Recharts** for charts
- **Tailwind CSS** for styling
- **lucide-react** for icons
- Works great with **Vite** or **CRA**

---

## 📂 Project Structure (relevant)

brownian-motion-simulator/
├── src/
│   ├── App.js              # Renders the BrownianMotion UI
│   ├── App.css
│   ├── index.js            # React entry (creates root, renders <App />)
│   ├── index.css           # Global styles (Tailwind directives)
│   └── (components/*)      # Optional: your BrownianMotion component, etc.
├── public/
│   └── index.html          # HTML template (root div)
├── tailwind.config.js      # Tailwind setup
├── postcss.config.js       # PostCSS (Tailwind plugin)
├── package.json            # Scripts & deps
└── README.md               # Docs
