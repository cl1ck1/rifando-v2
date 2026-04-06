/**
 * Seed script: creates a Clerk demo account and populates the database
 * with realistic Brazilian rifeiro data.
 *
 * Usage: node scripts/seed-demo.mjs
 */

import pg from "pg";

const { Pool } = pg;

const DEMO_EMAIL = "demo@sourifeiro.app";
const DEMO_PASSWORD = "Rifeiro@Demo2024";
const CATALOG_SLUG = "maria";

async function createClerkUser() {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) throw new Error("CLERK_SECRET_KEY not set");

  const searchRes = await fetch(
    `https://api.clerk.com/v1/users?email_address=${encodeURIComponent(DEMO_EMAIL)}`,
    { headers: { Authorization: `Bearer ${secretKey}` } }
  );
  const existing = await searchRes.json();
  if (Array.isArray(existing) && existing.length > 0) {
    console.log(`Clerk user already exists: ${existing[0].id}`);
    return existing[0].id;
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

  const user = await res.json();
  if (!res.ok) throw new Error(`Clerk error: ${JSON.stringify(user)}`);

  console.log(`Clerk user created: ${user.id}`);
  return user.id;
}

async function seedDatabase(userId) {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    // Clear existing data for idempotency
    await pool.query("DELETE FROM parcelas WHERE user_id = $1", [userId]);
    await pool.query(
      "DELETE FROM venda_itens WHERE venda_id IN (SELECT id FROM vendas WHERE user_id = $1)",
      [userId]
    );
    await pool.query("DELETE FROM vendas WHERE user_id = $1", [userId]);
    await pool.query("DELETE FROM rota_paradas WHERE user_id = $1", [userId]);
    await pool.query("DELETE FROM rotas WHERE user_id = $1", [userId]);
    await pool.query("DELETE FROM clientes WHERE user_id = $1", [userId]);
    await pool.query("DELETE FROM produtos WHERE user_id = $1", [userId]);
    await pool.query("DELETE FROM categorias WHERE user_id = $1", [userId]);
    await pool.query("DELETE FROM loja_banners WHERE user_id = $1", [userId]);
    await pool.query("DELETE FROM configuracoes WHERE user_id = $1", [userId]);
    console.log("Existing data cleared.");

    // ── Configuracoes ──────────────────────────────────────────────
    await pool.query(
      `INSERT INTO configuracoes
         (user_id, nome_negocio, telefone_whatsapp, logo_url, banner_principal_url,
          cor_principal, cor_secundaria, descricao, catalogo_slug, catalogo_ativo,
          cidade, estado, chave_pix, mensagem_boas_vindas)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
      [
        userId,
        "Bazar da Maria",
        "31999887766",
        "https://picsum.photos/seed/bazarmaria_logo/200/200",
        "https://picsum.photos/seed/bazarmaria_banner/1200/400",
        "#7c3aed",
        "#f59e0b",
        "Produtos selecionados com qualidade e preco justo, levados ate a sua porta!",
        CATALOG_SLUG,
        true,
        "Belo Horizonte",
        "MG",
        "maria.bazar@pix.com",
        "Bem-vinda ao Bazar da Maria! Temos as melhores ofertas da regiao.",
      ]
    );
    console.log("Configuracoes OK");

    // ── Categorias ─────────────────────────────────────────────────
    const catDefs = [
      ["Roupas",     "#ec4899", 0],
      ["Calcados",   "#3b82f6", 1],
      ["Acessorios", "#10b981", 2],
      ["Cosmeticos", "#f97316", 3],
      ["Brinquedos", "#eab308", 4],
    ];
    const cats = {};
    for (const [nome, cor, ordem] of catDefs) {
      const r = await pool.query(
        `INSERT INTO categorias (user_id, nome, cor, ordem, exibir_no_catalogo)
         VALUES ($1,$2,$3,$4,true) RETURNING id`,
        [userId, nome, cor, ordem]
      );
      cats[nome] = r.rows[0].id;
    }
    console.log("Categorias OK:", Object.keys(cats));

    // ── Produtos ───────────────────────────────────────────────────
    const prodDefs = [
      ["Blusa Floral Manga Longa",      "Blusa feminina estampada, tecido leve e confortavel",              "22.00", "45.00",  "Roupas",     15, "https://picsum.photos/seed/blusa1/400/400"],
      ["Calca Jeans Skinny",             "Calca jeans feminina modelagem skinny, varios tamanhos",           "55.00", "89.90",  "Roupas",      8, "https://picsum.photos/seed/calcajeans/400/400"],
      ["Vestido Midi Listrado",          "Vestido midi com listras coloridas, ideal para o verao",           "35.00", "69.90",  "Roupas",     10, "https://picsum.photos/seed/vestido1/400/400"],
      ["Tenis Feminino Casual",          "Tenis branco casual para uso diario, numeracoes 34-40",            "65.00", "119.90", "Calcados",    6, "https://picsum.photos/seed/tenis1/400/400"],
      ["Sandalia Rasteira Colorida",     "Sandalia rasteira de tiras, 5 cores disponiveis",                  "18.00", "35.00",  "Calcados",   20, "https://picsum.photos/seed/sandalia1/400/400"],
      ["Brinco Argola Dourada",          "Par de brincos argola folheada a ouro, hipo-alergico",             "8.00",  "22.90",  "Acessorios", 30, "https://picsum.photos/seed/brinco1/400/400"],
      ["Bolsa Tote Feminina",            "Bolsa tote de lona com alca de couro sintetico",                   "28.00", "59.90",  "Acessorios", 12, "https://picsum.photos/seed/bolsa1/400/400"],
      ["Kit Maquiagem Completo",         "Kit com batom, sombra, rimel e blush, cor nude",                   "25.00", "55.00",  "Cosmeticos", 18, "https://picsum.photos/seed/maquiagem1/400/400"],
      ["Hidratante Corporal Rosa Mosqueta","Hidratante 200ml com oleo de rosa mosqueta",                     "12.00", "28.90",  "Cosmeticos", 25, "https://picsum.photos/seed/hidratante1/400/400"],
      ["Boneca de Pano Artesanal",       "Boneca artesanal de pano, 30cm, varias opcoes",                    "15.00", "39.90",  "Brinquedos", 14, "https://picsum.photos/seed/boneca1/400/400"],
    ];
    const prods = [];
    for (const [nome, descricao, precoCusto, precoVenda, catNome, estoque, imagemUrl] of prodDefs) {
      const r = await pool.query(
        `INSERT INTO produtos
           (user_id, nome, descricao, preco_custo, preco_venda, imagem_url,
            categoria_id, categoria_nome, estoque, ativo)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,true) RETURNING id, nome, preco_venda`,
        [userId, nome, descricao, precoCusto, precoVenda, imagemUrl, cats[catNome], catNome, estoque]
      );
      prods.push(r.rows[0]);
    }
    console.log(`Produtos OK: ${prods.length}`);

    // ── Clientes ───────────────────────────────────────────────────
    const clienteDefs = [
      ["Ana Paula Souza",      "31988112233", "Rua das Flores, 45",      "Santa Monica",  "Belo Horizonte", "MG"],
      ["Fernanda Lima",        "31977223344", "Av. Brasil, 120 ap 3",    "Centro",        "Belo Horizonte", "MG"],
      ["Josiane Costa",        "31966334455", "Rua Sete de Setembro, 8", "Barreiro",      "Belo Horizonte", "MG"],
      ["Patricia Mendes",      "31955445566", "Rua dos Ipes, 200",       "Betania",       "Belo Horizonte", "MG"],
      ["Claudia Ferreira",     "31944556677", "Rua Boa Vista, 33",       "Buritis",       "Belo Horizonte", "MG"],
      ["Rosangela Barbosa",    "31933667788", "Rua Jacui, 17",           "Caicara",       "Belo Horizonte", "MG"],
    ];
    const clientes = [];
    for (const [nome, telefone, endereco, bairro, cidade, estado] of clienteDefs) {
      const r = await pool.query(
        `INSERT INTO clientes (user_id, nome, telefone, endereco, bairro, cidade, estado, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'ativo') RETURNING id, nome, telefone`,
        [userId, nome, telefone, endereco, bairro, cidade, estado]
      );
      clientes.push(r.rows[0]);
    }
    console.log(`Clientes OK: ${clientes.length}`);

    // ── Vendas + Itens + Parcelas ───────────────────────────────────
    const vendaDefs = [
      { ci: 0, itens: [{ pi: 0, q: 2 }, { pi: 5, q: 1 }],  desc: "5.00",  forma: "parcelado", np: 3, status: "pendente", pagos: 1 },
      { ci: 1, itens: [{ pi: 3, q: 1 }],                   desc: "0.00",  forma: "avista",    np: 1, status: "pago",     pagos: 1 },
      { ci: 2, itens: [{ pi: 7, q: 1 }, { pi: 8, q: 2 }],  desc: "0.00",  forma: "parcelado", np: 2, status: "pago",     pagos: 2 },
      { ci: 3, itens: [{ pi: 1, q: 1 }, { pi: 6, q: 1 }],  desc: "10.00", forma: "parcelado", np: 4, status: "pendente", pagos: 0 },
      { ci: 4, itens: [{ pi: 2, q: 1 }, { pi: 9, q: 2 }],  desc: "0.00",  forma: "parcelado", np: 3, status: "pendente", pagos: 1 },
    ];

    for (const vd of vendaDefs) {
      const cliente = clientes[vd.ci];
      let total = 0;
      for (const it of vd.itens) total += parseFloat(prods[it.pi].preco_venda) * it.q;
      const valorTotal  = total.toFixed(2);
      const valorFinal  = (total - parseFloat(vd.desc)).toFixed(2);
      const parcValor   = (parseFloat(valorFinal) / vd.np).toFixed(2);

      const vRes = await pool.query(
        `INSERT INTO vendas
           (user_id, cliente_id, cliente_nome, valor_total, desconto, valor_final,
            forma_pagamento, numero_parcelas, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
        [userId, cliente.id, cliente.nome, valorTotal, vd.desc, valorFinal, vd.forma, vd.np, vd.status]
      );
      const vendaId = vRes.rows[0].id;

      for (const it of vd.itens) {
        const prod = prods[it.pi];
        const sub  = (parseFloat(prod.preco_venda) * it.q).toFixed(2);
        await pool.query(
          `INSERT INTO venda_itens (venda_id, produto_id, produto_nome, quantidade, preco_unitario, subtotal)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [vendaId, prod.id, prod.nome, it.q, prod.preco_venda, sub]
        );
      }

      for (let n = 1; n <= vd.np; n++) {
        const due = new Date();
        due.setMonth(due.getMonth() + (n - 1));
        const dueStr  = due.toISOString().slice(0, 10);
        const isPaid  = n <= vd.pagos;
        await pool.query(
          `INSERT INTO parcelas
             (user_id, venda_id, cliente_id, cliente_nome, cliente_telefone,
              numero, total_parcelas, valor, data_vencimento, data_pagamento,
              metodo_pagamento, status)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
          [
            userId, vendaId, cliente.id, cliente.nome, cliente.telefone,
            n, vd.np, parcValor, dueStr,
            isPaid ? dueStr : null,
            isPaid ? "pix" : null,
            isPaid ? "pago" : "pendente",
          ]
        );
      }
    }
    console.log("Vendas + itens + parcelas OK");

    // ── Rotas + Paradas ────────────────────────────────────────────
    const r1 = await pool.query(
      `INSERT INTO rotas (user_id, nome, descricao, cor, status)
       VALUES ($1,'Rota Centro BH','Clientes do centro e arredores','#7c3aed','em_andamento')
       RETURNING id`,
      [userId]
    );
    const r2 = await pool.query(
      `INSERT INTO rotas (user_id, nome, descricao, cor, status)
       VALUES ($1,'Rota Barreiro','Clientes do Barreiro e Buritis','#10b981','concluida')
       RETURNING id`,
      [userId]
    );
    const rota1Id = r1.rows[0].id;
    const rota2Id = r2.rows[0].id;

    const paradas = [
      [rota1Id, 0, "Ana Paula Souza",   "Rua das Flores, 45 - Santa Monica",     "-19.9237", "-43.9378"],
      [rota1Id, 1, "Fernanda Lima",     "Av. Brasil, 120 - Centro",              "-19.9182", "-43.9384"],
      [rota1Id, 2, "Patricia Mendes",   "Rua dos Ipes, 200 - Betania",           "-19.9442", "-43.9801"],
      [rota2Id, 0, "Josiane Costa",     "Rua Sete de Setembro, 8 - Barreiro",    "-19.9886", "-44.0021"],
      [rota2Id, 1, "Claudia Ferreira",  "Rua Boa Vista, 33 - Buritis",           "-19.9622", "-44.0024"],
      [rota2Id, 2, "Rosangela Barbosa", "Rua Jacui, 17 - Caicara",               "-19.9007", "-43.9619"],
    ];
    for (const [rotaId, ordem, nome, end, lat, lng] of paradas) {
      await pool.query(
        `INSERT INTO rota_paradas (rota_id, user_id, ordem, nome, estado, endereco_completo, lat, lng)
         VALUES ($1,$2,$3,$4,'MG',$5,$6,$7)`,
        [rotaId, userId, ordem, nome, end, lat, lng]
      );
    }
    console.log("Rotas + paradas OK");

    // ── Loja Banners ───────────────────────────────────────────────
    const bannerDefs = [
      ["https://picsum.photos/seed/banner_promocao/1200/400", "Promocao de Verao — Roupas com ate 40% off!",  0],
      ["https://picsum.photos/seed/banner_calcados2/1200/400","Lancamento: Novos Calcados chegaram!",          1],
      ["https://picsum.photos/seed/banner_cosmeticos2/1200/400","Kit Maquiagem com frete gratis",             2],
    ];
    for (const [imageUrl, titulo, ordem] of bannerDefs) {
      await pool.query(
        `INSERT INTO loja_banners (user_id, image_url, titulo, link_url, ordem, ativo)
         VALUES ($1,$2,$3,null,$4,true)`,
        [userId, imageUrl, titulo, ordem]
      );
    }
    console.log("Loja banners OK");

  } finally {
    await pool.end();
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
const userId = await createClerkUser();
await seedDatabase(userId);

console.log("\n========================================");
console.log("  CONTA DEMO CRIADA COM SUCESSO");
console.log("========================================");
console.log(`  Email:    ${DEMO_EMAIL}`);
console.log(`  Senha:    ${DEMO_PASSWORD}`);
console.log(`  Catalogo: /catalogo/${CATALOG_SLUG}  ou  /c/${CATALOG_SLUG}`);
console.log("========================================\n");
