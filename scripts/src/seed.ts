import { db, pool } from "@workspace/db";
import {
  clientesTable,
  categoriasTable,
  produtosTable,
  vendasTable,
  vendaItensTable,
  parcelasTable,
  configuracoesTable,
  atividadesTable,
} from "@workspace/db";
import { eq } from "drizzle-orm";

const DEMO_USER_ID = process.argv[2] || "demo_user_001";

async function seed() {
  console.log(`Seeding database for userId: ${DEMO_USER_ID}`);

  const [config] = await db.insert(configuracoesTable).values({
    userId: DEMO_USER_ID,
    nomeNegocio: "Maria Enxovais",
    telefoneWhatsapp: "(11) 98765-4321",
    cidade: "Sao Paulo",
    estado: "SP",
    catalogoSlug: "maria-enxovais",
    catalogoAtivo: true,
    chavePix: "maria@email.com",
    mensagemBoasVindas: "Ola! Bem-vindo(a) a Maria Enxovais. Como posso ajudar?",
  }).returning();
  console.log(`Config criada: ${config.nomeNegocio}`);

  const categoriaData = [
    { userId: DEMO_USER_ID, nome: "Enxovais" },
    { userId: DEMO_USER_ID, nome: "Utensilios Domesticos" },
    { userId: DEMO_USER_ID, nome: "Eletronicos" },
    { userId: DEMO_USER_ID, nome: "Cama, Mesa e Banho" },
  ];
  const categorias = await db.insert(categoriasTable).values(categoriaData).returning();
  console.log(`${categorias.length} categorias criadas`);

  const produtoData = [
    { userId: DEMO_USER_ID, nome: "Jogo de Cama Casal", descricao: "200 fios, algodao, branco", precoCusto: "45.00", precoVenda: "89.90", categoriaId: categorias[0].id, categoriaNome: categorias[0].nome, estoque: 30, ativo: true },
    { userId: DEMO_USER_ID, nome: "Cobertor Queen", descricao: "Manta microfibra, macia", precoCusto: "35.00", precoVenda: "79.90", categoriaId: categorias[0].id, categoriaNome: categorias[0].nome, estoque: 25, ativo: true },
    { userId: DEMO_USER_ID, nome: "Jogo de Toalhas 5pcs", descricao: "Banho, rosto e lavabo", precoCusto: "28.00", precoVenda: "59.90", categoriaId: categorias[3].id, categoriaNome: categorias[3].nome, estoque: 40, ativo: true },
    { userId: DEMO_USER_ID, nome: "Panela de Pressao 7L", descricao: "Aluminio polido, inducao", precoCusto: "55.00", precoVenda: "119.90", categoriaId: categorias[1].id, categoriaNome: categorias[1].nome, estoque: 15, ativo: true },
    { userId: DEMO_USER_ID, nome: "Jogo de Panelas 5pcs", descricao: "Antiaderente, tampa vidro", precoCusto: "85.00", precoVenda: "189.90", categoriaId: categorias[1].id, categoriaNome: categorias[1].nome, estoque: 12, ativo: true },
    { userId: DEMO_USER_ID, nome: "Liquidificador 1000W", descricao: "12 velocidades, copo 3L", precoCusto: "65.00", precoVenda: "149.90", categoriaId: categorias[2].id, categoriaNome: categorias[2].nome, estoque: 20, ativo: true },
    { userId: DEMO_USER_ID, nome: "Ventilador de Mesa 40cm", descricao: "3 velocidades, oscilante", precoCusto: "42.00", precoVenda: "99.90", categoriaId: categorias[2].id, categoriaNome: categorias[2].nome, estoque: 18, ativo: true },
    { userId: DEMO_USER_ID, nome: "Ferro de Passar", descricao: "Vapor, antiaderente, 1200W", precoCusto: "38.00", precoVenda: "89.90", categoriaId: categorias[2].id, categoriaNome: categorias[2].nome, estoque: 22, ativo: true },
    { userId: DEMO_USER_ID, nome: "Travesseiro Viscoelastico", descricao: "NASA, altura media", precoCusto: "25.00", precoVenda: "69.90", categoriaId: categorias[3].id, categoriaNome: categorias[3].nome, estoque: 35, ativo: true },
    { userId: DEMO_USER_ID, nome: "Colcha Boutis King", descricao: "Estampada, 3 pecas", precoCusto: "55.00", precoVenda: "129.90", categoriaId: categorias[0].id, categoriaNome: categorias[0].nome, estoque: 10, ativo: true },
  ];
  const produtos = await db.insert(produtosTable).values(produtoData).returning();
  console.log(`${produtos.length} produtos criados`);

  const clienteData = [
    { userId: DEMO_USER_ID, nome: "Ana Silva", telefone: "(11) 99111-2233", cpf: "123.456.789-00", endereco: "Rua das Flores, 123", bairro: "Centro", cidade: "Ribeirao Preto", estado: "SP", referencia: "Proximo ao mercado", totalCompras: "0" },
    { userId: DEMO_USER_ID, nome: "Beatriz Souza", telefone: "(11) 99222-3344", endereco: "Av. Brasil, 456", bairro: "Jardim America", cidade: "Franca", estado: "SP", totalCompras: "0" },
    { userId: DEMO_USER_ID, nome: "Carla Oliveira", telefone: "(11) 99333-4455", cpf: "987.654.321-00", endereco: "Rua do Comercio, 789", bairro: "Vila Nova", cidade: "Bauru", estado: "SP", referencia: "Casa amarela", totalCompras: "0" },
    { userId: DEMO_USER_ID, nome: "Daniela Santos", telefone: "(11) 99444-5566", endereco: "Rua Sao Paulo, 321", bairro: "Boa Vista", cidade: "Marilia", estado: "SP", totalCompras: "0" },
    { userId: DEMO_USER_ID, nome: "Elaine Costa", telefone: "(11) 99555-6677", cpf: "111.222.333-44", endereco: "Av. Independencia, 654", bairro: "Liberdade", cidade: "Araraquara", estado: "SP", referencia: "Esquina com padaria", totalCompras: "0" },
    { userId: DEMO_USER_ID, nome: "Fernanda Lima", telefone: "(11) 99666-7788", endereco: "Rua Minas Gerais, 987", bairro: "Santa Cruz", cidade: "Sao Carlos", estado: "SP", totalCompras: "0" },
    { userId: DEMO_USER_ID, nome: "Gabriela Ferreira", telefone: "(11) 99777-8899", endereco: "Rua Goias, 147", bairro: "Parque Industrial", cidade: "Campinas", estado: "SP", totalCompras: "0" },
    { userId: DEMO_USER_ID, nome: "Helena Rodrigues", telefone: "(11) 99888-9900", cpf: "555.666.777-88", endereco: "Av. Rio Branco, 258", bairro: "Centro", cidade: "Piracicaba", estado: "SP", referencia: "Perto da praca", totalCompras: "0" },
    { userId: DEMO_USER_ID, nome: "Isabela Almeida", telefone: "(11) 99999-0011", endereco: "Rua Bahia, 369", bairro: "Jardim Europa", cidade: "Sorocaba", estado: "SP", totalCompras: "0" },
    { userId: DEMO_USER_ID, nome: "Julia Martins", telefone: "(11) 99000-1122", endereco: "Rua Parana, 741", bairro: "Vila Rica", cidade: "Presidente Prudente", estado: "SP", totalCompras: "0" },
    { userId: DEMO_USER_ID, nome: "Karen Pereira", telefone: "(11) 99111-3344", cpf: "222.333.444-55", endereco: "Av. Paulista, 852", bairro: "Bela Vista", cidade: "Santos", estado: "SP", totalCompras: "0" },
    { userId: DEMO_USER_ID, nome: "Larissa Gomes", telefone: "(11) 99222-4455", endereco: "Rua dos Bandeirantes, 963", bairro: "Alto da Colina", cidade: "Jundiai", estado: "SP", totalCompras: "0" },
    { userId: DEMO_USER_ID, nome: "Monica Ribeiro", telefone: "(11) 99333-5566", endereco: "Rua Santa Catarina, 159", bairro: "Cidade Nova", cidade: "Limeira", estado: "SP", referencia: "Muro verde", totalCompras: "0" },
    { userId: DEMO_USER_ID, nome: "Natalia Barbosa", telefone: "(11) 99444-6677", endereco: "Av. Amazonas, 357", bairro: "Jardim Primavera", cidade: "Tatui", estado: "SP", totalCompras: "0" },
    { userId: DEMO_USER_ID, nome: "Patricia Carvalho", telefone: "(11) 99555-7788", cpf: "333.444.555-66", endereco: "Rua Tocantins, 468", bairro: "Residencial Sol", cidade: "Avare", estado: "SP", totalCompras: "0" },
    { userId: DEMO_USER_ID, nome: "Renata Nascimento", telefone: "(11) 99666-8899", endereco: "Rua Pernambuco, 579", bairro: "Parque Novo", cidade: "Botucatu", estado: "SP", totalCompras: "0" },
    { userId: DEMO_USER_ID, nome: "Sandra Moreira", telefone: "(11) 99777-9900", endereco: "Av. Ceara, 680", bairro: "Vila Esperanca", cidade: "Jaboticabal", estado: "SP", totalCompras: "0" },
    { userId: DEMO_USER_ID, nome: "Tatiana Araujo", telefone: "(11) 99888-0011", cpf: "444.555.666-77", endereco: "Rua Sergipe, 791", bairro: "Jardim das Rosas", cidade: "Bebedouro", estado: "SP", referencia: "Portao azul", totalCompras: "0" },
    { userId: DEMO_USER_ID, nome: "Vanessa Mendes", telefone: "(11) 99999-1122", endereco: "Rua Alagoas, 802", bairro: "Alto Alegre", cidade: "Lins", estado: "SP", totalCompras: "0" },
    { userId: DEMO_USER_ID, nome: "Zelia Cardoso", telefone: "(11) 99000-2233", endereco: "Av. Maranhao, 913", bairro: "Centro", cidade: "Assis", estado: "SP", totalCompras: "0" },
  ];
  const clientes = await db.insert(clientesTable).values(clienteData).returning();
  console.log(`${clientes.length} clientes criados`);

  const vendaConfigs = [
    { clienteIdx: 0, items: [{ prodIdx: 0, qty: 2 }, { prodIdx: 2, qty: 1 }], parcelas: 4, desconto: 10 },
    { clienteIdx: 1, items: [{ prodIdx: 3, qty: 1 }, { prodIdx: 5, qty: 1 }], parcelas: 3, desconto: 0 },
    { clienteIdx: 2, items: [{ prodIdx: 4, qty: 1 }], parcelas: 5, desconto: 0 },
    { clienteIdx: 3, items: [{ prodIdx: 1, qty: 2 }, { prodIdx: 8, qty: 2 }], parcelas: 4, desconto: 15 },
    { clienteIdx: 4, items: [{ prodIdx: 6, qty: 1 }, { prodIdx: 7, qty: 1 }], parcelas: 3, desconto: 0 },
    { clienteIdx: 5, items: [{ prodIdx: 9, qty: 1 }, { prodIdx: 0, qty: 1 }], parcelas: 3, desconto: 5 },
    { clienteIdx: 6, items: [{ prodIdx: 2, qty: 3 }], parcelas: 2, desconto: 0 },
    { clienteIdx: 7, items: [{ prodIdx: 5, qty: 1 }], parcelas: 1, desconto: 0 },
    { clienteIdx: 8, items: [{ prodIdx: 1, qty: 1 }, { prodIdx: 3, qty: 1 }], parcelas: 4, desconto: 10 },
    { clienteIdx: 10, items: [{ prodIdx: 4, qty: 1 }, { prodIdx: 6, qty: 2 }], parcelas: 6, desconto: 20 },
  ];

  for (let vi = 0; vi < vendaConfigs.length; vi++) {
    const vc = vendaConfigs[vi];
    const cliente = clientes[vc.clienteIdx];

    let valorTotal = 0;
    const itensResolved: Array<{ produtoId: number; produtoNome: string; quantidade: number; precoUnitario: number; subtotal: number }> = [];

    for (const item of vc.items) {
      const prod = produtos[item.prodIdx];
      const preco = Number(prod.precoVenda);
      const subtotal = item.qty * preco;
      valorTotal += subtotal;
      itensResolved.push({
        produtoId: prod.id,
        produtoNome: prod.nome,
        quantidade: item.qty,
        precoUnitario: preco,
        subtotal,
      });
    }

    const valorFinal = valorTotal - vc.desconto;
    const createdDate = new Date();
    createdDate.setDate(createdDate.getDate() - (vendaConfigs.length - vi) * 7);

    const [venda] = await db.insert(vendasTable).values({
      userId: DEMO_USER_ID,
      clienteId: cliente.id,
      clienteNome: cliente.nome,
      valorTotal: valorTotal.toFixed(2),
      desconto: vc.desconto.toFixed(2),
      valorFinal: valorFinal.toFixed(2),
      formaPagamento: vc.parcelas === 1 ? "avista" : "parcelado",
      numeroParcelas: vc.parcelas,
      status: "pendente",
      createdAt: createdDate,
    }).returning();

    for (const item of itensResolved) {
      await db.insert(vendaItensTable).values({
        vendaId: venda.id,
        produtoId: item.produtoId,
        produtoNome: item.produtoNome,
        quantidade: item.quantidade,
        precoUnitario: item.precoUnitario.toFixed(2),
        subtotal: item.subtotal.toFixed(2),
      });
    }

    const valorParcela = valorFinal / vc.parcelas;
    let vendaStatus = "pendente";

    for (let i = 1; i <= vc.parcelas; i++) {
      const dueDate = new Date(createdDate);
      dueDate.setMonth(dueDate.getMonth() + i);
      const dueDateStr = dueDate.toISOString().split("T")[0];

      const isPaid = vi < 3 && i <= 2;
      const isOverdue = !isPaid && dueDate < new Date();

      let status: string;
      let dataPagamento: string | null = null;
      let metodoPagamento: string | null = null;

      if (isPaid) {
        status = "paga";
        const payDate = new Date(dueDate);
        payDate.setDate(payDate.getDate() - Math.floor(Math.random() * 3));
        dataPagamento = payDate.toISOString().split("T")[0];
        metodoPagamento = ["pix", "dinheiro", "cartao"][Math.floor(Math.random() * 3)];
      } else if (isOverdue) {
        status = "atrasada";
      } else {
        status = "pendente";
      }

      await db.insert(parcelasTable).values({
        userId: DEMO_USER_ID,
        vendaId: venda.id,
        clienteId: cliente.id,
        clienteNome: cliente.nome,
        clienteTelefone: cliente.telefone,
        numero: i,
        totalParcelas: vc.parcelas,
        valor: valorParcela.toFixed(2),
        dataVencimento: dueDateStr,
        dataPagamento,
        metodoPagamento,
        status,
        createdAt: createdDate,
      });
    }

    const allPaid = vi < 3 && vc.parcelas <= 2;
    const somePaid = vi < 3;
    if (allPaid) {
      vendaStatus = "quitada";
    } else if (somePaid) {
      vendaStatus = "parcial";
    }

    await db.update(vendasTable).set({ status: vendaStatus }).where(eq(vendasTable.id, venda.id));

    await db.update(clientesTable)
      .set({ totalCompras: valorFinal.toFixed(2) })
      .where(eq(clientesTable.id, cliente.id));

    console.log(`Venda #${venda.id}: ${cliente.nome} - R$ ${valorFinal.toFixed(2)} (${vc.parcelas}x) - ${vendaStatus}`);
  }

  const activityData = [
    { userId: DEMO_USER_ID, type: "venda" as const, description: "Nova venda de R$ 229.70 para Ana Silva" },
    { userId: DEMO_USER_ID, type: "pagamento" as const, description: "Parcela 1/4 de Ana Silva recebida - R$ 57.43" },
    { userId: DEMO_USER_ID, type: "cliente" as const, description: "Novo cliente cadastrado: Beatriz Souza" },
    { userId: DEMO_USER_ID, type: "venda" as const, description: "Nova venda de R$ 269.80 para Beatriz Souza" },
    { userId: DEMO_USER_ID, type: "produto" as const, description: "Novo produto cadastrado: Jogo de Cama Casal" },
    { userId: DEMO_USER_ID, type: "pagamento" as const, description: "Parcela 1/3 de Beatriz Souza recebida - R$ 89.93" },
  ];
  await db.insert(atividadesTable).values(activityData);
  console.log(`${activityData.length} atividades criadas`);

  console.log("\nSeed concluido com sucesso!");
  console.log(`- ${clientes.length} clientes`);
  console.log(`- ${categorias.length} categorias`);
  console.log(`- ${produtos.length} produtos`);
  console.log(`- ${vendaConfigs.length} vendas com parcelas`);

  await pool.end();
}

seed().catch((err) => {
  console.error("Erro no seed:", err);
  process.exit(1);
});
