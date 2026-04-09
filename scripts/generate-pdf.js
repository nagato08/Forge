#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

/**
 * Script de conversion Markdown → PDF
 * Utilise marked + puppeteer pour générer un PDF professionnel
 */

const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const puppeteer = require('puppeteer');

const args = process.argv.slice(2);
const mdFile = args[0] || 'RAPPORT_COMPLET.md';
const outputFile = args[1] || 'RAPPORT_COMPLET.pdf';

const mdPath = path.join(process.cwd(), mdFile);
const pdfPath = path.join(process.cwd(), outputFile);

async function generatePDF() {
  try {
    console.log(`📖 Lecture du fichier: ${mdFile}`);
    const markdown = fs.readFileSync(mdPath, 'utf-8');

    console.log(`🔄 Conversion Markdown → HTML`);
    const html = marked.parse(markdown);

    const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rapport Complet - Forge</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      background: white;
      padding: 40px;
      max-width: 900px;
      margin: 0 auto;
    }

    h1 {
      font-size: 2.5em;
      margin: 30px 0 15px 0;
      color: #1a1a1a;
      border-bottom: 3px solid #2F81F7;
      padding-bottom: 10px;
    }

    h2 {
      font-size: 1.8em;
      margin: 25px 0 12px 0;
      color: #0F172A;
      border-left: 4px solid #2F81F7;
      padding-left: 15px;
    }

    h3 {
      font-size: 1.4em;
      margin: 20px 0 10px 0;
      color: #2F81F7;
    }

    h4, h5, h6 {
      font-size: 1.1em;
      margin: 15px 0 8px 0;
      color: #444;
    }

    p {
      margin: 10px 0;
      text-align: justify;
    }

    ul, ol {
      margin: 15px 0 15px 30px;
    }

    li {
      margin: 8px 0;
    }

    code {
      background: #f4f4f4;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
      font-size: 0.9em;
      color: #d63384;
    }

    pre {
      background: #f8f9fa;
      border: 1px solid #dee2e6;
      border-radius: 5px;
      padding: 15px;
      margin: 15px 0;
      overflow-x: auto;
      font-family: 'Courier New', monospace;
      font-size: 0.85em;
      line-height: 1.4;
    }

    pre code {
      background: none;
      padding: 0;
      color: #333;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
    }

    th, td {
      border: 1px solid #ddd;
      padding: 12px;
      text-align: left;
    }

    th {
      background: #2F81F7;
      color: white;
      font-weight: bold;
    }

    tr:nth-child(even) {
      background: #f9f9f9;
    }

    blockquote {
      border-left: 4px solid #2F81F7;
      padding: 10px 15px;
      margin: 15px 0;
      background: #f0f5ff;
      font-style: italic;
    }

    a {
      color: #2F81F7;
      text-decoration: none;
    }

    a:hover {
      text-decoration: underline;
    }

    strong {
      color: #0F172A;
      font-weight: 600;
    }

    hr {
      border: none;
      height: 2px;
      background: #2F81F7;
      margin: 30px 0;
    }

    /* Page break */
    @page {
      margin: 2cm;
      size: A4;
    }

    @media print {
      h1, h2 {
        page-break-after: avoid;
      }
      pre, table {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  ${html}
</body>
</html>
    `;

    console.log(`🖨️  Génération du PDF avec Puppeteer...`);
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    await page.pdf({
      path: pdfPath,
      format: 'A4',
      margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
      printBackground: true,
    });

    await browser.close();

    const fileSize = (fs.statSync(pdfPath).size / 1024).toFixed(2);
    console.log(`✅ PDF généré avec succès!`);
    console.log(`📄 Fichier: ${outputFile} (${fileSize} KB)`);
    console.log(`📍 Chemin: ${pdfPath}`);

  } catch (error) {
    console.error(`❌ Erreur lors de la génération du PDF:`, error.message);
    process.exit(1);
  }
}

generatePDF();
