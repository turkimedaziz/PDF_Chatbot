const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const pdfParse = require('pdf-parse');
const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' })); // Increase size limit for PDFs

// Route to handle chat request
app.post('/api/chat', async (req, res) => {
  try {
    const { prompt, pdf } = req.body;

    if (!prompt || !pdf) {
      return res.status(400).json({ error: 'Prompt and PDF data are required' });
    }

    // Convert base64 PDF to binary
    const pdfBuffer = Buffer.from(pdf, 'base64');

    // Extract text from the PDF
    const data = await pdfParse(pdfBuffer);
    const extractedText = data.text;

    // Construct message to send to Ollama
    const fullPrompt = `Here is the PDF content:\n\n${extractedText}\n\nAnswer this question based on the document:\n${prompt}`;

    // Call local Ollama server (assumes Ollama running locally on port 11434)
    const ollamaResponse = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.2', // replace with the model name you pulled (e.g., llama3, mistral, etc.)
        prompt: fullPrompt,
        stream: false
      })
    });

    if (!ollamaResponse.ok) {
      throw new Error('Failed to communicate with Ollama');
    }

    const responseData = await ollamaResponse.json();
    const answer = responseData.response;

    // Send back the answer
    res.json({ response: answer });

  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`✅ Backend running at http://localhost:${port}`);
});
