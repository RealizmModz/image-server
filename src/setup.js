const bcrypt = require('bcrypt');
const readline = require("readline-sync");
const editJsonFile = require("edit-json-file");

const saltRounds = 13;

function generate_token(length){
    var a = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890".split("");
    var b = [];  
    for (var i=0; i<length; i++) {
        var j = (Math.random() * (a.length-1)).toFixed(0);
        b[i] = a[j];
    }
    return b.join("");
}

let token = generate_token(64)   
bcrypt.hash(token, saltRounds, function(err, hash) {
  console.log("Copy the token below and store it somewhere safe. You will need it to upload and delete images.\n")
  console.log(`Token: ${token}\n`)
  console.log("Copy the hashed version and put it in the Environment Variables with the name of TOKEN\n")
  console.log(`Hashed Token: ${hash}\n`) 
  console.log("Now let's setup the config.json file.")
  console.log("Run the replit and copy the URL of the web server.\n")
  let url = readline.question("What is the URL? ")

  let file = editJsonFile(`${__dirname}/config.json`);
  file.set("website_address", url);
  file.save();
  file = editJsonFile(`config.json`, {
    autosave: true
  });
  console.log("Now restart the Repl.")
  console.log("You now have your own image web server!")
  console.log("Made by Luis Pavel.\n\n")
  console.log("https://replit.com/@luispavela/Image-Server?v=1")
})