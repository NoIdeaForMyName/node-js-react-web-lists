const { Client } = require('pg'); // Import the PostgreSQL client
const fs = require('fs'); // File system for writing to a file
const http = require('http'); // HTTP server
const url = require('url');
const express = require('express')
const bodyParser = require('body-parser');
const app = express()
const port = 8080
app.use(bodyParser.urlencoded({ extended: true }));

// Create an HTTP server
``
app.get('/', (req, res) => {
    //res.writeHead(200, { 'Content-Type': 'text/html' });
    const filename = 'index.html'
    fs.readFile(filename, function(err, data) {
        if (err) {
            res.writeHead(404, {'Content-Type': 'text/html'});
            return res.end("404 Not Found");
        } 
        res.writeHead(200, {'Content-Type': 'text/html'});
        //res.write(filename);
        res.write(data);
        return res.end();
    });
        
});


app.post('/form.js', async (req, res) => {
    const { dname, birth_year, gender } = req.body;

    // Validate input
    if (!dname || !birth_year || !gender) {
        res.status(400).send("Missing required fields");
        return;
    }

    // PostgreSQL client configuration
    const client = new Client({
        host: "localhost",
        user: "postgres",
        port: 5432,
        password: "postgres",
        database: "dog_shelter"
    });

    try {
        await client.connect();
        console.log('Connected to PostgreSQL database');

        // Parameterized query
        const insertQuery = `INSERT INTO dogs (name, birth_year, gender) VALUES ($1, $2, $3)`;
        await client.query(insertQuery, [dname, birth_year, gender]);
        console.log("Dog added!");

        // Fetch all records
        const result = await client.query('SELECT * FROM dogs');
        const jsonResults = JSON.stringify(result.rows);
        console.log("JSON:", jsonResults);

        // Save JSON results to a file
        fs.writeFileSync('dogs.json', jsonResults);
        console.log('Data saved to dogs.json');

        // Send response
        res.status(200).send(`Dog added successfully!<br>Data:<br>${jsonResults}`);
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).send('Internal Server Error');
    } finally {
        await client.end();
        console.log('Connection to PostgreSQL closed');
    }
});


app.listen(port, () => {
    console.log(`Server running on port ${port}`)
  })

console.log(`Server running at http://localhost:${port}/`);
