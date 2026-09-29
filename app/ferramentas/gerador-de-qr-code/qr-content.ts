export function escaparWifi(valor: string) {
  return valor.replace(/([\\;,":])/g, "\\$1");
}

export function normalizarUrl(valor: string) {
  const texto = valor.trim();

  if (!texto) {
    return "";
  }

  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(texto)) {
    return texto;
  }

  return `https://${texto}`;
}

export function somenteDigitos(valor: string) {
  return valor.replace(/\D/g, "");
}

export function normalizarEntradaTelefoneBrasil(valor: string) {
  const digitos = somenteDigitos(valor);
  const numeroNacional = digitos.length > 11 && digitos.startsWith("55")
    ? digitos.slice(2)
    : digitos;

  return numeroNacional.slice(0, 11);
}

export function numeroTelefoneBrasil(valor: string) {
  const numeroNacional = normalizarEntradaTelefoneBrasil(valor);

  if (!/^\d{10,11}$/.test(numeroNacional)) {
    return "";
  }

  return `55${numeroNacional}`;
}
