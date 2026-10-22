# Blindagem

Proteção contra engenharia reversa para apps próprios. Guias e código de exemplo
para dificultar a cópia, a adulteração e a análise dos seus programas (web, Android,
desktop), feitos para serem reaproveitados em qualquer projeto.

Criado pela KTech AI. Livre para uso (veja `LICENSE`).

## A verdade primeiro

Não existe trava que impeça 100% a engenharia reversa. Um programa roda na máquina
de quem usa, e quem controla a máquina sempre pode, com esforço, contornar qualquer
proteção que esteja dentro do app. Qualquer um que prometa "bloqueio total" está
vendendo ilusão.

O que dá para fazer, e é o que empresas de software sérias fazem, é trabalhar em
camadas. Cada camada **aumenta o custo** do atacante e **avisa** quando alguém tenta.
A camada do servidor é a única que realmente fecha a porta.

## As camadas, da que mais protege para a que menos protege

1. **Servidor que não confia no app** (`servidor/`). O principal. Licença, cobrança,
   permissões e qualquer regra de valor são decididas no servidor. O app só pergunta.
   Assim, mesmo um app totalmente desmontado não libera nada, porque não tem nada de
   valor dentro dele. Esta é a camada que garante o resultado.

2. **Travas locais** (em construção). Detectar debugger, emulador, root/jailbreak e
   app modificado, e recusar funcionar ou avisar o servidor. Por plataforma:
   - `android/` (Kotlin): Play Integrity, detecção de root e emulador, reassinatura.
   - `desktop/` (Rust): detecção de debugger, binário sem símbolos, assinatura.
   - `web/`: sem source maps em produção, lógica sensível fora do navegador.

3. **Ofuscar o código** (em construção). Deixar caro de ler: R8 no Android, símbolos
   removidos no Rust, strings cifradas. Não impede, atrasa.

4. **Proteção na lei** (`juridico/`, em construção). Termos de uso proibindo
   engenharia reversa, com os artigos certos (Lei de Software 9.609/1998, Lei de
   Direitos Autorais 9.610/1998, concorrência desleal).

## Por onde começar

Leia `servidor/`. É a camada que protege mais, serve para todos os projetos de uma
vez, e sem ela as outras camadas não adiantam. As demais pastas entram depois.
