import pypdf

try:
    reader = pypdf.PdfReader("Team Manthan.pdf")
    text = ""
    for page in reader.pages:
        text += page.extract_text() + "\n"
    with open("pdf_content.txt", "w", encoding="utf-8") as f:
        f.write(text)
    print("PDF content written to pdf_content.txt")
except Exception as e:
    print(f"Error reading PDF: {e}")
