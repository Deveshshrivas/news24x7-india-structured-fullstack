import cookieParser from "cookie-parser";
import cors from "cors";
import express,{type ErrorRequestHandler} from "express";
import {MongoServerError} from "mongodb";
import multer from "multer";
import {ZodError} from "zod";
import {config} from "./config.js";
import {client,db,initializeDatabase} from "./database.js";
import {articlesRouter} from "./routes/articles.js";
import {audioRouter} from "./routes/audio.js";
import {authRouter} from "./routes/auth.js";
import {breakingRouter} from "./routes/breaking.js";
import {categoriesRouter} from "./routes/categories.js";
import {dashboardRouter} from "./routes/dashboard.js";
import {reportersRouter} from "./routes/reporters.js";
import {usersRouter} from "./routes/users.js";
import {AppError,asyncRoute} from "./utils.js";

const app=express();
app.set("trust proxy",1);
const localDevelopmentOrigins=new Set(["http://127.0.0.1:5173","http://localhost:5173"]);
app.use(cors({origin(origin,callback){if(!origin||config.allowedOrigins.includes(origin)||(config.development&&localDevelopmentOrigins.has(origin)))callback(null,true);else callback(new AppError(403,"Origin not allowed"))},credentials:true}));
app.use(express.json({limit:"1mb"}));
app.use(cookieParser());

app.get("/health",asyncRoute(async(_request,response)=>{await db.command({ping:1});response.json({ok:true})}));
app.get("/docs",(_request,response)=>response.type("html").send(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>NEWS24x7 API</title><style>body{max-width:900px;margin:40px auto;padding:0 20px;font:16px system-ui;color:#172033}code{background:#f1f3f5;padding:3px 6px;border-radius:4px}li{margin:10px 0}</style></head><body><h1>NEWS24x7 India API</h1><p>Node.js, Express and MongoDB backend.</p><h2>Endpoints</h2><ul><li><code>GET /health</code></li><li><code>/auth/register · /auth/login · /auth/google · /auth/me · /auth/logout</code></li><li><code>/dashboard/stats</code> — live newsroom totals</li><li><code>/users</code> — super-admin user management</li><li><code>/articles</code> — article CRUD and search</li><li><code>/categories</code> — category and subcategory CRUD</li><li><code>/reporters</code> — reporter profiles and photos</li><li><code>/breaking</code> — breaking-news CRUD</li><li><code>/audio</code> — MP3 upload, ordering and streaming</li></ul></body></html>`));
app.use("/auth",authRouter);
app.use("/dashboard",dashboardRouter);
app.use("/users",usersRouter);
app.use("/breaking",breakingRouter);
app.use("/audio",audioRouter);
app.use("/articles",articlesRouter);
app.use("/categories",categoriesRouter);
app.use("/reporters",reportersRouter);
app.use((_request,response)=>response.status(404).json({detail:"Not found"}));

const errorHandler:ErrorRequestHandler=(error,_request,response,_next)=>{
  if(error instanceof ZodError){response.status(422).json({detail:error.issues.map(issue=>`${issue.path.join(".")||"body"}: ${issue.message}`).join("; ")});return}
  if(error instanceof multer.MulterError){const sizeMessage=error.field==="photo"?"Photo must be 5 MB or smaller":error.field==="image"?"News image must be 8 MB or smaller":"MP3 must be 25 MB or smaller";response.status(error.code==="LIMIT_FILE_SIZE"?413:400).json({detail:error.code==="LIMIT_FILE_SIZE"?sizeMessage:error.message});return}
  if(error instanceof MongoServerError&&error.code===11000){response.status(409).json({detail:"Record already exists"});return}
  if(error instanceof AppError){response.status(error.status).json({detail:error.message});return}
  if(error instanceof SyntaxError&&"body" in error){response.status(400).json({detail:"Invalid JSON body"});return}
  console.error(error);response.status(500).json({detail:"Internal server error"});
};
app.use(errorHandler);

await initializeDatabase();
const server=app.listen(config.port,"0.0.0.0",()=>console.log(`NEWS24x7 Node API listening on http://127.0.0.1:${config.port}`));
async function shutdown(){server.close(async()=>{await client.close();process.exit(0)})}
process.on("SIGINT",()=>void shutdown());process.on("SIGTERM",()=>void shutdown());
