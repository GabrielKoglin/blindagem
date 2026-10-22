// Exemplo: conferir no SERVIDOR a prova do Play Integrity (Android).
//
// Para que serve: garantir que o pedido veio do SEU app original (mesmo pacote,
// mesma assinatura), num aparelho Android nao adulterado, e nao de um APK
// modificado, de um emulador ou de um script falando com a sua API.
//
// Como funciona, em tres passos:
//   1. No app Android, antes de uma acao sensivel, voce pede um token de
//      integridade ao Play (com um "nonce" que o seu servidor sorteou).
//   2. O app manda esse token para o seu servidor.
//   3. O servidor pede ao Google para decifrar o token e confere o veredito.
//
// Aqui esta o passo 3 (o lado do servidor). O passo 1 fica na pasta android/.

type VereditoIntegridade = {
  requestDetails: { requestPackageName: string; nonce: string };
  appIntegrity: { appRecognitionVerdict: string; packageName?: string };
  deviceIntegrity: { deviceRecognitionVerdict: string[] };
};

const PACOTE_ESPERADO = "com.exemplo.app"; // troque pelo SEU pacote

// Decifra o token com a API do Google Play Integrity e devolve o veredito.
// (Use a biblioteca googleapis no servidor; esboco abaixo.)
export async function conferirIntegridade(
  tokenDoApp: string,
  nonceEsperado: string,
): Promise<{ confiavel: boolean; motivo?: string }> {
  let veredito: VereditoIntegridade;
  try {
    veredito = await decifrarComGoogle(tokenDoApp);
  } catch {
    return { confiavel: false, motivo: "token invalido" };
  }

  // 1. O nonce bate? (impede reaproveitar um token antigo capturado)
  if (veredito.requestDetails.nonce !== nonceEsperado) {
    return { confiavel: false, motivo: "nonce nao confere" };
  }

  // 2. E o SEU app, com a assinatura oficial?
  if (veredito.requestDetails.requestPackageName !== PACOTE_ESPERADO) {
    return { confiavel: false, motivo: "outro pacote" };
  }
  if (veredito.appIntegrity.appRecognitionVerdict !== "PLAY_RECOGNIZED") {
    // Diferente disso = APK modificado ou instalado fora da Play.
    return { confiavel: false, motivo: "app nao reconhecido pela Play" };
  }

  // 3. O aparelho e integro? (reprova emulador e root, conforme sua politica)
  const dispositivo = veredito.deviceIntegrity.deviceRecognitionVerdict;
  if (!dispositivo.includes("MEETS_DEVICE_INTEGRITY")) {
    return { confiavel: false, motivo: "aparelho nao integro" };
  }

  return { confiavel: true };
}

// Esboco: troque pela chamada real a googleapis (playintegrity.v1
// .decodeIntegrityToken), autenticada com uma conta de servico cuja chave fica
// SO no servidor, nunca no app.
async function decifrarComGoogle(_token: string): Promise<VereditoIntegridade> {
  throw new Error("ligar na API do Google Play Integrity");
}

// Uso numa rota sensivel:
//
//   const nonce = sorteieEGuarde(usuario.id);   // devolva ao app p/ gerar o token
//   ... app responde com tokenDoApp ...
//   const r = await conferirIntegridade(tokenDoApp, nonce);
//   if (!r.confiavel) return recusar(r.motivo);
//   ... so entao faca a acao ...
//
// Importante: a atestacao PROVA que o cliente e confiavel, mas NAO substitui a
// verificacao de permissao (licenca-nextjs.ts). Use as duas juntas.
