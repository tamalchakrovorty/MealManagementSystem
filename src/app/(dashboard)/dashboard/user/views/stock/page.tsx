import { redirect } from "next/navigation";
import Link from "next/link";
import { query, queryOne } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { getSelectedMembership } from "@/lib/server-utils";
import { StockAccessRequest } from "../stock-access-button";

const STOCK_IMAGES: Record<string, { img: string; bg: string }> = {
  chicken: { img: "https://images.unsplash.com/photo-1598515213692-5f0f9e5d3a8b?w=100&h=100&fit=crop", bg: "#f6dcdc" },
  "chicken breast": { img: "https://images.unsplash.com/photo-1604503468506-a8da13d82571?w=100&h=100&fit=crop", bg: "#f6dcdc" },
  "chicken leg": { img: "https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=100&h=100&fit=crop", bg: "#f6dcdc" },
  "chicken thigh": { img: "https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=100&h=100&fit=crop", bg: "#f6dcdc" },
  "chicken wing": { img: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=100&h=100&fit=crop", bg: "#f6dcdc" },
  beef: { img: "https://images.unsplash.com/photo-1603048297172-c92544798d5a?w=100&h=100&fit=crop", bg: "#f0dcd6" },
  "beef steak": { img: "https://images.unsplash.com/photo-1588168333986-5078d3ae3976?w=100&h=100&fit=crop", bg: "#f0dcd6" },
  mutton: { img: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=100&h=100&fit=crop", bg: "#f0dcd6" },
  goat: { img: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=100&h=100&fit=crop", bg: "#f0dcd6" },
  fish: { img: "https://images.unsplash.com/photo-1524704796725-9fc3044a58b2?w=100&h=100&fit=crop", bg: "#dbe7f2" },
  rohu: { img: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=100&h=100&fit=crop", bg: "#dbe7f2" },
  hilsa: { img: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=100&h=100&fit=crop", bg: "#dbe7f2" },
  ilish: { img: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=100&h=100&fit=crop", bg: "#dbe7f2" },
  shrimp: { img: "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=100&h=100&fit=crop", bg: "#fde2d8" },
  prawn: { img: "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=100&h=100&fit=crop", bg: "#fde2d8" },
  egg: { img: "https://images.unsplash.com/photo-1518569656558-1f25e69d93d7?w=100&h=100&fit=crop", bg: "#f0ede0" },
  vegetable: { img: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=100&h=100&fit=crop", bg: "#e2f0dc" },
  veggies: { img: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=100&h=100&fit=crop", bg: "#e2f0dc" },
  potato: { img: "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=100&h=100&fit=crop", bg: "#f5edd6" },
  onion: { img: "https://images.unsplash.com/photo-1618512496248-a07fe8396c31?w=100&h=100&fit=crop", bg: "#f5e6d6" },
  tomato: { img: "https://images.unsplash.com/photo-1546470427-0d4db154ceb8?w=100&h=100&fit=crop", bg: "#f8d6d6" },
  garlic: { img: "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=100&h=100&fit=crop", bg: "#f5f0e6" },
  ginger: { img: "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=100&h=100&fit=crop", bg: "#f5edd6" },
  chili: { img: "https://images.unsplash.com/photo-1583119022894-919a68a3d0e3?w=100&h=100&fit=crop", bg: "#f8d6d6" },
  "green chili": { img: "https://images.unsplash.com/photo-1583119022894-919a68a3d0e3?w=100&h=100&fit=crop", bg: "#e2f0dc" },
  "red chili": { img: "https://images.unsplash.com/photo-1583119022894-919a68a3d0e3?w=100&h=100&fit=crop", bg: "#f8d6d6" },
  rice: { img: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=100&h=100&fit=crop", bg: "#f5f0e0" },
  flour: { img: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=100&h=100&fit=crop", bg: "#f5f0e0" },
  atta: { img: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=100&h=100&fit=crop", bg: "#f5f0e0" },
  "wheat flour": { img: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=100&h=100&fit=crop", bg: "#f5f0e0" },
  lentil: { img: "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=100&h=100&fit=crop", bg: "#f0e6d0" },
  dal: { img: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=100&h=100&fit=crop", bg: "#f0e6d0" },
  oil: { img: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=100&h=100&fit=crop", bg: "#f5f0d0" },
  "cooking oil": { img: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=100&h=100&fit=crop", bg: "#f5f0d0" },
  "mustard oil": { img: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=100&h=100&fit=crop", bg: "#f5f0d0" },
  salt: { img: "https://images.unsplash.com/photo-1518110925495-5995a1e58839?w=100&h=100&fit=crop", bg: "#f0f0f0" },
  sugar: { img: "https://images.unsplash.com/photo-1587132137056-bfbf0166836e?w=100&h=100&fit=crop", bg: "#f5f0f0" },
  milk: { img: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=100&h=100&fit=crop", bg: "#eef3f8" },
  yogurt: { img: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=100&h=100&fit=crop", bg: "#f0f0f0" },
  cheese: { img: "https://images.unsplash.com/photo-1486297678162-eb2c1b50297e?w=100&h=100&fit=crop", bg: "#f5edd6" },
  butter: { img: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=100&h=100&fit=crop", bg: "#f5edd6" },
  bread: { img: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=100&h=100&fit=crop", bg: "#f5e6d0" },
  naan: { img: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=100&h=100&fit=crop", bg: "#f5e6d0" },
  pasta: { img: "https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=100&h=100&fit=crop", bg: "#f5edd6" },
  noodle: { img: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=100&h=100&fit=crop", bg: "#f5edd6" },
  noodles: { img: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=100&h=100&fit=crop", bg: "#f5edd6" },
  spice: { img: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=100&h=100&fit=crop", bg: "#f5e0c0" },
  spices: { img: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=100&h=100&fit=crop", bg: "#f5e0c0" },
  turmeric: { img: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=100&h=100&fit=crop", bg: "#f5e0c0" },
  cumin: { img: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=100&h=100&fit=crop", bg: "#f5e0c0" },
  "curry powder": { img: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=100&h=100&fit=crop", bg: "#f5e0c0" },
  "garam masala": { img: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=100&h=100&fit=crop", bg: "#f5e0c0" },
  coriander: { img: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=100&h=100&fit=crop", bg: "#e2f0dc" },
  "coriander powder": { img: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=100&h=100&fit=crop", bg: "#e2f0dc" },
  pepper: { img: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=100&h=100&fit=crop", bg: "#e8e0d8" },
  "black pepper": { img: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=100&h=100&fit=crop", bg: "#e8e0d8" },
  cinnamon: { img: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=100&h=100&fit=crop", bg: "#f0e0c8" },
  cardamom: { img: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=100&h=100&fit=crop", bg: "#e2f0dc" },
  clove: { img: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=100&h=100&fit=crop", bg: "#e8e0d8" },
  "bay leaf": { img: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=100&h=100&fit=crop", bg: "#e2f0dc" },
  "soy sauce": { img: "https://images.unsplash.com/photo-1472476443507-c7a5948772fc?w=100&h=100&fit=crop", bg: "#e8e0d0" },
  vinegar: { img: "https://images.unsplash.com/photo-1472476443507-c7a5948772fc?w=100&h=100&fit=crop", bg: "#f0ede8" },
  sauce: { img: "https://images.unsplash.com/photo-1472476443507-c7a5948772fc?w=100&h=100&fit=crop", bg: "#f8d6d6" },
  "tomato sauce": { img: "https://images.unsplash.com/photo-1472476443507-c7a5948772fc?w=100&h=100&fit=crop", bg: "#f8d6d6" },
  ketchup: { img: "https://images.unsplash.com/photo-1472476443507-c7a5948772fc?w=100&h=100&fit=crop", bg: "#f8d6d6" },
  frozen: { img: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=100&h=100&fit=crop", bg: "#dde8f2" },
  ice: { img: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=100&h=100&fit=crop", bg: "#dde8f2" },
  water: { img: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=100&h=100&fit=crop", bg: "#dde8f2" },
  fruit: { img: "https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?w=100&h=100&fit=crop", bg: "#fde8d8" },
  banana: { img: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=100&h=100&fit=crop", bg: "#f5edd6" },
  apple: { img: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=100&h=100&fit=crop", bg: "#f8d6d6" },
  orange: { img: "https://images.unsplash.com/photo-1547514701-42782101795e?w=100&h=100&fit=crop", bg: "#fde8d0" },
  lemon: { img: "https://images.unsplash.com/photo-1590502593747-42a996133562?w=100&h=100&fit=crop", bg: "#f5f0d0" },
  tofu: { img: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=100&h=100&fit=crop", bg: "#f5f0e0" },
  paneer: { img: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=100&h=100&fit=crop", bg: "#f5f0e0" },
  soya: { img: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=100&h=100&fit=crop", bg: "#f0e6d0" },
  mushroom: { img: "https://images.unsplash.com/photo-1504545102780-26774c1bb073?w=100&h=100&fit=crop", bg: "#f0ede8" },
  corn: { img: "https://images.unsplash.com/photo-1551754655-c32c9c9574d3?w=100&h=100&fit=crop", bg: "#f5f0d0" },
  pea: { img: "https://images.unsplash.com/photo-1587735243615-c03f25aaff15?w=100&h=100&fit=crop", bg: "#e2f0dc" },
  peas: { img: "https://images.unsplash.com/photo-1587735243615-c03f25aaff15?w=100&h=100&fit=crop", bg: "#e2f0dc" },
  carrot: { img: "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=100&h=100&fit=crop", bg: "#fde8d0" },
  cabbage: { img: "https://images.unsplash.com/photo-1594282486756-7e4b5c4e7f0e?w=100&h=100&fit=crop", bg: "#e2f0dc" },
  cauliflower: { img: "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=100&h=100&fit=crop", bg: "#f0ede8" },
  spinach: { img: "https://images.unsplash.com/photo-1576045057895-96a06a6b88a2?w=100&h=100&fit=crop", bg: "#e2f0dc" },
  palak: { img: "https://images.unsplash.com/photo-1576045057895-96a06a6b88a2?w=100&h=100&fit=crop", bg: "#e2f0dc" },
  broccoli: { img: "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=100&h=100&fit=crop", bg: "#e2f0dc" },
  pumpkin: { img: "https://images.unsplash.com/photo-1506917728035-bac13958d136?w=100&h=100&fit=crop", bg: "#fde8d0" },
  "bottle gourd": { img: "https://images.unsplash.com/photo-1506917728035-bac13958d136?w=100&h=100&fit=crop", bg: "#e2f0dc" },
  "bitter gourd": { img: "https://images.unsplash.com/photo-1506917728035-bac13958d136?w=100&h=100&fit=crop", bg: "#e2f0dc" },
  eggplant: { img: "https://images.unsplash.com/photo-1615484477778-ca3b77940c25?w=100&h=100&fit=crop", bg: "#e8dff0" },
  brinjal: { img: "https://images.unsplash.com/photo-1615484477778-ca3b77940c25?w=100&h=100&fit=crop", bg: "#e8dff0" },
  beans: { img: "https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?w=100&h=100&fit=crop", bg: "#e2f0dc" },
  cucumber: { img: "https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=100&h=100&fit=crop", bg: "#e2f0dc" },
  "sweet potato": { img: "https://images.unsplash.com/photo-1596097635121-14b63a7b70d0?w=100&h=100&fit=crop", bg: "#f5edd6" },
  "raw banana": { img: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=100&h=100&fit=crop", bg: "#e2f0dc" },
  jackfruit: { img: "https://images.unsplash.com/photo-1592681814168-6a652b3406d5?w=100&h=100&fit=crop", bg: "#f5edd6" },
  "coconut": { img: "https://images.unsplash.com/photo-1599940824399-b87987ce0795?w=100&h=100&fit=crop", bg: "#f5f0e0" },
  tamarind: { img: "https://images.unsplash.com/photo-1599940824399-b87987ce0795?w=100&h=100&fit=crop", bg: "#f0e0c8" },
  "dried fish": { img: "https://images.unsplash.com/photo-1524704796725-9fc3044a58b2?w=100&h=100&fit=crop", bg: "#dbe7f2" },
  "dried chili": { img: "https://images.unsplash.com/photo-1583119022894-919a68a3d0e3?w=100&h=100&fit=crop", bg: "#f8d6d6" },
  "bay leaves": { img: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=100&h=100&fit=crop", bg: "#e2f0dc" },
  default: { img: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=100&h=100&fit=crop", bg: "#eee" },
};

function getStockImage(itemName: string) {
  const lower = itemName.toLowerCase();
  for (const [key, val] of Object.entries(STOCK_IMAGES)) {
    if (lower.includes(key)) return val;
  }
  return STOCK_IMAGES.default;
}

function getStatus(qty: number, unit: string) {
  if (unit === "pcs") {
    if (qty >= 20) return { label: "Good", cls: "bg-[#d9f2e0] text-[#1fae70]" };
    if (qty >= 10) return { label: "Medium", cls: "bg-[#fbe9c9] text-[#d98a1c]" };
    return { label: "Low", cls: "bg-[#fadada] text-[#e5484d]" };
  }
  if (qty >= 3) return { label: "Good", cls: "bg-[#d9f2e0] text-[#1fae70]" };
  if (qty >= 1.5) return { label: "Medium", cls: "bg-[#fbe9c9] text-[#d98a1c]" };
  return { label: "Low", cls: "bg-[#fadada] text-[#e5484d]" };
}

export default async function StockViewPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const membership = await getSelectedMembership(user.id);
  if (!membership) redirect("/homepage");

  const messId = (membership as any).mess_id;

  const stockItems = await query(
    "SELECT * FROM freezer_stock WHERE mess_id = $1 ORDER BY item",
    [messId]
  );

  return (
    <div className="min-h-screen">
      <div className="max-w-lg md:max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 pt-5 pb-2">
          <Link
            href="/dashboard/user/views"
            className="w-[46px] h-[46px] min-w-[46px] bg-card rounded-[14px] flex items-center justify-center shadow-[0_2px_6px_rgba(30,30,60,0.06)]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-foreground">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <div>
            <h1 className="text-[22px] md:text-[28px] font-extrabold text-foreground leading-tight">Freezer Stock</h1>
            <p className="text-[13px] md:text-[15px] text-muted-foreground">Check available items</p>
          </div>
        </div>

        {/* Items Grid */}
        <div className="pt-3 pb-8 grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          {stockItems.length > 0 ? (
            stockItems.map((stock: any) => {
              const { img, bg } = getStockImage(stock.item);
              const status = getStatus(Number(stock.quantity), stock.unit);
              return (
                <div
                  key={stock.id}
                  className="bg-card rounded-[18px] p-4 flex items-center justify-between shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-border transition-all duration-300 md:hover:-translate-y-[2px] md:hover:shadow-[0_4px_16px_rgba(0,0,0,0.1)]"
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className="w-12 h-12 md:w-14 md:h-14 rounded-[14px] flex items-center justify-center shrink-0 overflow-hidden"
                      style={{ background: bg }}
                    >
                      <img src={img} alt={stock.item} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <div className="text-[14px] md:text-[15px] font-bold text-[#1a1a1a] mb-1">{stock.item}</div>
                      <div className="text-[12px] md:text-[13px] text-muted-foreground">{Number(stock.quantity).toFixed(2)} {stock.unit}</div>
                    </div>
                  </div>
                  <span className={`text-[11px] md:text-xs font-bold px-3.5 py-1.5 rounded-full ${status.cls}`}>
                    {status.label}
                  </span>
                </div>
              );
            })
          ) : (
            <div className="col-span-full bg-card rounded-[18px] p-8 md:p-10 shadow-[0_2px_8px_rgba(0,0,0,0.06)] text-center">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-muted-foreground">
                  <path d="M18 8C18 5.79 16.21 4 14 4C12.5 4 11.2 4.8 10.5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <rect x="3" y="8" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="2" />
                  <path d="M8 13H12M8 16H12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </div>
              <p className="text-[14px] md:text-[16px] text-muted-foreground">No stock items</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
