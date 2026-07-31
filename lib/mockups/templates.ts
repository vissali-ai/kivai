export type MockupTemplate = { id: string; name: string; frame: "device" | "shirt" | "card" | "outdoor" | "frame" | "browser" | "post"; screen: { x: number; y: number; width: number; height: number }; asset?: string };

// A ferramenta lê apenas esta definição de assets. Para incluir um novo mockup,
// adicione um novo template com sua área de arte; a interface não precisa mudar.
export const mockupTemplates: MockupTemplate[] = [
  { id: "notebook", name: "Notebook", frame: "device", screen: { x: 421, y: 225, width: 761, height: 445 }, asset: "/mockups/laptop-studio-source.png" },
  { id: "desktop", name: "Desktop", frame: "device", screen: { x: 294, y: 142, width: 1011, height: 546 }, asset: "/mockups/desktop-studio-source.png" },
  { id: "smartphone", name: "Smartphone", frame: "device", screen: { x: 570, y: 100, width: 460, height: 800 } },
  { id: "tablet", name: "Tablet", frame: "device", screen: { x: 350, y: 150, width: 900, height: 650 } },
  { id: "camiseta", name: "Camiseta", frame: "shirt", screen: { x: 570, y: 310, width: 460, height: 420 } },
  { id: "cartao", name: "Cartão de visita", frame: "card", screen: { x: 340, y: 310, width: 920, height: 540 } },
  { id: "outdoor", name: "Outdoor", frame: "outdoor", screen: { x: 180, y: 180, width: 1240, height: 570 } },
  { id: "moldura", name: "Moldura", frame: "frame", screen: { x: 410, y: 130, width: 780, height: 760 } },
  { id: "browser", name: "Tela de navegador", frame: "browser", screen: { x: 170, y: 170, width: 1260, height: 700 } },
  { id: "instagram", name: "Post para Instagram", frame: "post", screen: { x: 420, y: 100, width: 760, height: 760 } },
];
