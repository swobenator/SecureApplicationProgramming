const express = require("express");
const path = require("path");
require('dotenv').config();

const { initializeDatabase } = require('./src/database/database');
const authRoutes = require('./src/routes/auth')

const app = express();
const PORT = process.env.PORT || 3000;

//parse the incoming request data
app.use(express.urlencoded({extended:false}));
app.use(express.json());

app.use('/api/auth', authRoutes);

app.use(express.static(path.join(__dirname, 'public')));


app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'SecureBlog server is running'
    })
})

//Initialise the database before starting the server
async function startServer() {
    try {
        await initializeDatabase();

        app.listen(PORT, () => {
            console.log(`SecureBlog running at http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Failed to initialise database:', error.message);
        process.exit(1);
    }
}

startServer();