import { Router, type IRouter } from "express";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { db } from "@workspace/db";
import { parcelasTable, vendasTable, clientesTable, configuracoesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";

const router: IRouter = Router();

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

function numberToWords(n: number): string {
  const units = ["", "um", "dois", "tres", "quatro", "cinco", "seis", "sete", "oito", "nove"];
  const teens = ["dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
  const tens = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
  const hundreds = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];

  if (n === 0) return "zero";
  if (n === 100) return "cem";

  const parts: string[] = [];
  const intPart = Math.floor(n);
  const centavos = Math.round((n - intPart) * 100);

  if (intPart >= 1000) {
    const mil = Math.floor(intPart / 1000);
    if (mil === 1) {
      parts.push("mil");
    } else {
      parts.push(units[mil] + " mil");
    }
    const remainder = intPart % 1000;
    if (remainder > 0) {
      if (remainder < 100) {
        parts.push("e");
      }
      if (remainder >= 100) {
        parts.push(remainder === 100 ? "cem" : hundreds[Math.floor(remainder / 100)]);
        const rem2 = remainder % 100;
        if (rem2 > 0) {
          parts.push("e");
          if (rem2 < 10) parts.push(units[rem2]);
          else if (rem2 < 20) parts.push(teens[rem2 - 10]);
          else {
            parts.push(tens[Math.floor(rem2 / 10)]);
            if (rem2 % 10 > 0) parts.push("e " + units[rem2 % 10]);
          }
        }
      } else {
        if (remainder < 10) parts.push(units[remainder]);
        else if (remainder < 20) parts.push(teens[remainder - 10]);
        else {
          parts.push(tens[Math.floor(remainder / 10)]);
          if (remainder % 10 > 0) parts.push("e " + units[remainder % 10]);
        }
      }
    }
  } else if (intPart >= 100) {
    parts.push(intPart === 100 ? "cem" : hundreds[Math.floor(intPart / 100)]);
    const rem = intPart % 100;
    if (rem > 0) {
      parts.push("e");
      if (rem < 10) parts.push(units[rem]);
      else if (rem < 20) parts.push(teens[rem - 10]);
      else {
        parts.push(tens[Math.floor(rem / 10)]);
        if (rem % 10 > 0) parts.push("e " + units[rem % 10]);
      }
    }
  } else if (intPart >= 10) {
    if (intPart < 20) parts.push(teens[intPart - 10]);
    else {
      parts.push(tens[Math.floor(intPart / 10)]);
      if (intPart % 10 > 0) parts.push("e " + units[intPart % 10]);
    }
  } else {
    parts.push(units[intPart]);
  }

  parts.push("reais");

  if (centavos > 0) {
    parts.push("e");
    if (centavos < 10) parts.push(units[centavos]);
    else if (centavos < 20) parts.push(teens[centavos - 10]);
    else {
      parts.push(tens[Math.floor(centavos / 10)]);
      if (centavos % 10 > 0) parts.push("e " + units[centavos % 10]);
    }
    parts.push("centavos");
  }

  return parts.join(" ");
}

router.get("/parcelas/:id/promissoria", requireAuth, async (req, res): Promise<void> => {
  const { userId } = req as AuthRequest;
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  if (isNaN(id)) {
    res.status(400).json({ error: "ID invalido" });
    return;
  }

  const parcelas = await db.select().from(parcelasTable)
    .where(and(eq(parcelasTable.id, id), eq(parcelasTable.userId, userId)))
    .limit(1);

  if (parcelas.length === 0) {
    res.status(404).json({ error: "Parcela nao encontrada" });
    return;
  }

  const parcela = parcelas[0];

  const clientes = await db.select().from(clientesTable)
    .where(and(eq(clientesTable.id, parcela.clienteId), eq(clientesTable.userId, userId)))
    .limit(1);
  const cliente = clientes[0];

  const vendas = await db.select().from(vendasTable)
    .where(eq(vendasTable.id, parcela.vendaId))
    .limit(1);
  const venda = vendas[0];

  const configs = await db.select().from(configuracoesTable)
    .where(eq(configuracoesTable.userId, userId))
    .limit(1);
  const config = configs[0];

  const valor = Number(parcela.valor);
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const { height } = page.getSize();

  let y = height - 50;
  const leftMargin = 50;
  const lineHeight = 18;

  page.drawText("NOTA PROMISSORIA", {
    x: 180,
    y,
    size: 20,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  y -= 10;

  page.drawLine({
    start: { x: leftMargin, y },
    end: { x: 545, y },
    thickness: 2,
    color: rgb(0, 0, 0),
  });
  y -= 30;

  page.drawText(`No: ${parcela.numero}/${parcela.totalParcelas}`, {
    x: leftMargin,
    y,
    size: 12,
    font: boldFont,
  });

  page.drawText(`Vencimento: ${formatDate(parcela.dataVencimento)}`, {
    x: 350,
    y,
    size: 12,
    font,
  });
  y -= lineHeight * 2;

  page.drawText(`Valor: ${formatCurrency(valor)}`, {
    x: leftMargin,
    y,
    size: 14,
    font: boldFont,
  });
  y -= lineHeight;

  page.drawText(`(${numberToWords(valor)})`, {
    x: leftMargin,
    y,
    size: 10,
    font,
    color: rgb(0.3, 0.3, 0.3),
  });
  y -= lineHeight * 2;

  page.drawLine({
    start: { x: leftMargin, y: y + 5 },
    end: { x: 545, y: y + 5 },
    thickness: 0.5,
    color: rgb(0.7, 0.7, 0.7),
  });

  page.drawText("DADOS DO DEVEDOR (EMITENTE)", {
    x: leftMargin,
    y,
    size: 11,
    font: boldFont,
  });
  y -= lineHeight;

  const devedorFields = [
    ["Nome", cliente?.nome || parcela.clienteNome],
    ["CPF", cliente?.cpf || "Nao informado"],
    ["Telefone", cliente?.telefone || parcela.clienteTelefone || "Nao informado"],
    ["Endereco", cliente?.endereco || "Nao informado"],
    ["Bairro", cliente?.bairro || ""],
    ["Cidade/Estado", `${cliente?.cidade || ""} - ${cliente?.estado || ""}`],
  ];

  for (const [label, value] of devedorFields) {
    if (!value || value === " - ") continue;
    page.drawText(`${label}: ${value}`, {
      x: leftMargin + 10,
      y,
      size: 10,
      font,
    });
    y -= lineHeight;
  }

  y -= 10;
  page.drawLine({
    start: { x: leftMargin, y: y + 5 },
    end: { x: 545, y: y + 5 },
    thickness: 0.5,
    color: rgb(0.7, 0.7, 0.7),
  });

  page.drawText("DADOS DO CREDOR (BENEFICIARIO)", {
    x: leftMargin,
    y,
    size: 11,
    font: boldFont,
  });
  y -= lineHeight;

  const credorFields = [
    ["Nome/Empresa", config?.nomeNegocio || "Nao informado"],
    ["WhatsApp", config?.telefoneWhatsapp || ""],
    ["Cidade/Estado", `${config?.cidade || ""} - ${config?.estado || ""}`],
    ["Chave Pix", config?.chavePix || ""],
  ];

  for (const [label, value] of credorFields) {
    if (!value || value === " - ") continue;
    page.drawText(`${label}: ${value}`, {
      x: leftMargin + 10,
      y,
      size: 10,
      font,
    });
    y -= lineHeight;
  }

  y -= 10;
  page.drawLine({
    start: { x: leftMargin, y: y + 5 },
    end: { x: 545, y: y + 5 },
    thickness: 0.5,
    color: rgb(0.7, 0.7, 0.7),
  });

  page.drawText("DADOS DA VENDA", {
    x: leftMargin,
    y,
    size: 11,
    font: boldFont,
  });
  y -= lineHeight;

  if (venda) {
    page.drawText(`Venda #${venda.id} - Valor total: ${formatCurrency(Number(venda.valorFinal))}`, {
      x: leftMargin + 10,
      y,
      size: 10,
      font,
    });
    y -= lineHeight;
    page.drawText(`Parcelas: ${parcela.numero} de ${parcela.totalParcelas} - Forma: ${venda.formaPagamento}`, {
      x: leftMargin + 10,
      y,
      size: 10,
      font,
    });
    y -= lineHeight;
  }

  y -= 20;

  const declaracao = `Pelo presente titulo, prometo pagar ao beneficiario acima ou a sua ordem, a quantia de ${formatCurrency(valor)} (${numberToWords(valor)}), na data de vencimento acima indicada, em moeda corrente nacional, sob pena de protesto.`;

  const words = declaracao.split(" ");
  let currentLine = "";
  const maxWidth = 490;

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = font.widthOfTextAtSize(testLine, 10);
    if (testWidth > maxWidth) {
      page.drawText(currentLine, { x: leftMargin, y, size: 10, font });
      y -= lineHeight;
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) {
    page.drawText(currentLine, { x: leftMargin, y, size: 10, font });
    y -= lineHeight;
  }

  y -= 30;

  const today = new Date();
  const emissao = `${today.getDate().toString().padStart(2, "0")}/${(today.getMonth() + 1).toString().padStart(2, "0")}/${today.getFullYear()}`;
  page.drawText(`Local e data: ${config?.cidade || "_______________"}, ${emissao}`, {
    x: leftMargin,
    y,
    size: 10,
    font,
  });
  y -= 50;

  page.drawLine({
    start: { x: leftMargin, y },
    end: { x: 280, y },
    thickness: 1,
    color: rgb(0, 0, 0),
  });
  y -= lineHeight;
  page.drawText("Assinatura do Emitente (Devedor)", {
    x: leftMargin + 20,
    y,
    size: 9,
    font,
    color: rgb(0.4, 0.4, 0.4),
  });

  page.drawLine({
    start: { x: 320, y: y + lineHeight },
    end: { x: 545, y: y + lineHeight },
    thickness: 1,
    color: rgb(0, 0, 0),
  });
  page.drawText("Assinatura do Beneficiario (Credor)", {
    x: 340,
    y,
    size: 9,
    font,
    color: rgb(0.4, 0.4, 0.4),
  });

  const pdfBytes = await pdfDoc.save();

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=promissoria-${parcela.numero}-${parcela.totalParcelas}.pdf`);
  res.send(Buffer.from(pdfBytes));
});

export default router;
