export const resumeSlug = "criador-de-curriculo-online";

export const resumeEditorial = {
  overview: [
    "Crie um currículo objetivo em PDF com texto selecionável, organizado para leitura humana e para sistemas de triagem que extraem texto do documento. Você pode escolher um modelo com experiência em destaque ou uma ordem voltada ao primeiro emprego.",
    "A inteligência artificial pode revisar qualquer campo que você já tenha preenchido. O Kivai envia somente o campo selecionado e orienta a IA a melhorar clareza e apresentação sem inventar cargos, experiências, cursos, resultados, habilidades ou dados de contato."
  ],
  useCases: [
    { title: "Primeiro emprego", description: "Destaque formação, projetos, atividades e habilidades quando ainda não houver experiência profissional extensa." },
    { title: "Profissionais com experiência", description: "Organize resumo, cargos e responsabilidades em uma estrutura simples, legível e fácil de atualizar." },
    { title: "Revisão antes de uma candidatura", description: "Use a IA campo a campo para melhorar a redação do conteúdo que você já escreveu, preservando os fatos informados." }
  ],
  steps: [
    "Escolha a ordem mais adequada entre profissional e primeiro emprego.",
    "Preencha nome, cargo desejado, contato, resumo, experiências, formação, projetos e habilidades.",
    "Selecione qualquer campo preenchido na área de IA para revisar a redação. Confira a sugestão antes de aplicá-la.",
    "Revise a prévia completa e confirme se datas, nomes, cargos, contatos e qualificações estão corretos.",
    "Baixe o currículo em PDF quando estiver satisfeito com o resultado."
  ],
  specifications: [
    { label: "Formato de saída", value: "PDF com texto selecionável, adequado para leitura, impressão e envio em candidaturas." },
    { label: "Rascunho", value: "Os campos preenchidos ficam salvos localmente neste navegador para reduzir o risco de perda ao sair da página ou entrar na conta." },
    { label: "Revisão com IA", value: "Todos os campos podem ser revisados individualmente. Cada geração usa 1 crédito de IA e exige login." },
    { label: "Modelos", value: "Ordem profissional, com experiência em destaque, ou primeiro emprego, com formação e projetos priorizados." }
  ],
  privacy: "O rascunho do currículo fica salvo no armazenamento local do navegador. Ao pedir uma revisão com IA, somente o texto do campo selecionado é enviado ao serviço Kivai e ao provedor externo de IA. Evite inserir informações sensíveis desnecessárias.",
  limitations: [
    "A IA melhora a redação, mas não verifica a veracidade de datas, empresas, cargos, formação ou contatos.",
    "Não existe um formato de currículo que garanta aprovação em processos seletivos. Ajuste o conteúdo à vaga e revise o PDF antes de enviar.",
    "A exportação prioriza uma estrutura textual simples. Recursos gráficos complexos e múltiplas colunas não fazem parte desta versão."
  ],
  faqs: [
    { question: "A IA pode preencher meu currículo sozinha?", answer: "Não. Para evitar informações inventadas, a IA revisa somente o conteúdo que você já digitou no campo selecionado. Você decide se aplica a sugestão." },
    { question: "Posso usar a IA em todos os campos?", answer: "Sim. Nome, cargo desejado, contato, resumo, experiência, formação, projetos e habilidades podem ser selecionados para revisão individual." },
    { question: "Meu currículo fica salvo se eu precisar entrar na conta?", answer: "Sim. O rascunho é salvo neste navegador e pode ser restaurado ao retornar à ferramenta. Ainda assim, não use o armazenamento local como cópia definitiva de informações importantes." },
    { question: "O PDF tem texto selecionável?", answer: "Sim. O currículo é gerado como PDF textual, o que facilita seleção, cópia e leitura por ferramentas que extraem texto." }
  ],
  related: [
    { href: "/ferramentas/corretor-de-texto", label: "Corretor de Texto com IA" },
    { href: "/ferramentas/contador-de-palavras", label: "Contador de Palavras" }
  ]
};
