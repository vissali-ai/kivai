import { Link2, Type, MessageCircle, Phone, Mail, Wifi } from "lucide-react";

export type TipoQrCode =
  | "url"
  | "texto"
  | "whatsapp"
  | "telefone"
  | "email"
  | "wifi";

export type NivelCorrecao = "L" | "M" | "Q" | "H";

export type ModeloVisual = "padrao" | "topo" | "lateral" | "marca" | "selo";

export type ModeloQrCode = {
  id: ModeloVisual;
  titulo: string;
  descricao: string;
};

export type TipoConfig = {
  valor: TipoQrCode;
  titulo: string;
  descricao: string;
  icone: typeof Link2;
};

export const TIPOS: TipoConfig[] = [
  {
    valor: "url",
    titulo: "URL",
    descricao: "Sites e páginas",
    icone: Link2,
  },
  {
    valor: "texto",
    titulo: "Texto",
    descricao: "Mensagens e informações",
    icone: Type,
  },
  {
    valor: "whatsapp",
    titulo: "WhatsApp",
    descricao: "Conversas diretas",
    icone: MessageCircle,
  },
  {
    valor: "telefone",
    titulo: "Telefone",
    descricao: "Chamadas rápidas",
    icone: Phone,
  },
  {
    valor: "email",
    titulo: "E-mail",
    descricao: "Mensagens por e-mail",
    icone: Mail,
  },
  {
    valor: "wifi",
    titulo: "Wi-Fi",
    descricao: "Acesso à rede",
    icone: Wifi,
  },
];

export const NIVEIS_CORRECAO: Array<{
  valor: NivelCorrecao;
  titulo: string;
  descricao: string;
}> = [
  {
    valor: "L",
    titulo: "Baixa",
    descricao: "QR Code mais simples e compacto.",
  },
  {
    valor: "M",
    titulo: "Média",
    descricao: "Equilíbrio recomendado para uso geral.",
  },
  {
    valor: "Q",
    titulo: "Alta",
    descricao: "Maior resistência a pequenas perdas.",
  },
  {
    valor: "H",
    titulo: "Máxima",
    descricao: "Maior tolerância a danos e interferências.",
  },
];

export const MODELOS_QR_CODE: ModeloQrCode[] = [
  {
    id: "padrao",
    titulo: "Padrão",
    descricao: "Somente o QR Code, sem elementos adicionais.",
  },
  {
    id: "topo",
    titulo: "Chamada superior",
    descricao: "Título destacado acima do código para cartazes e vitrines.",
  },
  {
    id: "lateral",
    titulo: "Etiqueta lateral",
    descricao: "QR Code e chamada lado a lado para embalagens e balcões.",
  },
  {
    id: "marca",
    titulo: "Cartão de marca",
    descricao: "Inclui nome, logo e chamada em uma peça completa.",
  },
  {
    id: "selo",
    titulo: "Selo promocional",
    descricao: "Moldura marcante com chamada inferior para campanhas.",
  },
];
