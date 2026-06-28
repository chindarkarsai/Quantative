import json
import re
from collections import Counter, defaultdict
from pathlib import Path

from pypdf import PdfReader


PDFS = [
    r"C:\Users\chind\OneDrive\Desktop\ibps 2022 mains.pdf",
    r"C:\Users\chind\OneDrive\Desktop\ibps 2023 mains.pdf",
    r"C:\Users\chind\OneDrive\Desktop\ibps 2022 pre 1s.pdf",
    r"C:\Users\chind\OneDrive\Desktop\ibps 2023 pre.pdf",
    r"C:\Users\chind\OneDrive\Desktop\ibps pre 2024 1s.pdf",
    r"C:\Users\chind\OneDrive\Desktop\ibps pre 2025 1s.pdf",
    r"C:\Users\chind\OneDrive\Desktop\ibps 2022 pre 3s.pdf",
    r"C:\Users\chind\OneDrive\Desktop\ibps 2022 pre 4s.pdf",
    r"C:\Users\chind\OneDrive\Desktop\ibps 2024 mains 2.pdf",
    r"C:\Users\chind\OneDrive\Desktop\ibps 2025 mains eng 1s.pdf",
    r"C:\Users\chind\OneDrive\Desktop\ibps 2025 mains quant 1s.pdf",
    r"C:\Users\chind\OneDrive\Desktop\ibps 2025 mains reasoning 1s.pdf",
    r"C:\Users\chind\OneDrive\Desktop\ibps 2022 pre 2s.pdf",
    r"C:\Users\chind\OneDrive\Desktop\ibps 2024 mains.pdf",
    r"C:\Users\chind\OneDrive\Desktop\ibps pre 2025 2s.pdf",
    r"C:\Users\chind\CrossDevice\saichindarkar\storage\Recycle bin - Connected device\IBPS Clerk Prelims Memory Based Paper (Held On_ 04 Oct, 2025 Shift 1).pdf",
    r"C:\Users\chind\CrossDevice\saichindarkar\storage\Recycle bin - Connected device\IBPS Clerk Prelims Memory Based Paper (Held On_ 04 Oct, 2025 Shift 2) (1).pdf",
    r"C:\Users\chind\CrossDevice\saichindarkar\storage\Recycle bin - Connected device\IBPS Clerk Prelims Memory Based Paper (Held On_ 04 Oct, 2025 Shift 2).pdf",
    r"C:\Users\chind\CrossDevice\saichindarkar\storage\Recycle bin - Connected device\IBPS Clerk Syllabus 2026, Check Prelims and Mains Exam Pattern.pdf",
    r"C:\Users\chind\CrossDevice\saichindarkar\storage\Recycle bin - Connected device\IBPS_Clerk_Bharti_2024_CRP_Clerks_XIV.pdf",
    r"C:\Users\chind\CrossDevice\saichindarkar\storage\Recycle bin - Connected device\IBPS-Clerk-Pre-2025-Memory-Based-Paper-Based-on-4-Oct-1st-Shift.pdf",
]


TOPIC_PATTERNS = {
    "Simplification / Approximation": [
        r"\bsimplif", r"\bapprox", r"value of", r"nearest", r"\bbodmas\b", r"calculate"
    ],
    "Quadratic Equations": [
        r"quadratic", r"equations?", r"relationship between x and y", r"\bx\s*[<>=>]", r"\by\s*[<>=>]"
    ],
    "Number Series / Missing Number": [
        r"series", r"missing number", r"wrong number", r"next number", r"replaces?\s+\?"
    ],
    "Ratio and Proportion": [
        r"ratio", r"proportion", r"partnership", r"share"
    ],
    "Percentage": [
        r"percentage", r"percent", r"%", r"increase", r"decrease"
    ],
    "Profit and Loss": [
        r"profit", r"loss", r"marked price", r"selling price", r"cost price", r"discount"
    ],
    "Simple / Compound Interest": [
        r"simple interest", r"compound interest", r"\binterest\b", r"rate per annum", r"per annum"
    ],
    "Average and Ages": [
        r"average", r"ages?", r"years? ago", r"after \d+ years?"
    ],
    "Mixture and Alligation": [
        r"mixture", r"alligation", r"milk", r"water", r"solution", r"litres?"
    ],
    "Time and Work": [
        r"time and work", r"work", r"complete", r"efficien", r"days?", r"men", r"workers?"
    ],
    "Speed, Time and Distance": [
        r"speed", r"distance", r"train", r"km/h", r"metres?", r"hours?"
    ],
    "Boats and Streams": [
        r"boat", r"stream", r"upstream", r"downstream", r"still water"
    ],
    "Pipes and Cisterns": [
        r"pipe", r"cistern", r"tank", r"fill", r"empty"
    ],
    "Mensuration": [
        r"area", r"volume", r"perimeter", r"radius", r"circle", r"rectangle", r"cylinder", r"cuboid"
    ],
    "Probability": [
        r"probability", r"balls?", r"cards?", r"dice", r"random"
    ],
    "Permutation and Combination": [
        r"permutation", r"combination", r"\bnpr\b", r"\bncr\b", r"arrangements?", r"ways?"
    ],
    "Data Interpretation - Tabular": [
        r"table", r"tabular", r"given table", r"following table"
    ],
    "Data Interpretation - Line Graph": [
        r"line graph", r"line chart"
    ],
    "Data Interpretation - Bar Graph": [
        r"bar graph", r"bar chart"
    ],
    "Data Interpretation - Caselet / Paragraph": [
        r"caselet", r"study the following information", r"given below", r"paragraph"
    ],
    "Data Interpretation - Missing DI": [
        r"missing", r"not given", r"cannot be determined"
    ],
    "Reasoning": [
        r"puzzle", r"seating", r"syllogism", r"blood relation", r"direction", r"coding", r"inequality"
    ],
    "English": [
        r"reading comprehension", r"cloze", r"sentence", r"phrase", r"vocabulary", r"grammar"
    ],
}


SECTION_PATTERNS = {
    "Quantitative Aptitude": [r"quantitative aptitude", r"quant", r"numerical ability"],
    "Reasoning Ability": [r"reasoning ability", r"reasoning"],
    "English Language": [r"english language", r"english"],
    "General / Financial Awareness": [r"general awareness", r"financial awareness", r"banking awareness"],
    "Computer Aptitude": [r"computer aptitude", r"computer knowledge"],
}


def safe_name(path):
    return re.sub(r"[^A-Za-z0-9._-]+", "_", Path(path).stem).strip("_")


def classify_text(text, pattern_map):
    lowered = text.lower()
    scores = {}
    for topic, patterns in pattern_map.items():
        count = 0
        for pattern in patterns:
            count += len(re.findall(pattern, lowered, flags=re.I))
        scores[topic] = count
    return scores


def question_marker_count(text):
    patterns = [
        r"(?im)^\s*q(?:uestion)?\.?\s*\d+",
        r"(?im)^\s*\d{1,3}[\).]\s+",
        r"(?i)\bDirections?\s*[:.-]",
    ]
    return sum(len(re.findall(pattern, text)) for pattern in patterns)


def exam_meta(name):
    lowered = name.lower()
    year = re.search(r"20\d{2}", lowered)
    if "main" in lowered:
        stage = "Mains"
    elif "pre" in lowered:
        stage = "Prelims"
    else:
        stage = "Unknown"
    if "quant" in lowered:
        section = "Quantitative Aptitude"
    elif "reasoning" in lowered:
        section = "Reasoning Ability"
    elif "eng" in lowered or "english" in lowered:
        section = "English Language"
    else:
        section = "Mixed / Full Paper"
    return {
        "year": year.group(0) if year else "Unknown",
        "stage": stage,
        "section_hint": section,
    }


def representative_lines(text, topic_patterns, limit=4):
    lines = [re.sub(r"\s+", " ", line).strip() for line in text.splitlines()]
    lines = [line for line in lines if 45 <= len(line) <= 220]
    results = defaultdict(list)
    for topic, patterns in topic_patterns.items():
        for line in lines:
            if len(results[topic]) >= limit:
                break
            if any(re.search(pattern, line, flags=re.I) for pattern in patterns):
                results[topic].append(line)
    return dict(results)


def main():
    out_dir = Path("work/pdf_analysis")
    text_dir = out_dir / "extracted_text"
    out_dir.mkdir(parents=True, exist_ok=True)
    text_dir.mkdir(parents=True, exist_ok=True)

    docs = []
    missing = []
    total_topic_counts = Counter()
    total_section_counts = Counter()
    all_representatives = defaultdict(list)

    for raw_path in PDFS:
      path = Path(raw_path)
      if not path.exists():
          missing.append(raw_path)
          continue
      record = {
          "path": raw_path,
          "file": path.name,
          "meta": exam_meta(path.name),
          "pages": 0,
          "characters": 0,
          "words": 0,
          "question_markers": 0,
          "topics": {},
          "sections": {},
          "error": None,
      }
      try:
          reader = PdfReader(str(path))
          record["pages"] = len(reader.pages)
          chunks = []
          for page_number, page in enumerate(reader.pages, start=1):
              try:
                  page_text = page.extract_text() or ""
              except Exception as exc:
                  page_text = f"\n[Page {page_number} extraction failed: {exc}]\n"
              chunks.append(page_text)
          text = "\n".join(chunks)
          (text_dir / f"{safe_name(raw_path)}.txt").write_text(text, encoding="utf-8", errors="replace")
          record["characters"] = len(text)
          record["words"] = len(re.findall(r"\w+", text))
          record["question_markers"] = question_marker_count(text)
          topic_scores = classify_text(text, TOPIC_PATTERNS)
          section_scores = classify_text(text, SECTION_PATTERNS)
          record["topics"] = {k: v for k, v in topic_scores.items() if v}
          record["sections"] = {k: v for k, v in section_scores.items() if v}
          total_topic_counts.update(record["topics"])
          total_section_counts.update(record["sections"])
          reps = representative_lines(text, TOPIC_PATTERNS, limit=2)
          for topic, lines in reps.items():
              all_representatives[topic].extend(lines)
      except Exception as exc:
          record["error"] = str(exc)
      docs.append(record)

    summary = {
        "analyzed_pdf_count": len(docs),
        "missing_pdf_count": len(missing),
        "missing_pdfs": missing,
        "documents": docs,
        "aggregate_topics": total_topic_counts.most_common(),
        "aggregate_sections": total_section_counts.most_common(),
        "representative_lines": {
            topic: lines[:5] for topic, lines in all_representatives.items() if lines
        },
    }
    (out_dir / "ibps_pdf_analysis.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")

    markdown = []
    markdown.append("# IBPS PDF Analysis\n")
    markdown.append(f"Analyzed PDFs: **{len(docs)}**  \nMissing PDFs: **{len(missing)}**\n")
    markdown.append("## Aggregate Topic Signals\n")
    for topic, count in total_topic_counts.most_common():
        markdown.append(f"- {topic}: {count}")
    markdown.append("\n## Documents\n")
    for doc in docs:
        markdown.append(f"### {doc['file']}")
        markdown.append(f"- Stage: {doc['meta']['stage']}; year: {doc['meta']['year']}; section hint: {doc['meta']['section_hint']}")
        markdown.append(f"- Pages: {doc['pages']}; extracted words: {doc['words']}; question markers/direction cues: {doc['question_markers']}")
        top_topics = sorted(doc["topics"].items(), key=lambda item: item[1], reverse=True)[:8]
        if top_topics:
            markdown.append("- Strongest topic signals: " + ", ".join(f"{name} ({count})" for name, count in top_topics))
        if doc["error"]:
            markdown.append(f"- Extraction error: {doc['error']}")
        markdown.append("")
    if missing:
        markdown.append("## Missing Files\n")
        for path in missing:
            markdown.append(f"- {path}")
    (out_dir / "ibps_pdf_analysis.md").write_text("\n".join(markdown), encoding="utf-8")

    print(json.dumps({
        "analyzed": len(docs),
        "missing": len(missing),
        "report": str(out_dir / "ibps_pdf_analysis.md"),
        "json": str(out_dir / "ibps_pdf_analysis.json"),
        "top_topics": total_topic_counts.most_common(10),
    }, indent=2))


if __name__ == "__main__":
    main()
