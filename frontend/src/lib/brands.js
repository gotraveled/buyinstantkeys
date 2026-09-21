// Brand configuration for the 3 product lines.
// Each brand gets a white-majority page with a single accent color.
// No brand logos/wordmarks are used — only a generic shield + product name.

export const BRANDS = {
  norton: {
    slug: "norton",
    name: "Norton",
    // Yellow accent (Norton-inspired) — dark text reads best on it
    color: "#EAB308",
    colorDark: "#CA8A04",
    soft: "#FEF9C3",
    softAlt: "#FEFCE8",
    border: "#FDE047",
    textOn: "#1C1917", // dark text on yellow
    ring: "#EAB308",
    entity: "NortonLifeLock / Gen Digital Inc.",
    portalName: "my.norton.com",
    portalUrl: "https://my.norton.com",
    keyLabel: "Norton product key (25 characters)",
    keyPlaceholder: "XXXXX-XXXXX-XXXXX-XXXXX-XXXXX",
    keyHint: "Format: 25 alphanumeric characters, usually shown with dashes.",
    tagline: "Award-winning device security, VPN, and identity protection",
    heroTitle: "Norton Security Products",
    heroSub: "Genuine Norton license keys delivered to your email within minutes of checkout.",
    seoTitle: "Norton License Keys — Norton 360, AntiVirus & LifeLock",
    seoDesc: "Buy genuine Norton license keys. Norton 360 Deluxe, Premium, AntiVirus Plus & LifeLock with fast email delivery and a 30-day money-back guarantee.",
    seoKeywords: "Norton license key, Norton 360 Deluxe, Norton AntiVirus Plus, Norton 360 Premium, Norton LifeLock, buy Norton key, genuine Norton software",
    steps: [
      { title: "Sign in to your Norton account", desc: "Go to my.norton.com and sign in. Create a Norton account if you don't have one yet." },
      { title: "Enter your 25-character product key", desc: "On your Norton dashboard choose 'Enter a product key' and paste the key we emailed you." },
      { title: "Download and install Norton", desc: "Follow the on-screen prompts to download the Norton installer and complete setup on your device." },
      { title: "Run your first scan", desc: "Launch Norton and run a full scan — your subscription is now active and your device is protected." },
    ],
    about: [
      "Norton is one of the most recognized names in consumer cybersecurity, offering layered protection against viruses, malware, ransomware and online threats. Norton 360 plans add a Secure VPN, Password Manager, Dark Web Monitoring and cloud backup on top of core antivirus.",
      "When you buy a Norton license key from BuyInstantKeys, you receive a genuine activation code by email — usually within 5–15 minutes. Enter it at my.norton.com to register the subscription to your own Norton account and download the software directly from Norton.",
    ],
    faqs: [
      { q: "How do I activate my Norton key?", a: "Sign in at my.norton.com, choose 'Enter a product key', paste your 25-character key, then download and install Norton on your device." },
      { q: "Is this a genuine Norton license?", a: "Yes. Every key we sell is a genuine activation code that registers directly to your own Norton account." },
      { q: "How many devices can I protect?", a: "It depends on the plan — Norton AntiVirus Plus covers 1 PC, Norton 360 Deluxe covers up to 5, and Premium covers up to 10." },
      { q: "What if my key doesn't work?", a: "Contact us and we'll verify it or issue a replacement — covered by our 30-day money-back guarantee." },
    ],
  },

  webroot: {
    slug: "webroot",
    name: "Webroot",
    // Green accent (Webroot-inspired) — white text reads best on it
    color: "#16A34A",
    colorDark: "#15803D",
    soft: "#DCFCE7",
    softAlt: "#F0FDF4",
    border: "#86EFAC",
    textOn: "#FFFFFF",
    ring: "#16A34A",
    entity: "OpenText / Webroot Inc.",
    portalName: "webroot.com/safe",
    portalUrl: "https://www.webroot.com/safe",
    keyLabel: "Webroot keycode (20 characters)",
    keyPlaceholder: "XXXX-XXXX-XXXX-XXXX-XXXX",
    keyHint: "Format: 20-character keycode found in your delivery email.",
    tagline: "Lightning-fast, cloud-based security that never slows you down",
    heroTitle: "Webroot Security Products",
    heroSub: "Genuine Webroot license keys delivered to your email within minutes of checkout.",
    seoTitle: "Webroot License Keys — Internet Security & AntiVirus",
    seoDesc: "Buy genuine Webroot license keys. Webroot Internet Security Complete, Plus & AntiVirus with fast email delivery and a 30-day money-back guarantee.",
    seoKeywords: "Webroot license key, Webroot Internet Security Complete, Webroot AntiVirus, Webroot keycode, buy Webroot key, genuine Webroot software",
    steps: [
      { title: "Go to the Webroot install page", desc: "Visit webroot.com/safe on the device you want to protect, or sign in at my.webrootanywhere.com." },
      { title: "Enter your 20-character keycode", desc: "Type or paste the Webroot keycode we emailed you when prompted during setup." },
      { title: "Download and install Webroot", desc: "Run the small Webroot installer — it downloads in seconds and installs with minimal system impact." },
      { title: "Let Webroot scan and protect", desc: "Webroot runs an initial scan automatically and then protects you in real time from the cloud." },
    ],
    about: [
      "Webroot is a cloud-based security platform known for being extremely lightweight — scans complete in seconds and the software uses a fraction of the system resources of traditional antivirus. It protects against viruses, malware, ransomware, phishing and identity theft.",
      "When you buy a Webroot license key from BuyInstantKeys, you receive a genuine 20-character keycode by email — usually within 5–15 minutes. Enter it at webroot.com/safe or your Webroot account to activate and download the software directly from Webroot.",
    ],
    faqs: [
      { q: "How do I activate my Webroot keycode?", a: "Go to webroot.com/safe, enter your 20-character keycode, then download and run the installer. Activation takes just a couple of minutes." },
      { q: "Is this a genuine Webroot license?", a: "Yes. Every keycode we sell is a genuine activation code that registers directly with Webroot." },
      { q: "Does Webroot slow down my PC?", a: "No — Webroot is famous for being one of the lightest antivirus products available, with cloud-based scanning that uses minimal resources." },
      { q: "What if my keycode doesn't work?", a: "Contact us and we'll verify it or issue a replacement — covered by our 30-day money-back guarantee." },
    ],
  },

  mcafee: {
    slug: "mcafee",
    name: "McAfee",
    // Red accent (McAfee-inspired) — white text reads best on it
    color: "#DC2626",
    colorDark: "#B91C1C",
    soft: "#FEE2E2",
    softAlt: "#FEF2F2",
    border: "#FCA5A5",
    textOn: "#FFFFFF",
    ring: "#DC2626",
    entity: "McAfee LLC",
    portalName: "mcafee.com/activate",
    portalUrl: "https://www.mcafee.com/activate",
    keyLabel: "McAfee activation code (25 characters)",
    keyPlaceholder: "XXXXX-XXXXX-XXXXX-XXXXX-XXXXX",
    keyHint: "Format: 25-character activation code from your delivery email.",
    tagline: "All-in-one protection for every device you own",
    heroTitle: "McAfee Security Products",
    heroSub: "Genuine McAfee license keys delivered to your email within minutes of checkout.",
    seoTitle: "McAfee License Keys — Total Protection & McAfee+",
    seoDesc: "Buy genuine McAfee license keys. McAfee Total Protection, McAfee+ Premium & AntiVirus with fast email delivery and a 30-day money-back guarantee.",
    seoKeywords: "McAfee license key, McAfee Total Protection, McAfee+ Premium, McAfee AntiVirus, McAfee activation code, buy McAfee key, genuine McAfee software",
    steps: [
      { title: "Go to the McAfee activation page", desc: "Visit mcafee.com/activate or sign in to your account at home.mcafee.com." },
      { title: "Enter your 25-character activation code", desc: "Paste the McAfee activation code we emailed you and sign in or create a McAfee account." },
      { title: "Download and install McAfee", desc: "Follow the prompts to download the McAfee installer and complete setup on your device." },
      { title: "Run protection and stay covered", desc: "McAfee activates your subscription and begins protecting your device in real time." },
    ],
    about: [
      "McAfee is a long-standing leader in consumer security, offering all-in-one protection that combines antivirus, a Secure VPN, identity monitoring, a password manager and privacy tools across PCs, Macs and mobile devices.",
      "When you buy a McAfee license key from BuyInstantKeys, you receive a genuine 25-character activation code by email — usually within 5–15 minutes. Enter it at mcafee.com/activate to register the subscription to your own McAfee account and download the software directly from McAfee.",
    ],
    faqs: [
      { q: "How do I activate my McAfee code?", a: "Go to mcafee.com/activate, enter your 25-character code, sign in or create a McAfee account, then download and install." },
      { q: "Is this a genuine McAfee license?", a: "Yes. Every code we sell is a genuine activation code that registers directly to your own McAfee account." },
      { q: "How many devices can I protect?", a: "It depends on the plan — McAfee AntiVirus covers 1 PC, while McAfee+ Premium and LiveSafe cover unlimited devices." },
      { q: "What if my code doesn't work?", a: "Contact us and we'll verify it or issue a replacement — covered by our 30-day money-back guarantee." },
    ],
  },
};

export const BRAND_LIST = [BRANDS.norton, BRANDS.webroot, BRANDS.mcafee];

export function getBrand(slug) {
  return BRANDS[slug] || null;
}
