import { Router, type IRouter } from "express";
import healthRouter from "./health";
import dashboardRouter from "./dashboard";
import vendasRouter from "./vendas";
import clientesRouter from "./clientes";
import parcelasRouter from "./parcelas";
import produtosRouter from "./produtos";
import categoriasRouter from "./categorias";
import configuracoesRouter from "./configuracoes";
import promissoriaRouter from "./promissoria";
import catalogoPublicoRouter from "./catalogoPublico";
import rotasRouter from "./rotas";

const router: IRouter = Router();

router.use(healthRouter);
router.use(catalogoPublicoRouter);
router.use(dashboardRouter);
router.use(vendasRouter);
router.use(rotasRouter);
router.use(clientesRouter);
router.use(parcelasRouter);
router.use(produtosRouter);
router.use(categoriasRouter);
router.use(configuracoesRouter);
router.use(promissoriaRouter);

export default router;
