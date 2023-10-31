const express = require("express")
const app = express()
const path = require("path")
const port = 3000; // Cambia el puerto según tu preferencia
const methodOverride = require('method-override')
const bodyParser = require('body-parser')
const multer = require('multer')

const NoSQLClient = require('oracle-nosqldb').NoSQLClient;
let client = new NoSQLClient({
  region: 'us-ashburn-1',
  auth: {
      iam: {
          tenantId: 'ocid1.tenancy.oc1..aaaaaaaanmtbeqga4ku7t6otd54t5bfeyiibbdrgogp6jnauvngnndoxiclq',
          userId: 'ocid1.user.oc1..aaaaaaaaiasphktasxs525q2i7pn7mbrbvv4dcwpgxujiwjv52qt6emlguhq',
          fingerprint: '0d:c0:11:a7:0a:59:20:1f:ed:6f:3d:5a:10:42:15:ff',
          privateKeyFile: 'C:\\Users\\sebas\\.oci\\oci_api_key.pem'
      }
  }
});
let idUser = 0
let idItem = 0
ids();
async function ids(){
  idUsers = await client.query("select id from users");
  idItems = await client.query("select id from catalog");
  if(idUsers.rows.length != 0){
    let lista = idUsers.rows
    idUser = lista.reduce((max, obj) => (obj.id > max ? obj.id : max), 0);
  }
  if(idItems.rows.length != 0){
    let lista = idItems.rows
    idItem = lista.reduce((max, obj) => (obj.id > max ? obj.id : max), 0);
  }
}





const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    return cb(null, './public/uploads');
  },
  filename: function (req, file, cb) {
    return cb(null, `${file.originalname}`);
  },
});
const upload = multer({storage})

app.use(express.urlencoded({extended:true}))
const publicPath = path.join(__dirname, 'public')
app.set('view engine', 'ejs')
app.set('views', path.join(publicPath, 'views'))
app.use(methodOverride('_method'))
app.use(express.static(publicPath))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.json());

app.get('/', async (req, res) => {
  const consulta = await client.query("select * from catalog")
  res.render('index.ejs', {catalog : consulta.rows});
});

app.get('/login', (req, res) => {
  
  res.render('login.ejs');
});

app.post('/productDetail', async (req, res) => {

  const result = await client.get('catalog', {id : req.body.idProduct})
  res.render('productDetails.ejs', {item : result.row})
});

app.post('/productDetailAdmin', async (req, res) => {
  const result = await client.get('catalog', {id : req.body.idProduct})
  res.render('productDetailAdmin.ejs', {item : result.row})
});


app.post('/addProducts', (req, res) => {
  res.render('addProduct.ejs')
});



app.post('/addProduct', upload.single('imagen'),  async (req, res) => {
  const file = req.file;
  const photo = file.path;
  const name = req.body.nombre;
  const description = req.body.descripcion;
  const size = req.body.talla;
  const brand = req.body.marca;
  const price = req.body.precio;
  const stock = req.body.stock;
  const contact = req.body.contacto;
  const result = await client.put('catalog', {id: idItem + 1, photo: photo, name: name, description: description, size: size, brand: brand, price: price, stock: stock, contacto: contact});
  idItem += 1;
  res.render('addProduct.ejs')
})

app.post('/confirmEdit', upload.single('imagen'),  async (req, res) => {
  const id = req.body.idProduct;
  const file = req.file;
  let photo = ''
  if (file != null){
    photo = file.path;
  } else{
    photo = req.body.path
  }
  const name = req.body.nombre;
  const description = req.body.descripcion;
  const size = req.body.talla;
  const brand = req.body.marca;
  const price = req.body.precio;
  const stock = req.body.stock;
  const contact = req.body.contacto;
  var photo2 = "public/uploads/" + photo.slice(15)
  const result = await client.query('update catalog set name = "' + name + '", description = "' + description + '", size = "' + size + '", brand = "' + brand + '", price ="' + price + '", stock = ' + stock + ', contacto = "' + contact + '" , photo = "' + photo2 + '" where id = ' + id);
  const consulta = await client.query("select * from catalog")
  res.render('admin.ejs', {catalog : consulta.rows});
})


app.post('/deleteProduct', async (req, res) => {
  const result = await client.delete('catalog', { id: req.body.idProduct });
  const consulta = await client.query("select * from catalog")
  res.render('admin.ejs', {catalog : consulta.rows});
})

app.post('/editProduct', async (req, res) => {
  const result = await client.get('catalog', {id : req.body.idProduct})
  res.render('editProduct.ejs', {item : result.row})
})

app.post('/addadmin', async function (req, res){
  const user = req.body.username
  const password = req.body.password
  const result = await client.put('users', {id: idUser + 1, username: user, password: password});
  idUser += 1
})


app.post('/admin', async function (req, res){
  try {
    const user = req.body.username
    const password = req.body.password
    const result = await client.query('SELECT password FROM users WHERE username = "' + user + '"');
    const dbpassword = result.rows[0];
    if(user === 'root' && password === dbpassword.password)
      res.render('superadmin.ejs')
    if(password === dbpassword.password){
      const consulta = await client.query("select * from catalog")
      res.render('admin.ejs', {catalog : consulta.rows});
    }
  } catch (error) {
    console.log(error)
  }
})

app.get('/admin', async (req, res) => {
  const consulta = await client.query("select * from catalog")
  res.render('admin.ejs', {catalog : consulta.rows});
})

app.listen(port, ()=>{
    console.log("port connected")
})
