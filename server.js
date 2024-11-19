const express = require('express');
const livereload = require('livereload');
const connect_livereload = require('connect-livereload');
const path = require('path');

const app = express();
const port = 3050;

const public = path.join(__dirname, 'public');
const livereload_server = livereload.createServer();

livereload_server.watch(public);

app.use(connect_livereload());
app.use(express.static(public));

// livereload_server.server.once("connection", () => {
//     setTimeout(() => {
//         livereload_server.refresh("/");
//     }, 100);
// });

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});