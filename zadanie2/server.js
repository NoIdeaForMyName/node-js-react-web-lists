const { Client } = require('pg');
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = 8080;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('static'));  

app.get('/', (req, res) => {
    fs.readFile('index.html', function(err, data) {
        if (err) {
            res.status(404).send("404 Not Found");
            return;
        } 
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.write(data);
        res.end();
    });
});

app.get('/form.js', async (req, res) => {
    const client = new Client({
        host: "localhost",
        user: "postgres",
        port: 5432,
        password: "1234",  
        database: "dog_shelter"
    });

    try {
        await client.connect();
        const result = await client.query('SELECT * FROM dogs');

        let template = fs.readFileSync('dog_list_template.html', 'utf8');

        let tableRows = '';
        result.rows.forEach(row => {
            tableRows += `
            <tr>
              <td>${row.id}</td>
              <td>${row.name}</td>
              <td>${row.birth_year}</td>
              <td>${row.gender}</td>
            </tr>`;
        });

        const finalHtml = template.replace('{{TABLE_ROWS}}', tableRows);

        res.send(finalHtml);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error retrieving dogs');
    } finally {
        await client.end();
    }
});

app.post('/form.js', async (req, res) => {
    const { dname, birth_year, gender } = req.body;

    if (!dname || !birth_year || !gender) {
        res.status(400).send("Missing required fields");
        return;
    }

    const client = new Client({
        host: "localhost",
        user: "postgres",
        port: 5432,
        password: "1234",  
        database: "dog_shelter"
    });

    try {
        await client.connect();
        const insertQuery = `INSERT INTO dogs (name, birth_year, gender) VALUES ($1, $2, $3)`;
        await client.query(insertQuery, [dname, birth_year, gender]);

        res.redirect('/form.js');
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).send('Internal Server Error');
    } finally {
        await client.end();
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
console.log(`Server running at http://localhost:${port}/`);
