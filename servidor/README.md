# Camada do servidor: não confie no app

Esta é a camada que mais protege. A ideia é simples: **tudo que tem valor é decidido
no servidor, não no app**. O app (site, celular, desktop) é "burro": ele pergunta e
mostra o que o servidor responde. Se alguém desmontar o app, não acha nada de valor,
porque o valor nunca esteve lá.

As travas locais (detectar debugger, root, ofuscar) são úteis, mas sozinhas não
seguram ninguém. Esta camada é a que fecha a porta.

## A regra única

> Se um atacante reescrevesse o app inteiro do zero, falando direto com o seu
> servidor, ele conseguiria fazer algo que não deveria?

Se a resposta for sim, a proteção está no lugar errado. Mova para o servidor.

## O que NUNCA fica no app

- Chave de API, senha, segredo, token de serviço, chave de assinatura. Nada disso
  dentro do APK, do .exe ou do JavaScript do site. Desmontar o app não pode revelar
  um segredo.
- A decisão "este usuário é Pro / pagou / pode fazer X". O app pergunta; o servidor
  decide, conferindo no banco. Nunca um `if (ehPro)` que o app resolve sozinho.
- Preço, total, limite, validade. Sempre vêm do banco no servidor, nunca de um valor
  que o app mandou.

## O que fica no app

- A interface e a experiência.
- Uma cópia só de leitura do estado ("você é Pro"), usada para mostrar a tela certa,
  sabendo que ela pode ser forjada. Por isso toda ação sensível reconfere no servidor.

## Os três pilares

### 1. Autoridade no servidor

Toda ação que vale dinheiro ou dá acesso passa por uma verificação no servidor, no
momento da ação, contra o banco. O app enviar "sou Pro" não vale nada: o servidor
olha o banco dele. Exemplo prático em `exemplos/licenca-nextjs.ts`.

### 2. Identidade do app (atestação de integridade)

Como o servidor sabe que quem está falando é o app de verdade, e não um clone ou um
script? Pedindo ao sistema operacional um atestado assinado:

- **Android**: Play Integrity API. O Google assina uma prova de que o pedido veio do
  seu app original (mesmo pacote, mesma assinatura), num aparelho não adulterado. O
  servidor confere essa prova. Um APK modificado ou um emulador não consegue gerar
  uma prova válida. Exemplo em `exemplos/play-integrity-servidor.ts`.
- **iOS**: App Attest / DeviceCheck (mesma ideia, feita pela Apple).
- **Web**: não existe prova forte (o navegador é aberto por natureza). Aqui a defesa
  é rate limit, Turnstile/captcha e, de novo, toda lógica no servidor.
- **Desktop (Pertin)**: assinatura de código + o servidor exige um token de sessão
  curto e amarra o comportamento (um cliente que foge do protocolo é cortado).

A atestação não é à prova de tudo, mas transforma "copiar o app" num problema caro.

### 3. Segredo que não vira estático

Se o app precisa de alguma chave para funcionar (por exemplo, falar com um serviço
de terceiro), ela não vai embutida. O app pede ao seu servidor, que valida e devolve
um token **curto** (minutos), amarrado àquele usuário e àquele aparelho. Assim não
existe uma chave fixa para alguém extrair e reusar.

## Checklist

- [ ] Nenhum segredo embutido no app (procure por chaves no APK/.exe/JS antes de publicar).
- [ ] Toda ação paga ou privilegiada reconfere permissão no servidor, contra o banco.
- [ ] Preço, limite e validade vêm sempre do servidor.
- [ ] Android/iOS com atestação de integridade nas rotas sensíveis.
- [ ] Web com rate limit e captcha nas rotas sensíveis.
- [ ] Segredos de terceiros entregues como token curto, nunca fixo.
- [ ] Erros do servidor não vazam detalhe interno para o app.

## Como testar se funcionou

Pegue o app, descubra qual rota do servidor ele chama numa ação Pro, e tente chamar
essa rota **direto**, sem o app, forjando "sou Pro". Se o servidor recusar porque
olhou o banco, a blindagem está certa. Se liberar, a decisão estava no app: mova para
o servidor. (Esse teste você faz nos SEUS sistemas, para achar a falha antes que
outro ache.)
