/** Abre o seletor nativo mantendo o gesto do usuário. */
export function openFilePicker(input: HTMLInputElement | null) {
  if (!input || input.disabled) {
    return;
  }

  // O clique programático dentro do gesto do usuário é o caminho com
  // suporte mais uniforme em Safari/iOS, Chrome/Android e WebViews. Algumas
  // implementações de showPicker existem, mas não abrem o seletor em inputs
  // visualmente ocultos.
  input.click();
}
