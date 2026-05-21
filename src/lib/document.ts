const escapeHtml = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const splitIntoSentences = (text: string) =>
  text
    .replace(/\s+/g, " ")
    .trim()
    .match(/[^.!?]+[.!?]+|[^.!?]+$/g)
    ?.map((sentence) => sentence.trim())
    .filter(Boolean) ?? [];

export const formatCoverLetterForDisplay = (coverLetter: string) => {
  const cleaned = coverLetter
    .replace(/```[\s\S]*?```/g, "")
    .replace(/^(dear\s+[^,\n]+,?)\s*/i, "")
    .replace(/(sincerely|best regards|regards),?\s*[\s\S]*$/i, "")
    .trim();
  const sentences = splitIntoSentences(cleaned);

  return sentences.join("\n\n");
};

export const createCoverLetterDocBlob = (coverLetter: string) => {
  const lines = formatCoverLetterForDisplay(coverLetter).split("\n");
  const body = lines
    .map((line) => (line ? `<p>${escapeHtml(line)}</p>` : "<p>&nbsp;</p>"))
    .join("\n");
  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      body {
        font-family: Georgia, "Times New Roman", serif;
        color: #1f2937;
        line-height: 1.55;
        margin: 72px;
        font-size: 11.5pt;
      }
      p {
        margin: 0 0 10px;
      }
    </style>
  </head>
  <body>${body}</body>
</html>`;

  return new Blob([html], { type: "application/msword" });
};
