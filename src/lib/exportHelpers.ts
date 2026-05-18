// ============================================================
// Helpers d'export CSV et impression PDF — sans dépendance externe
// ============================================================

/** Convertit une matrice de strings en CSV correctement échappé (RFC 4180) */
export function arrayToCSV(rows: (string | number | null | undefined)[][]): string {
  return rows
    .map(row =>
      row
        .map(cell => {
          const s = String(cell ?? '');
          // Échapper si contient virgule, guillemet ou newline
          return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(',')
    )
    .join('\n');
}

/** Déclenche le téléchargement d'un fichier dans le navigateur */
export function downloadFile(content: string, filename: string, mime: string): void {
  const blob = new Blob(['﻿' + content], { type: mime + ';charset=utf-8;' }); // BOM pour Excel
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/** Ouvre une fenêtre d'impression — l'utilisateur choisit "Enregistrer en PDF" */
export function printPdf(htmlContent: string, title = 'SynchroniAI — Rapport'): void {
  const w = window.open('', '_blank', 'width=900,height=1000');
  if (!w) {
    alert("Veuillez autoriser les pop-ups pour télécharger le PDF.");
    return;
  }
  w.document.write(`<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>${title}</title>
<style>
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
    margin: 0; padding: 32px;
    color: #0F172A;
    line-height: 1.5;
    background: white;
  }
  h1 { font-size: 24px; margin: 0 0 4px; }
  h2 { font-size: 16px; margin: 24px 0 8px; color: #14B8A6; border-bottom: 2px solid #14B8A6; padding-bottom: 4px; }
  h3 { font-size: 13px; margin: 12px 0 4px; color: #64748B; text-transform: uppercase; letter-spacing: 0.05em; }
  p, li { font-size: 13px; }
  ul { padding-left: 18px; margin: 6px 0; }
  .pill { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; }
  .pill-teal  { background: #ECFDF5; color: #0F766E; }
  .pill-coral { background: #FFE4E6; color: #BE123C; }
  .pill-gray  { background: #F1F5F9; color: #475569; }
  .score-block { display: flex; align-items: center; gap: 16px; padding: 16px; background: #F8FAFC; border-radius: 12px; margin-bottom: 16px; }
  .score-big { font-size: 42px; font-weight: 800; color: #14B8A6; line-height: 1; }
  .dim { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed #E2E8F0; font-size: 12px; }
  .dim-val { font-weight: 700; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #E2E8F0; font-size: 10px; color: #94A3B8; text-align: center; }
  @media print {
    body { padding: 16px; }
    .no-print { display: none; }
  }
</style>
</head>
<body>
${htmlContent}
<div class="footer">SynchroniAI · Compte rendu généré le ${new Date().toLocaleDateString('fr-FR')} · Conforme AI Act</div>
<div class="no-print" style="position:fixed; top:20px; right:20px;">
  <button onclick="window.print()" style="background:#14B8A6;color:white;border:0;padding:10px 16px;border-radius:8px;font-weight:600;cursor:pointer;font-size:13px;">
    🖨 Imprimer / PDF
  </button>
</div>
<script>setTimeout(()=>window.print(), 500);</script>
</body>
</html>`);
  w.document.close();
}
