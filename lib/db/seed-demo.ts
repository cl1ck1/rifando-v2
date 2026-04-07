/**
 * Seed script: creates a Clerk demo account and populates the database
 * with realistic Brazilian rifeiro data using Drizzle ORM.
 *
 * Usage (from workspace root): pnpm --filter @workspace/db run seed-demo
 */

import { db } from "./src/index.js";
import {
  configuracoesTable,
  categoriasTable,
  produtosTable,
  clientesTable,
  vendasTable,
  vendaItensTable,
  parcelasTable,
  rotasTable,
  rotaParadasTable,
  lojaBannersTable,
} from "./src/schema/index.js";
import { eq, inArray } from "drizzle-orm";

const DEMO_EMAIL = "demo@sourifeiro.app";
const DEMO_PASSWORD = "Rifeiro@Demo2024";
const CATALOG_SLUG = "maria";

// ── Clerk user ─────────────────────────────────────────────────────────────

async function getOrCreateClerkUser(): Promise<string> {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) throw new Error("CLERK_SECRET_KEY not set");

  const searchRes = await fetch(
    `https://api.clerk.com/v1/users?email_address=${encodeURIComponent(DEMO_EMAIL)}`,
    { headers: { Authorization: `Bearer ${secretKey}` } }
  );
  const existing = await searchRes.json() as Array<{ id: string }>;
  if (Array.isArray(existing) && existing.length > 0) {
    const userId = existing[0].id;
    console.log(`Clerk user already exists: ${userId} — resetting password...`);
    const patchRes = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${secretKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ password: DEMO_PASSWORD, skip_password_checks: true }),
    });
    if (!patchRes.ok) {
      const err = await patchRes.json();
      throw new Error(`Failed to reset password: ${JSON.stringify(err)}`);
    }
    console.log("Password reset OK.");
    return userId;
  }

  const res = await fetch("https://api.clerk.com/v1/users", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email_address: [DEMO_EMAIL],
      password: DEMO_PASSWORD,
      first_name: "Maria",
      last_name: "Vendedora",
    }),
  });

  const user = await res.json() as { id: string };
  if (!res.ok) throw new Error(`Clerk error: ${JSON.stringify(user)}`);
  console.log(`Clerk user created: ${user.id}`);
  return user.id;
}

// ── Database seed ──────────────────────────────────────────────────────────

async function seedDatabase(userId: string): Promise<void> {
  // ── Clear existing data (idempotent) ──
  const vendaIds = await db
    .select({ id: vendasTable.id })
    .from(vendasTable)
    .where(eq(vendasTable.userId, userId));

  if (vendaIds.length > 0) {
    const ids = vendaIds.map((v) => v.id);
    await db.delete(parcelasTable).where(eq(parcelasTable.userId, userId));
    await db.delete(vendaItensTable).where(inArray(vendaItensTable.vendaId, ids));
  }
  await db.delete(vendasTable).where(eq(vendasTable.userId, userId));
  await db.delete(rotaParadasTable).where(eq(rotaParadasTable.userId, userId));
  await db.delete(rotasTable).where(eq(rotasTable.userId, userId));
  await db.delete(clientesTable).where(eq(clientesTable.userId, userId));
  await db.delete(produtosTable).where(eq(produtosTable.userId, userId));
  await db.delete(categoriasTable).where(eq(categoriasTable.userId, userId));
  await db.delete(lojaBannersTable).where(eq(lojaBannersTable.userId, userId));
  await db.delete(configuracoesTable).where(eq(configuracoesTable.userId, userId));
  console.log("Existing data cleared.");

  // ── Configuracoes ──
  await db.insert(configuracoesTable).values({
    userId,
    nomeNegocio: "Bazar da Maria",
    telefoneWhatsapp: "31999887766",
    logoUrl: "https://picsum.photos/seed/bazarmaria_logo/200/200",
    bannerPrincipalUrl: "https://picsum.photos/seed/bazarmaria_banner/1200/400",
    corPrincipal: "#7c3aed",
    corSecundaria: "#f59e0b",
    descricao: "Produtos selecionados com qualidade e preco justo, levados ate a sua porta!",
    catalogoSlug: CATALOG_SLUG,
    catalogoAtivo: true,
    cidade: "Belo Horizonte",
    estado: "MG",
    chavePix: "maria.bazar@pix.com",
    mensagemBoasVindas: "Bem-vinda ao Bazar da Maria! Temos as melhores ofertas da regiao.",
  });
  console.log("Configuracoes OK");

  // ── Categorias ──
  const catDefs = [
    { nome: "Roupas",     cor: "#ec4899", ordem: 0 },
    { nome: "Calcados",   cor: "#3b82f6", ordem: 1 },
    { nome: "Acessorios", cor: "#10b981", ordem: 2 },
    { nome: "Cosmeticos", cor: "#f97316", ordem: 3 },
    { nome: "Brinquedos", cor: "#eab308", ordem: 4 },
  ] as const;

  const insertedCats = await db
    .insert(categoriasTable)
    .values(catDefs.map((c) => ({ userId, ...c, exibirNoCatalogo: true })))
    .returning({ id: categoriasTable.id, nome: categoriasTable.nome });

  const cats: Record<string, number> = {};
  for (const c of insertedCats) cats[c.nome] = c.id;
  console.log("Categorias OK:", Object.keys(cats));

  // ── Produtos ──
  const prodDefs = [
    { nome: "Blusa Floral Manga Longa",         descricao: "Blusa feminina estampada, tecido leve e confortavel",       precoCusto: "22.00", precoVenda: "45.00",  catNome: "Roupas",     estoque: 15, imagemUrl: "https://picsum.photos/seed/blusa1/400/400" },
    { nome: "Calca Jeans Skinny",                descricao: "Calca jeans feminina modelagem skinny, varios tamanhos",    precoCusto: "55.00", precoVenda: "89.90",  catNome: "Roupas",     estoque:  8, imagemUrl: "https://picsum.photos/seed/calcajeans/400/400" },
    { nome: "Vestido Midi Listrado",             descricao: "Vestido midi com listras coloridas, ideal para o verao",    precoCusto: "35.00", precoVenda: "69.90",  catNome: "Roupas",     estoque: 10, imagemUrl: "https://picsum.photos/seed/vestido1/400/400" },
    { nome: "Tenis Feminino Casual",             descricao: "Tenis branco casual para uso diario, numeracoes 34-40",     precoCusto: "65.00", precoVenda: "119.90", catNome: "Calcados",   estoque:  6, imagemUrl: "https://picsum.photos/seed/tenis1/400/400" },
    { nome: "Sandalia Rasteira Colorida",        descricao: "Sandalia rasteira de tiras, 5 cores disponiveis",           precoCusto: "18.00", precoVenda: "35.00",  catNome: "Calcados",   estoque: 20, imagemUrl: "https://picsum.photos/seed/sandalia1/400/400" },
    { nome: "Brinco Argola Dourada",             descricao: "Par de brincos argola folheada a ouro, hipo-alergico",      precoCusto: "8.00",  precoVenda: "22.90",  catNome: "Acessorios", estoque: 30, imagemUrl: "https://picsum.photos/seed/brinco1/400/400" },
    { nome: "Bolsa Tote Feminina",               descricao: "Bolsa tote de lona com alca de couro sintetico",            precoCusto: "28.00", precoVenda: "59.90",  catNome: "Acessorios", estoque: 12, imagemUrl: "https://picsum.photos/seed/bolsa1/400/400" },
    { nome: "Kit Maquiagem Completo",            descricao: "Kit com batom, sombra, rimel e blush, cor nude",            precoCusto: "25.00", precoVenda: "55.00",  catNome: "Cosmeticos", estoque: 18, imagemUrl: "https://picsum.photos/seed/maquiagem1/400/400" },
    { nome: "Hidratante Corporal Rosa Mosqueta", descricao: "Hidratante 200ml com oleo de rosa mosqueta",                precoCusto: "12.00", precoVenda: "28.90",  catNome: "Cosmeticos", estoque: 25, imagemUrl: "https://picsum.photos/seed/hidratante1/400/400" },
    { nome: "Boneca de Pano Artesanal",          descricao: "Boneca artesanal de pano, 30cm, varias opcoes",             precoCusto: "15.00", precoVenda: "39.90",  catNome: "Brinquedos", estoque: 14, imagemUrl: "https://picsum.photos/seed/boneca1/400/400" },
  ];

  const insertedProds = await db
    .insert(produtosTable)
    .values(
      prodDefs.map((p) => ({
        userId,
        nome: p.nome,
        descricao: p.descricao,
        precoCusto: p.precoCusto,
        precoVenda: p.precoVenda,
        imagemUrl: p.imagemUrl,
        categoriaId: cats[p.catNome],
        categoriaNome: p.catNome,
        estoque: p.estoque,
        ativo: true,
      }))
    )
    .returning({ id: produtosTable.id, nome: produtosTable.nome, precoVenda: produtosTable.precoVenda });
  console.log(`Produtos OK: ${insertedProds.length}`);

  // ── Clientes ──
  const clienteDefs = [
    { nome: "Ana Paula Souza",    telefone: "31988112233", endereco: "Rua das Flores, 45",      bairro: "Santa Monica",  cidade: "Belo Horizonte", estado: "MG" },
    { nome: "Fernanda Lima",      telefone: "31977223344", endereco: "Av. Brasil, 120 ap 3",    bairro: "Centro",        cidade: "Belo Horizonte", estado: "MG" },
    { nome: "Josiane Costa",      telefone: "31966334455", endereco: "Rua Sete de Setembro, 8", bairro: "Barreiro",      cidade: "Belo Horizonte", estado: "MG" },
    { nome: "Patricia Mendes",    telefone: "31955445566", endereco: "Rua dos Ipes, 200",       bairro: "Betania",       cidade: "Belo Horizonte", estado: "MG" },
    { nome: "Claudia Ferreira",   telefone: "31944556677", endereco: "Rua Boa Vista, 33",       bairro: "Buritis",       cidade: "Belo Horizonte", estado: "MG" },
    { nome: "Rosangela Barbosa",  telefone: "31933667788", endereco: "Rua Jacui, 17",           bairro: "Caicara",       cidade: "Belo Horizonte", estado: "MG" },
  ];

  const insertedClientes = await db
    .insert(clientesTable)
    .values(clienteDefs.map((c) => ({ userId, ...c, status: "ativo" })))
    .returning({ id: clientesTable.id, nome: clientesTable.nome, telefone: clientesTable.telefone });
  console.log(`Clientes OK: ${insertedClientes.length}`);

  // ── Vendas + Itens + Parcelas ──
  // Venda status domain: pendente | parcial | quitada | cancelada
  // Parcela status domain: pendente | paga | atrasada | cancelada
  const vendaDefs = [
    { ci: 0, itens: [{ pi: 0, q: 2 }, { pi: 5, q: 1 }],  desc: "5.00",  forma: "parcelado", np: 3, status: "parcial",  pagos: 1 },
    { ci: 1, itens: [{ pi: 3, q: 1 }],                   desc: "0.00",  forma: "avista",    np: 1, status: "quitada",  pagos: 1 },
    { ci: 2, itens: [{ pi: 7, q: 1 }, { pi: 8, q: 2 }],  desc: "0.00",  forma: "parcelado", np: 2, status: "quitada",  pagos: 2 },
    { ci: 3, itens: [{ pi: 1, q: 1 }, { pi: 6, q: 1 }],  desc: "10.00", forma: "parcelado", np: 4, status: "pendente", pagos: 0 },
    { ci: 4, itens: [{ pi: 2, q: 1 }, { pi: 9, q: 2 }],  desc: "0.00",  forma: "parcelado", np: 3, status: "parcial",  pagos: 1 },
  ];

  for (const vd of vendaDefs) {
    const cliente = insertedClientes[vd.ci];

    let total = 0;
    for (const it of vd.itens) {
      total += parseFloat(insertedProds[it.pi].precoVenda ?? "0") * it.q;
    }
    const valorTotal = total.toFixed(2);
    const valorFinal = (total - parseFloat(vd.desc)).toFixed(2);
    const parcValor  = (parseFloat(valorFinal) / vd.np).toFixed(2);

    const [venda] = await db
      .insert(vendasTable)
      .values({
        userId,
        clienteId: cliente.id,
        clienteNome: cliente.nome,
        valorTotal,
        desconto: vd.desc,
        valorFinal,
        formaPagamento: vd.forma,
        numeroParcelas: vd.np,
        status: vd.status,
      })
      .returning({ id: vendasTable.id });

    for (const it of vd.itens) {
      const prod = insertedProds[it.pi];
      const sub  = (parseFloat(prod.precoVenda ?? "0") * it.q).toFixed(2);
      await db.insert(vendaItensTable).values({
        vendaId: venda.id,
        produtoId: prod.id,
        produtoNome: prod.nome,
        quantidade: it.q,
        precoUnitario: prod.precoVenda ?? "0",
        subtotal: sub,
      });
    }

    for (let n = 1; n <= vd.np; n++) {
      const due = new Date();
      due.setMonth(due.getMonth() + (n - 1));
      const dueStr = due.toISOString().slice(0, 10);
      const isPaid = n <= vd.pagos;
      await db.insert(parcelasTable).values({
        userId,
        vendaId: venda.id,
        clienteId: cliente.id,
        clienteNome: cliente.nome,
        clienteTelefone: cliente.telefone,
        numero: n,
        totalParcelas: vd.np,
        valor: parcValor,
        dataVencimento: dueStr,
        dataPagamento: isPaid ? dueStr : null,
        metodoPagamento: isPaid ? "pix" : null,
        status: isPaid ? "paga" : "pendente",
      });
    }
  }
  console.log("Vendas + itens + parcelas OK");

  // ── Update clientes.totalCompras with real purchase totals ──
  // Map client index to venda total (only for clients with sales: ci 0-4)
  const clienteTotais: Record<number, number> = {};
  for (const vd of vendaDefs) {
    let total = 0;
    for (const it of vd.itens) total += parseFloat(insertedProds[it.pi].precoVenda ?? "0") * it.q;
    const valorFinal = (total - parseFloat(vd.desc));
    clienteTotais[vd.ci] = (clienteTotais[vd.ci] ?? 0) + valorFinal;
  }
  for (const [ciStr, totalCompras] of Object.entries(clienteTotais)) {
    const ci = parseInt(ciStr);
    const cliente = insertedClientes[ci];
    await db
      .update(clientesTable)
      .set({ totalCompras: totalCompras.toFixed(2) })
      .where(eq(clientesTable.id, cliente.id));
  }
  console.log("Clientes totalCompras updated.");

  // ── Rotas + Paradas ──
  const [rota1] = await db
    .insert(rotasTable)
    .values({ userId, nome: "Rota Centro BH", descricao: "Clientes do centro e arredores", cor: "#7c3aed", status: "em_andamento" })
    .returning({ id: rotasTable.id });

  const [rota2] = await db
    .insert(rotasTable)
    .values({ userId, nome: "Rota Barreiro", descricao: "Clientes do Barreiro e Buritis", cor: "#10b981", status: "concluida" })
    .returning({ id: rotasTable.id });

  const paradaDefs = [
    { rotaId: rota1.id, ordem: 0, nome: "Ana Paula Souza",    enderecoCompleto: "Rua das Flores, 45 - Santa Monica",  lat: "-19.923700", lng: "-43.937800" },
    { rotaId: rota1.id, ordem: 1, nome: "Fernanda Lima",      enderecoCompleto: "Av. Brasil, 120 - Centro",           lat: "-19.918200", lng: "-43.938400" },
    { rotaId: rota1.id, ordem: 2, nome: "Patricia Mendes",    enderecoCompleto: "Rua dos Ipes, 200 - Betania",        lat: "-19.944200", lng: "-43.980100" },
    { rotaId: rota2.id, ordem: 0, nome: "Josiane Costa",      enderecoCompleto: "Rua Sete de Setembro, 8 - Barreiro", lat: "-19.988600", lng: "-44.002100" },
    { rotaId: rota2.id, ordem: 1, nome: "Claudia Ferreira",   enderecoCompleto: "Rua Boa Vista, 33 - Buritis",        lat: "-19.962200", lng: "-44.002400" },
    { rotaId: rota2.id, ordem: 2, nome: "Rosangela Barbosa",  enderecoCompleto: "Rua Jacui, 17 - Caicara",            lat: "-19.900700", lng: "-43.961900" },
  ];

  await db.insert(rotaParadasTable).values(
    paradaDefs.map((p) => ({ userId, estado: "MG", ...p }))
  );
  console.log("Rotas + paradas OK");

  // ── Loja Banners ──
  await db.insert(lojaBannersTable).values([
    { userId, imageUrl: "https://picsum.photos/seed/banner_promocao/1200/400",   titulo: "Promocao de Verao — Roupas com ate 40% off!",  ordem: 0, ativo: true },
    { userId, imageUrl: "https://picsum.photos/seed/banner_calcados2/1200/400",  titulo: "Lancamento: Novos Calcados chegaram!",          ordem: 1, ativo: true },
    { userId, imageUrl: "https://picsum.photos/seed/banner_cosmeticos2/1200/400",titulo: "Kit Maquiagem com frete gratis",                ordem: 2, ativo: true },
  ]);
  console.log("Loja banners OK");
}

// ── Generate sign-in token (bypasses email OTP) ────────────────────────────

async function generateSignInLink(userId: string): Promise<string | null> {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) return null;
  const res = await fetch("https://api.clerk.com/v1/sign_in_tokens", {
    method: "POST",
    headers: { Authorization: `Bearer ${secretKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, expires_in_seconds: 86400 }),
  });
  const data = await res.json() as { url?: string };
  return data.url ?? null;
}

// ── Main ──────────────────────────────────────────────────────────────────────

const userId = await getOrCreateClerkUser();
await seedDatabase(userId);
const signInLink = await generateSignInLink(userId);

console.log("\n========================================");
console.log("  CONTA DEMO CRIADA COM SUCESSO");
console.log("========================================");
console.log(`  Email:    ${DEMO_EMAIL}`);
console.log(`  Senha:    ${DEMO_PASSWORD}`);
console.log(`  Catalogo: /catalogo/${CATALOG_SLUG}  ou  /c/${CATALOG_SLUG}`);
if (signInLink) {
  console.log("\n  Link de acesso direto (valido 24h):");
  console.log(`  ${signInLink}`);
  console.log("  (Use este link para entrar sem precisar do e-mail)");
}
console.log("========================================\n");

process.exit(0);
