const { Client } = require('pg');
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const { db_credentials } = require('./db_credentials.js');
const path = require('path');

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

app.get('/dog-list', async (req, res) => {
    const client = new Client(db_credentials);

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

app.post('/add-dog', async (req, res) => {
    const { dname, birth_year, gender } = req.body;

    if (!dname || !birth_year || !gender) {
        res.status(400).send("Missing required fields");
        return;
    }

    else if (isNaN(birth_year) || !['M', 'F'].includes(gender)) {
        res.status(400).send("Wrong values in fields");
        return;
    }

    const client = new Client(db_credentials);

    try {
        await client.connect();
        const insertQuery = `INSERT INTO dogs (name, birth_year, gender) VALUES ($1, $2, $3)`;
        await client.query(insertQuery, [dname, birth_year, gender]);

        res.redirect('/dog-list');
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).send('Internal Server Error');
    } finally {
        await client.end();
    }
});

app.get('/download-dog-list', async (req, res) => {
    const client = new Client(db_credentials);

    try {
        await client.connect();
        const result = await client.query('SELECT * FROM dogs');
        const dogListJson = result.rows
        
        const filePath = path.join(__dirname, 'dog_list.json');
        fs.writeFileSync(filePath, JSON.stringify(dogListJson, null, 2), 'utf8');
        res.download(filePath, 'dog_list.json', (err) => {
            if (err) {
                console.error('Error sending file:', err);
                res.status(500).send('Error sending file');
            }
            // deleting file from server:
            // fs.unlink(filePath, (err) => {
            //     if (err) console.error('Error deleting file:', err);
            // });
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error downloading dogs');
    } finally {
        await client.end();
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
console.log(`Server running at http://localhost:${port}/`);
