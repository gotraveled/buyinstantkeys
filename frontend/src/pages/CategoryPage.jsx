import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "@/lib/api";
import SEO from "@/components/SEO";
import ProductCard from "@/components/ProductCard";

const CATEGORY_INFO = {
  "norton-360": {
    title: "Norton 360 Products",
    description: "Buy Norton 360 Deluxe, Premium, Standard, and Advantage at up to 70% off. Complete device protection with VPN, password manager, and cloud backup.",
    keywords: "Norton 360 Deluxe with LifeLock, Norton 360 Premium, Norton 360 Deluxe, Norton 360 Standard, Norton 360 Advantage, Norton 360 deals, Norton 360 license key"
  },
  "lifelock": {
    title: "Norton with LifeLock Products",
    description: "Norton 360 with LifeLock identity theft protection. Choose from Select, Select Plus, Advantage, and Ultimate Plus plans with credit monitoring.",
    keywords: "Norton 360 Deluxe with LifeLock, Norton LifeLock Select, Norton LifeLock Ultimate Plus, identity theft protection, Norton LifeLock deals, LifeLock identity monitoring"
  },
  "vpn-privacy": {
    title: "VPN & Privacy Products",
    description: "Norton VPN, Norton AntiTrack, and privacy tools. Secure your online privacy with encrypted VPN connection and anti-tracking protection.",
    keywords: "Norton VPN, Norton Secure VPN, Norton AntiTrack, privacy protection, VPN software, encrypted VPN, online privacy tools"
  },
  "business": {
    title: "Business Security Products",
    description: "Norton Small Business and enterprise security solutions. Protect your business devices with cloud-managed security and threat protection.",
    keywords: "Norton Small Business, business antivirus, enterprise security, Norton for business, small business protection, business VPN"
  },
  "antivirus": {
    title: "Norton AntiVirus Products",
    description: "Classic Norton AntiVirus protection for PC and Mac. Essential malware protection, virus scanning, and threat removal.",
    keywords: "Norton AntiVirus, Norton virus protection, malware removal, antivirus software, Norton security, PC protection"
  },
  "identity": {
    title: "Identity Protection Products",
    description: "Norton Identity Advisor Plus and identity theft protection. Dark web monitoring, restoration assistance, and stolen wallet protection.",
    keywords: "Norton Identity Advisor Plus, identity theft protection, dark web monitoring, identity restoration, stolen wallet protection"
  },
  "utilities": {
    title: "Norton Utilities Products",
    description: "Norton Utilities Ultimate for PC optimization. Clean up, speed up, and optimize your computer performance.",
    keywords: "Norton Utilities Ultimate, PC optimization, computer cleanup, system utilities, PC speed up, Norton performance tools"
  },
  "family": {
    title: "Norton Family Products",
    description: "Norton Family parental control software. Monitor and protect your children online with screen time management and content filtering.",
    keywords: "Norton Family, parental control, child internet safety, screen time management, content filtering, family protection"
  },
  "gaming": {
    title: "Norton Gaming Products",
    description: "Norton 360 for Gamers. Game-optimized security that doesn't slow down your gaming experience with notification blocking.",
    keywords: "Norton 360 for Gamers, gaming antivirus, game security, gamer protection, Norton gaming edition, game optimization"
  },
  "mobile": {
    title: "Mobile Security Products",
    description: "Norton Mobile Security for iOS and Android. Protect your mobile devices from malware, phishing, and online threats.",
    keywords: "Norton Mobile Security, mobile antivirus, Android security, iOS security, phone protection, mobile threat protection"
  }
};

export default function CategoryPage() {
  const { category } = useParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const categoryInfo = CATEGORY_INFO[category] || {
    title: `${category} Products`,
    description: `Browse our ${category} collection of Norton security products.`,
    keywords: `${category}, Norton products, Norton license keys, security software`
  };

  useEffect(() => {
    setLoading(true);
    // Map URL-friendly category names to backend category names
    const categoryMap = {
      "norton-360": "Norton 360",
      "lifelock": "LifeLock",
      "vpn-privacy": "Privacy",
      "business": "Business",
      "antivirus": "AntiVirus",
      "identity": "Identity",
      "utilities": "Utilities",
      "family": "Family",
      "gaming": "Gaming",
      "mobile": "Mobile"
    };
    
    const backendCategory = categoryMap[category] || category;
    
    api.get("/products", { params: { category: backendCategory } })
      .then((r) => setProducts(r.data))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [category]);

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://buyinstantkeys.com"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Products",
        "item": "https://buyinstantkeys.com/products"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": categoryInfo.title,
        "item": `https://buyinstantkeys.com/category/${category}`
      }
    ]
  };

  return (
    <>
      <SEO
        title={categoryInfo.title}
        description={categoryInfo.description}
        keywords={categoryInfo.keywords}
        schema={[breadcrumbSchema]}
      />
      <div className="container-page py-14">
        <div className="mb-6 text-sm text-neutral-500">
          <Link to="/products" className="hover:text-neutral-900">Products</Link> / <span className="text-neutral-900">{categoryInfo.title}</span>
        </div>
        
        <div className="mb-8">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Category</div>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">{categoryInfo.title}</h1>
          <p className="mt-3 max-w-2xl text-neutral-600">{categoryInfo.description}</p>
        </div>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-80 animate-pulse rounded-xl bg-neutral-100" />
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-neutral-300 p-16 text-center text-neutral-600">
            No products found in this category. <Link to="/products" className="font-semibold underline">Browse all products</Link>
          </div>
        )}
      </div>
    </>
  );
}
