/**
 * Abre o seletor nativo mantendo o gesto do usuário. `showPicker` é mais
 * confiável no Safari móvel; `click` preserva compatibilidade com navegadores
 * que ainda não implementam essa API.
 */
export function openFilePicker(input: HTMLInputElement | null) {
  if (!input || input.disabled) {
    return;
  }

  if (typeof input.showPicker === "function") {
    try {
      input.showPicker();
      return;
    } catch {
      // O fallback abaixo cobre versões antigas e WebViews incompletas.
    }
  }

  input.click();
}
