import expressLayouts from 'express-ejs-layouts';
import express from 'express';
import indexRouter from './routes/index.js'
import path from 'path';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layouts/layout');
app.use(expressLayouts);
app.use(express.static('public'));
app.use( bodyParser.json() );
app.use(bodyParser.urlencoded({ extended: true })); 

app.use('/', indexRouter)

app.listen(process.env.PORT)



