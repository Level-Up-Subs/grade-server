import express, { json } from 'express';
import rateLimit from 'express-rate-limit';
import { spawn } from 'node:child_process';


const app = express();
const port = 3000; // You can change the port as needed

// Middleware to parse JSON body
app.use(json());

// Rate limiting middleware
const limiter = rateLimit({
    windowMs: 60 * 1000 * 10, // 10 minute
    max: 1, // Max 1 requests per minute per IP
    message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Route to handle incoming API requests from Shopify website
app.post('/fetch-grades', (req, res) => {
    // Extract necessary information from the request
    const { dataToPass } = req.body;

    const submission_number = '11953599';
    const order_number = '23853388';

    // Run the Python script
    const grade_fetcher = spawn('python3', ['../grade-fetcher/src/v2/main.py', submission_number, order_number]);

    // Handle script output
    grade_fetcher.stdout.on('data', (data) => {
        console.log(`Python script stdout: ${data}`);
    });

    grade_fetcher.stderr.on('data', (data) => {
        console.error(`Python script stderr: ${data}`);
    });

    grade_fetcher.on('close', (code) => {
        console.log(`Python script process exited with code ${code}`);

        // Respond to the request with appropriate status code
        if (code === 0) {
            res.status(200).send('Processing completed successfully.');
        } else {
            res.status(500).send('An error occurred during processing.');
        }
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});