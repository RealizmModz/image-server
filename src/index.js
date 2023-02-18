const multer = require("multer")
const fs = require('fs')
const cors = require("cors")
const bodyparser = require('body-parser');
const stream = require('stream')
const config = require("./config.json")

// Encryption Setup
const bcrypt = require('bcrypt');
const saltRounds = 13;

// Express Setup
const express = require('express');
const app = express();

app.set("view engine", "ejs")
app.use(cors())
app.use(bodyparser.json())


function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}


// Multer
let storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, config.images_path)
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
})

const fileFilter = (req, file, cb) => {
  bcrypt.compare(req.headers.authentication, process.env.TOKEN, function(err, result) {
    if (result == true) {
      if (file.mimetype === "image/jpeg" || file.mimetype === "image/jpg" || file.mimetype === "image/png") {
        cb(null, true)
      } else {
        cb(null, false)
      } 
    } else {
      return "Unauthorised"
    }
  })
}

let upload = multer({
  storage: storage,
  fileFilter: fileFilter
})


// UI Routes
app.get('/', (req, res) => {
  let file_names = fs.readdirSync(config.images_path)
  var file_sizes = []
  file_names.forEach((file, index) => {
    file_sizes[index] = formatBytes(fs.statSync(`${config.images_path}${file_names[index]}`).size)
  }) 
  
  res.render("main", {
    directory: "/",
    names: file_names,
    sizes: file_sizes,
    website: config.website_address,
  })
})

app.get('/upload',(req, res) => {
  res.render("upload", {
    website: config.website_address,
  })
})

app.get('/delete',(req, res) => {
  res.render("delete", {
    website: config.website_address,
  })
})

// API
app.get('/:directory',(req, res) => {
  if (fs.existsSync(`${config.images_path}${req.params.directory}`)) {
    const r = fs.createReadStream(`${config.images_path}${req.params.directory}`)
    const ps = new stream.PassThrough()
    stream.pipeline(
      r,
      ps,
      (err) => {
        if (err) {
          console.log(err)
          return res.sendStatus(400); 
        }
      }
    )
    ps.pipe(res)

  } else {
    res.status(404)
    res.send("The file was not found")
  }
})

app.post('/upload', upload.single("file"), async (req, res) => {
  if (req.file){
    bcrypt.compare(req.headers.authentication, process.env.TOKEN, function(err, result) {
      if (result == true) {
        const pathName = req.file.path
        res.status(200)
        res.send(`The image is now at ${config.website_address}${pathName}`)
      } else {
        res.status(401)
        res.send(`The auth token is not valid`)
      }
    })
  }
});

app.delete('/delete', (req, res) => {
  bcrypt.compare(req.headers.authentication, process.env.TOKEN, function(err, result) {
    if (result == true) {
      if (req.headers.url.includes(config.website_address)) {
        if (fs.existsSync(`${config.images_path}${req.headers.url.replace(config.website_address, '').replace("%20", " ")}`)) {
          fs.unlink(`${config.images_path}${req.headers.url.replace(config.website_address, '').replace("%20", " ")}`, function (err) {
            if (err) throw err;
        
            res.status(200)
            res.send("The file deleted")
          })
        } else {
          res.status(404)
          res.send("The file was not found")
        }
      }
    } else {
      res.status(401)
      res.send(`The token is not valid`)
    }
  })
});


// 
app.listen(3000, () => {
  console.log('Image Server is up and running!');
});