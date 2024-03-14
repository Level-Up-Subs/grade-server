import express, { json } from 'express';
import rateLimit from 'express-rate-limit';
import { spawn } from 'node:child_process';
import fs from 'fs';

const app = express();
const port = 3000; // You can change the port as needed

// Middleware to parse JSON body
app.use(json());

// Object to store IP addresses and request counts
let ipAddresses = {};

// Load IP addresses and request counts from a file
const loadIPAddressesFromFile = () => {
    try {
        const data = fs.readFileSync('ipAddresses.json');
        ipAddresses = JSON.parse(data);
    } catch (error) {
        console.error('Error loading IP addresses from file:', error);
    }
};

// Save IP addresses and request counts to a file
const saveIPAddressesToFile = () => {
    try {
        fs.writeFileSync('ipAddresses.json', JSON.stringify(ipAddresses));
    } catch (error) {
        console.error('Error saving IP addresses to file:', error);
    }
};

// Load IP addresses from file when the server starts
loadIPAddressesFromFile();

// Rate limiting middleware
const limiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Max 10 requests per hour per IP
    message: 'Too many requests from this IP, please try again later.',
    onLimitReached: (req, res, options) => {
        const ipAddress = req.ip;
        ipAddresses[ipAddress] = ipAddresses[ipAddress] || { count: 0, lastRequestTime: new Date().getTime() };

        // If the request limit is exceeded, add the IP address to the blocklist
        if (ipAddresses[ipAddress].count >= options.max) {
            console.log(`Blocking IP address ${ipAddress} due to excessive requests.`);
            ipAddresses[ipAddress].blocked = true;
        }
    }
});

// Middleware to reset request counts for IP addresses after an hour
const resetRequestCounts = (req, res, next) => {
    const currentTime = new Date().getTime();
    Object.keys(ipAddresses).forEach(ip => {
        if (currentTime - ipAddresses[ip].lastRequestTime > 60 * 60 * 1000) {
            delete ipAddresses[ip];
        }
    });
    next();
};

app.use(resetRequestCounts);

// Route to handle incoming API requests from Shopify website
app.post('/fetch-grades', limiter, (req, res) => {
    const ipAddress = req.ip;

    // Check if the IP address is in the blocklist
    if (ipAddresses[ipAddress] && ipAddresses[ipAddress].blocked) {
        return res.status(403).send('Your IP address has been blocked due to excessive requests.');
    }

    // Increment request count for the IP address
    ipAddresses[ipAddress] = ipAddresses[ipAddress] || { count: 0, lastRequestTime: new Date().getTime() };
    ipAddresses[ipAddress].count++;

    // Run the Python script
    const gradeFetcher = spawn('../grade-fetcher/src/v2/env/bin/python3', ['../grade-fetcher/src/v2/main.py', submissionNumber, orderNumber]);

    // Handle script output
    gradeFetcher.stdout.on('data', (data) => {
        console.log(`Python script stdout: ${data}`);
    });

    gradeFetcher.stderr.on('data', (data) => {
        console.error(`Python script stderr: ${data}`);
    });

    gradeFetcher.on('close', (code) => {
        console.log(`Python script process exited with code ${code}`);

        // Respond to the request with appropriate status code
        if (code === 0) {
            res.status(200).send('Processing completed successfully.');
        } else {
            res.status(500).send('An error occurred during processing.');
        }
    });

    // Save IP addresses to file after each request
    saveIPAddressesToFile();
});

// Start the server
app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});

// Save IP addresses to file periodically (every hour)
setInterval(saveIPAddressesToFile, 60 * 60 * 1000);
