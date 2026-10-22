// Exemplo: verificar licenca/plano NO SERVIDOR, contra o banco.
//
// Stack: Next.js (App Router) + Supabase. A ideia vale para qualquer servidor.
//
// O ERRADO (no app): o app guarda `ehPro = true` e libera o recurso sozinho.
//   Quem desmonta o app troca o false por true e vira Pro de graca.
//
// O CERTO (aqui): o app so PEDE. O servidor olha o banco e decide. O que o app
//   mandar sobre o proprio plano e ignorado.

import { createClient } from "@supabase/supabase-js";

// service_role: SO existe no servidor, nunca vai para o app. Veja README.
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// Rota que executa uma acao que SO Pro pode fazer.
// O app chama POST /api/exportar com o token de sessao do usuario.
export async function POST(req: Request) {
  // 1. Quem e o usuario? Vem do token de sessao verificado no servidor,
  //    NUNCA de um campo "usuarioId" que o app mandou no corpo.
  const usuario = await usuarioDaSessao(req);
  if (!usuario) {
    return json({ erro: "nao autenticado" }, 401);
  }

  // 2. O plano vem do BANCO, agora, nao do que o app afirma.
  const { data: conta, error } = await supabase
    .from("contas")
    .select("plano, validade")
    .eq("usuario_id", usuario.id)
    .single();

  if (error || !conta) {
    return json({ erro: "conta nao encontrada" }, 403);
  }

  // 3. A decisao e do servidor. O app nao participa dela.
  const ehPro = conta.plano === "pro" && new Date(conta.validade) > new Date();
  if (!ehPro) {
    // Mesmo que o app tenha mostrado o botao, o servidor recusa.
    return json({ erro: "recurso disponivel apenas no plano Pro" }, 402);
  }

  // 4. So aqui a acao acontece, no servidor.
  const resultado = await exportarDeVerdade(usuario.id);
  return json({ ok: true, resultado });
}

// --- apoio (troque pelos seus de verdade) ---

async function usuarioDaSessao(req: Request): Promise<{ id: string } | null> {
  // Verifique o token de sessao (Supabase Auth, cookie assinado, etc.) e
  // devolva o usuario. O ponto: a identidade vem de algo que o servidor
  // VERIFICA, nao de um id solto que o app enviou.
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const { data } = await supabase.auth.getUser(token);
  return data.user ? { id: data.user.id } : null;
}

async function exportarDeVerdade(_usuarioId: string): Promise<unknown> {
  return { arquivos: 0 };
}

function json(corpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { "content-type": "application/json" },
  });
}
