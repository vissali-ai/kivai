import type { useQrCode } from "./use-qr-code";
import { normalizarEntradaTelefoneBrasil } from "./qr-content";

type Props = Pick<
  ReturnType<typeof useQrCode>,
  "tipo"
  | "url"
  | "setUrl"
  | "texto"
  | "setTexto"
  | "whatsappNumero"
  | "setWhatsappNumero"
  | "whatsappMensagem"
  | "setWhatsappMensagem"
  | "telefone"
  | "setTelefone"
  | "emailDestino"
  | "setEmailDestino"
  | "emailAssunto"
  | "setEmailAssunto"
  | "emailMensagem"
  | "setEmailMensagem"
  | "wifiNome"
  | "setWifiNome"
  | "wifiSenha"
  | "setWifiSenha"
  | "wifiSeguranca"
  | "setWifiSeguranca"
  | "wifiOculta"
  | "setWifiOculta"
>;

export function QrContentFields({
  tipo,
  url,
  setUrl,
  texto,
  setTexto,
  whatsappNumero,
  setWhatsappNumero,
  whatsappMensagem,
  setWhatsappMensagem,
  telefone,
  setTelefone,
  emailDestino,
  setEmailDestino,
  emailAssunto,
  setEmailAssunto,
  emailMensagem,
  setEmailMensagem,
  wifiNome,
  setWifiNome,
  wifiSenha,
  setWifiSenha,
  wifiSeguranca,
  setWifiSeguranca,
  wifiOculta,
  setWifiOculta,
}: Props) {
    const inputClassName =
      "h-11 w-full border border-border bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary";

    const textareaClassName =
      "min-h-28 w-full resize-y border border-border bg-background px-3 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary";

    switch (tipo) {
      case "url":
        return (
          <div>
            <label
              htmlFor="qr-url"
              className="text-sm font-medium"
            >
              Endereço do site
            </label>

            <input
              id="qr-url"
              type="text"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="exemplo.com.br"
              className={`${inputClassName} mt-2`}
            />

            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Se você não informar o protocolo, adicionaremos
              https:// automaticamente.
            </p>
          </div>
        );

      case "texto":
        return (
          <div>
            <label
              htmlFor="qr-texto"
              className="text-sm font-medium"
            >
              Conteúdo do texto
            </label>

            <textarea
              id="qr-texto"
              value={texto}
              onChange={(event) => setTexto(event.target.value)}
              placeholder="Digite a mensagem ou informação"
              className={`${textareaClassName} mt-2`}
            />
          </div>
        );

      case "whatsapp":
        return (
          <div className="space-y-4">
            <div>
              <label
                htmlFor="qr-whatsapp-numero"
                className="text-sm font-medium"
              >
                Número com DDD
              </label>

              <div className="mt-2 flex h-11 border border-border bg-background focus-within:border-primary">
                <span className="flex items-center border-r border-border px-3 text-sm font-medium text-foreground">+55</span>
                <input
                  id="qr-whatsapp-numero"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  maxLength={11}
                  value={whatsappNumero}
                  onChange={(event) => setWhatsappNumero(normalizarEntradaTelefoneBrasil(event.target.value))}
                  placeholder="31999999999"
                  className="min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground"
                />
              </div>

              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                Digite apenas DDD e número. O código do Brasil (+55) será incluído automaticamente.
              </p>
            </div>

            <div>
              <label
                htmlFor="qr-whatsapp-mensagem"
                className="text-sm font-medium"
              >
                Mensagem inicial
              </label>

              <textarea
                id="qr-whatsapp-mensagem"
                value={whatsappMensagem}
                onChange={(event) =>
                  setWhatsappMensagem(event.target.value)
                }
                placeholder="Olá, gostaria de mais informações."
                className={`${textareaClassName} mt-2`}
              />
            </div>
          </div>
        );

      case "telefone":
        return (
          <div>
            <label
              htmlFor="qr-telefone"
              className="text-sm font-medium"
            >
              Número de telefone
            </label>

            <div className="mt-2 flex h-11 border border-border bg-background focus-within:border-primary">
              <span className="flex items-center border-r border-border px-3 text-sm font-medium text-foreground">+55</span>
              <input
                id="qr-telefone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                maxLength={11}
                value={telefone}
                onChange={(event) => setTelefone(normalizarEntradaTelefoneBrasil(event.target.value))}
                placeholder="(71) 99999-0000"
                className="min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>

            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Digite apenas DDD e número. O código do Brasil (+55) será incluído automaticamente.
            </p>
          </div>
        );

      case "email":
        return (
          <div className="space-y-4">
            <div>
              <label
                htmlFor="qr-email-destino"
                className="text-sm font-medium"
              >
                E-mail de destino
              </label>

              <input
                id="qr-email-destino"
                type="email"
                value={emailDestino}
                onChange={(event) =>
                  setEmailDestino(event.target.value)
                }
                placeholder="contato@exemplo.com"
                className={`${inputClassName} mt-2`}
              />
            </div>

            <div>
              <label
                htmlFor="qr-email-assunto"
                className="text-sm font-medium"
              >
                Assunto
              </label>

              <input
                id="qr-email-assunto"
                type="text"
                value={emailAssunto}
                onChange={(event) =>
                  setEmailAssunto(event.target.value)
                }
                placeholder="Assunto da mensagem"
                className={`${inputClassName} mt-2`}
              />
            </div>

            <div>
              <label
                htmlFor="qr-email-mensagem"
                className="text-sm font-medium"
              >
                Mensagem
              </label>

              <textarea
                id="qr-email-mensagem"
                value={emailMensagem}
                onChange={(event) =>
                  setEmailMensagem(event.target.value)
                }
                placeholder="Escreva a mensagem inicial"
                className={`${textareaClassName} mt-2`}
              />
            </div>
          </div>
        );

      case "wifi":
        return (
          <div className="space-y-4">
            <div>
              <label
                htmlFor="qr-wifi-nome"
                className="text-sm font-medium"
              >
                Nome da rede
              </label>

              <input
                id="qr-wifi-nome"
                type="text"
                value={wifiNome}
                onChange={(event) =>
                  setWifiNome(event.target.value)
                }
                placeholder="Nome do Wi-Fi"
                className={`${inputClassName} mt-2`}
              />
            </div>

            <div>
              <label
                htmlFor="qr-wifi-seguranca"
                className="text-sm font-medium"
              >
                Segurança
              </label>

              <select
                id="qr-wifi-seguranca"
                value={wifiSeguranca}
                onChange={(event) =>
                  setWifiSeguranca(
                    event.target.value as
                      | "WPA"
                      | "WEP"
                      | "nopass"
                  )
                }
                className={`${inputClassName} mt-2`}
              >
                <option value="WPA">WPA / WPA2 / WPA3</option>
                <option value="WEP">WEP</option>
                <option value="nopass">Sem senha</option>
              </select>
            </div>

            {wifiSeguranca !== "nopass" && (
              <div>
                <label
                  htmlFor="qr-wifi-senha"
                  className="text-sm font-medium"
                >
                  Senha da rede
                </label>

                <input
                  id="qr-wifi-senha"
                  type="text"
                  value={wifiSenha}
                  onChange={(event) =>
                    setWifiSenha(event.target.value)
                  }
                  placeholder="Digite a senha"
                  className={`${inputClassName} mt-2`}
                />
              </div>
            )}

            <label className="flex cursor-pointer items-center gap-3 border border-border bg-muted/20 p-4">
              <input
                type="checkbox"
                checked={wifiOculta}
                onChange={(event) =>
                  setWifiOculta(event.target.checked)
                }
                className="size-4 accent-primary"
              />

              <span>
                <span className="block text-sm font-medium">
                  Rede oculta
                </span>

                <span className="mt-1 block text-xs text-muted-foreground">
                  Marque se o nome da rede não é exibido
                  publicamente.
                </span>
              </span>
            </label>
          </div>
        );

      default:
        return null;
    }
  }
