export type TextToolEditorialSlug = "contador-de-palavras";

export type TextToolEditorialContent = {
  overview: string[];
  useCases: { title: string; description: string }[];
  steps: string[];
  specifications: { label: string; value: string }[];
  privacy: string;
  limitations: string[];
  faqs: { question: string; answer: string }[];
  related: { href: string; label: string }[];
};

export const textToolEditorialContent: Record<TextToolEditorialSlug, TextToolEditorialContent> = {
  "contador-de-palavras": {
    overview: [
      "O Contador de Palavras e Caracteres analisa o texto digitado ou colado e atualiza as métricas em tempo real. Além da quantidade de palavras, a ferramenta mostra caracteres com e sem espaços, frases, parágrafos, linhas e estimativas de leitura e fala.",
      "A página também oferece referências de limite para usos comuns, como meta title, meta description, Instagram, X, Google Ads e YouTube, além de destacar palavras frequentes para facilitar revisões de textos maiores.",
    ],
    useCases: [
      { title: "SEO e conteúdo", description: "Confira títulos, descrições e textos antes de publicar em páginas, artigos e materiais digitais." },
      { title: "Redes sociais", description: "Use os limites de referência para revisar legendas, posts e outros conteúdos antes da publicação." },
      { title: "Roteiros e apresentações", description: "Estime o tempo de leitura e de fala para organizar roteiros, vídeos, aulas e apresentações." },
      { title: "Revisão de texto", description: "Observe palavras frequentes, quantidade de frases, parágrafos e linhas para apoiar a edição do conteúdo." },
    ],
    steps: [
      "Digite ou cole o texto na área de análise.",
      "Acompanhe palavras, caracteres, frases, parágrafos, linhas e tempos estimados.",
      "Escolha um limite de referência ou informe um limite personalizado quando necessário.",
      "Revise o conteúdo e use os comandos de copiar, colar ou limpar conforme precisar.",
    ],
    specifications: [
      { label: "Palavras", value: "Conta sequências de letras e números e considera palavras com apóstrofo ou hífen interno quando aplicável." },
      { label: "Caracteres", value: "Exibe contagem com espaços e uma segunda contagem removendo caracteres de espaço em branco." },
      { label: "Tempo de leitura", value: "Estimativa baseada em aproximadamente 200 palavras por minuto." },
      { label: "Tempo de fala", value: "Estimativa baseada em aproximadamente 130 palavras por minuto." },
      { label: "Palavras frequentes", value: "Lista até oito termos recorrentes, ignorando palavras curtas e uma lista básica de stopwords em português." },
      { label: "Limites de referência", value: "Inclui presets para SEO e plataformas digitais, além de permitir limite personalizado de caracteres." },
    ],
    privacy: "O texto é analisado localmente no navegador. O conteúdo digitado ou colado não precisa ser enviado ao servidor do Kivai para que as métricas sejam calculadas.",
    limitations: [
      "As estimativas de leitura e fala são aproximações e variam conforme ritmo, idioma, complexidade e estilo do conteúdo.",
      "Os limites exibidos para plataformas são referências práticas e podem mudar; confirme regras atuais antes de publicações importantes.",
      "A contagem de frases é baseada em pontuação e pode diferir da interpretação linguística em textos com abreviações ou estruturas incomuns.",
      "A frequência de palavras usa uma lista simples de stopwords e não substitui análise semântica ou revisão editorial.",
    ],
    faqs: [
      { question: "O texto é enviado para o Kivai?", answer: "Não. As métricas são calculadas diretamente no navegador durante o uso da ferramenta." },
      { question: "Como o tempo de leitura é calculado?", answer: "A estimativa usa aproximadamente 200 palavras por minuto e arredonda o resultado para facilitar a leitura." },
      { question: "Como o tempo de fala é calculado?", answer: "A ferramenta utiliza aproximadamente 130 palavras por minuto como referência de fala." },
      { question: "Os limites de Instagram, Google Ads e SEO são garantidos?", answer: "Não. Eles funcionam como referências práticas. Plataformas e boas práticas podem alterar seus limites e recomendações." },
      { question: "A ferramenta identifica palavras mais usadas?", answer: "Sim. Ela mostra até oito termos frequentes, desconsiderando palavras muito curtas e algumas palavras comuns do português." },
    ],
    related: [
      { href: "/ferramentas/contador-de-caracteres-instagram", label: "Contador de Caracteres para Instagram" },
    ],
  },
};
