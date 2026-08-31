export type PercentageMode =
  | "percentageOfValue"
  | "whatPercentage"
  | "percentageIncrease"
  | "percentageDecrease"
  | "increaseValue"
  | "decreaseValue"
  | "originalBeforeIncrease"
  | "originalBeforeDiscount";

export type PercentageResult = {
  value: number;
  answer: string;
  formula: string;
  steps: string[];
};

type PercentageModeConfig = {
  label: string;
  description: string;
  firstLabel: string;
  secondLabel: string;
  firstPlaceholder: string;
  secondPlaceholder: string;
  examples: [string, string][];
};

export const modes: Record<PercentageMode, PercentageModeConfig> = {
  percentageOfValue: {
    label: "Calcular porcentagem de um valor",
    description: "Descubra quanto é uma porcentagem de um valor.",
    firstLabel: "Porcentagem (%)",
    secondLabel: "Valor",
    firstPlaceholder: "Ex.: 20",
    secondPlaceholder: "Ex.: 350",
    examples: [["10", "200"], ["15", "500"], ["25", "1000"], ["8", "450"]],
  },
  whatPercentage: {
    label: "Descobrir a porcentagem",
    description: "Descubra quanto um valor representa de outro.",
    firstLabel: "Valor parcial",
    secondLabel: "Valor total",
    firstPlaceholder: "Ex.: 80",
    secondPlaceholder: "Ex.: 200",
    examples: [["80", "200"], ["45", "300"], ["25", "400"], ["180", "240"]],
  },
  percentageIncrease: {
    label: "Calcular aumento percentual",
    description: "Compare um valor inicial com um valor final maior ou igual a ele.",
    firstLabel: "Valor inicial",
    secondLabel: "Valor final",
    firstPlaceholder: "Ex.: 100",
    secondPlaceholder: "Ex.: 150",
    examples: [["100", "150"], ["200", "250"], ["80", "100"], ["500", "625"]],
  },
  percentageDecrease: {
    label: "Calcular redução percentual",
    description: "Compare um valor inicial com um valor final menor ou igual a ele.",
    firstLabel: "Valor inicial",
    secondLabel: "Valor final",
    firstPlaceholder: "Ex.: 150",
    secondPlaceholder: "Ex.: 100",
    examples: [["150", "100"], ["200", "150"], ["80", "60"], ["500", "400"]],
  },
  increaseValue: {
    label: "Aumentar um valor",
    description: "Aplique um acréscimo percentual não negativo ao valor.",
    firstLabel: "Valor",
    secondLabel: "Aumento (%)",
    firstPlaceholder: "Ex.: 250",
    secondPlaceholder: "Ex.: 15",
    examples: [["250", "15"], ["100", "20"], ["500", "10"], ["80", "25"]],
  },
  decreaseValue: {
    label: "Diminuir um valor",
    description: "Aplique um desconto entre 0% e 100% ao valor.",
    firstLabel: "Valor",
    secondLabel: "Desconto (%)",
    firstPlaceholder: "Ex.: 250",
    secondPlaceholder: "Ex.: 15",
    examples: [["250", "15"], ["100", "20"], ["500", "10"], ["80", "25"]],
  },
  originalBeforeIncrease: {
    label: "Descobrir valor antes do aumento",
    description: "Encontre o valor original antes de um aumento percentual não negativo.",
    firstLabel: "Valor final",
    secondLabel: "Aumento (%)",
    firstPlaceholder: "Ex.: 120",
    secondPlaceholder: "Ex.: 20",
    examples: [["120", "20"], ["150", "50"], ["220", "10"], ["375", "25"]],
  },
  originalBeforeDiscount: {
    label: "Descobrir valor antes do desconto",
    description: "Encontre o valor original antes de um desconto entre 0% e menos de 100%.",
    firstLabel: "Valor final",
    secondLabel: "Desconto (%)",
    firstPlaceholder: "Ex.: 80",
    secondPlaceholder: "Ex.: 20",
    examples: [["80", "20"], ["90", "10"], ["75", "25"], ["160", "20"]],
  },
};

export function parseNumber(input: string) {
  const normalized = input
    .trim()
    .replace(/\s/g, "")
    .replace(/\.(?=\d{3}(?:\D|$))/g, "")
    .replace(",", ".");
  const value = Number(normalized);
  return normalized && Number.isFinite(value) ? value : null;
}

export function format(value: number) {
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(value);
}

export function calculate(
  mode: PercentageMode,
  firstInput: string,
  secondInput: string,
): PercentageResult | { error: string } {
  const a = parseNumber(firstInput);
  const b = parseNumber(secondInput);

  if (a === null || b === null) {
    return { error: "Preencha os dois campos com números válidos." };
  }

  let value: number;
  let answer: string;
  let formula: string;
  let steps: string[];

  if (mode === "percentageOfValue") {
    value = (a * b) / 100;
    answer = `${format(a)}% de ${format(b)} é ${format(value)}.`;
    formula = "porcentagem ÷ 100 × valor";
    steps = [
      `${format(a)} ÷ 100 = ${format(a / 100)}`,
      `${format(a / 100)} × ${format(b)} = ${format(value)}`,
    ];
  } else if (mode === "whatPercentage") {
    if (a < 0) return { error: "O valor parcial deve ser igual ou maior que zero." };
    if (b <= 0) return { error: "O valor total deve ser maior que zero." };

    value = (a / b) * 100;
    answer = `${format(a)} representa ${format(value)}% de ${format(b)}.`;
    formula = "valor parcial ÷ valor total × 100";
    steps = [`${format(a)} ÷ ${format(b)} × 100 = ${format(value)}%`];
  } else if (mode === "percentageIncrease") {
    if (a <= 0) return { error: "O valor inicial deve ser maior que zero." };
    if (b < a) {
      return { error: "Para calcular aumento, o valor final deve ser maior ou igual ao valor inicial." };
    }

    value = ((b - a) / a) * 100;
    answer = `De ${format(a)} para ${format(b)} houve aumento de ${format(value)}%.`;
    formula = "(valor final − valor inicial) ÷ valor inicial × 100";
    steps = [`(${format(b)} − ${format(a)}) ÷ ${format(a)} × 100 = ${format(value)}%`];
  } else if (mode === "percentageDecrease") {
    if (a <= 0) return { error: "O valor inicial deve ser maior que zero." };
    if (b < 0) return { error: "O valor final deve ser igual ou maior que zero." };
    if (b > a) {
      return { error: "Para calcular redução, o valor final deve ser menor ou igual ao valor inicial." };
    }

    value = ((a - b) / a) * 100;
    answer = `De ${format(a)} para ${format(b)} houve redução de ${format(value)}%.`;
    formula = "(valor inicial − valor final) ÷ valor inicial × 100";
    steps = [`(${format(a)} − ${format(b)}) ÷ ${format(a)} × 100 = ${format(value)}%`];
  } else if (mode === "increaseValue") {
    if (a < 0) return { error: "O valor deve ser igual ou maior que zero." };
    if (b < 0) return { error: "O aumento percentual deve ser igual ou maior que zero." };

    value = a * (1 + b / 100);
    answer = `Ao aumentar ${format(a)} em ${format(b)}%, o novo valor é ${format(value)}.`;
    formula = "valor × (1 + porcentagem ÷ 100)";
    steps = [`${format(a)} × (1 + ${format(b)} ÷ 100) = ${format(value)}`];
  } else if (mode === "decreaseValue") {
    if (a < 0) return { error: "O valor deve ser igual ou maior que zero." };
    if (b < 0 || b > 100) return { error: "O desconto deve estar entre 0% e 100%." };

    value = a * (1 - b / 100);
    answer = `Ao diminuir ${format(a)} em ${format(b)}%, o novo valor é ${format(value)}.`;
    formula = "valor × (1 − porcentagem ÷ 100)";
    steps = [`${format(a)} × (1 − ${format(b)} ÷ 100) = ${format(value)}`];
  } else if (mode === "originalBeforeIncrease") {
    if (a < 0) return { error: "O valor final deve ser igual ou maior que zero." };
    if (b < 0) return { error: "O aumento percentual deve ser igual ou maior que zero." };

    value = a / (1 + b / 100);
    answer = `O valor original era ${format(value)}.`;
    formula = "valor final ÷ (1 + aumento ÷ 100)";
    steps = [`${format(a)} ÷ (1 + ${format(b)} ÷ 100) = ${format(value)}`];
  } else {
    if (a < 0) return { error: "O valor final deve ser igual ou maior que zero." };
    if (b < 0 || b >= 100) {
      return { error: "O desconto deve ser igual ou maior que 0% e menor que 100%." };
    }

    value = a / (1 - b / 100);
    answer = `O valor original era ${format(value)}.`;
    formula = "valor final ÷ (1 − desconto ÷ 100)";
    steps = [`${format(a)} ÷ (1 − ${format(b)} ÷ 100) = ${format(value)}`];
  }

  if (!Number.isFinite(value)) {
    return { error: "Não foi possível calcular com os valores informados." };
  }

  return { value, answer, formula, steps };
}
