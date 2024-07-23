const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const path = require('path');

const PYTHON_SCRIPT_PATH = '/Users/vishnuadithya/Documents/Movie-Site/backend/src/services/recommendationServices.py'

router.post('/', async (req, res, next) => {
    console.log('Received request for recommendations');
    console.log('Request body:', req.body);

    const { movieName, movieLanguage, yearGap, k } = req.body;

    if (!movieName || !movieLanguage) {
        console.log('Missing required fields');
        return res.status(400).json({ error: 'Movie name and language are required' });
    }

    try {
        console.log('Spawning Python process');
        console.log('Python script path:', PYTHON_SCRIPT_PATH);
        const pythonCommand = 'python3';
        const pythonProcess = spawn(pythonCommand, [
            PYTHON_SCRIPT_PATH,
            movieName,
            movieLanguage,
            yearGap || '',
            k ? k.toString() : '5'
        ]);

        let dataString = '';

        pythonProcess.stdout.on('data', (data) => {
            console.log('Received data from Python script:', data.toString());
            dataString += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            console.error(`Python script error: ${data}`);
        });

        pythonProcess.on('error', (error) => {
            console.error(`Error spawning Python process: ${error}`);
            res.status(500).json({ error: 'Failed to start Python process' });
        });

        pythonProcess.on('close', (code) => {
            console.log(`Python process exited with code ${code}`);
            if (code !== 0) {
                return res.status(500).json({ error: 'An error occurred while processing the recommendation' });
            }
            try {
                const recommendations = JSON.parse(dataString);
                console.log('Sending recommendations:', recommendations);
                res.json(recommendations);
            } catch (error) {
                console.error('Error parsing Python script output:', error);
                res.status(500).json({ error: 'An error occurred while processing the recommendation' });
            }
        });
    } catch (error) {
        console.error('Unexpected error:', error);
        next(error);
    }
});

module.exports = router;