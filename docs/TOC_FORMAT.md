# Table of Contents (TOC) Format

## Overview
The TOC (Table of Contents) is stored as a JSONB array in the `documents.toc` column. Each section in the TOC represents a hierarchical part of the document with character position markers for content extraction.

## JSON Structure

```json
[
  {
    "title": "Introduction",
    "level": 1,
    "startChar": 0,
    "endChar": 1250
  },
  {
    "title": "Background",
    "level": 2,
    "startChar": 1250,
    "endChar": 3500
  },
  {
    "title": "Related Work",
    "level": 2,
    "startChar": 3500,
    "endChar": 5800
  },
  {
    "title": "Methodology",
    "level": 1,
    "startChar": 5800,
    "endChar": 12000
  }
]
```

## Field Descriptions

### `title` (string, required)
- The section heading/title
- Example: "Introduction", "Chapter 1: Getting Started", "3.2 Data Analysis"

### `level` (number, required)
- Hierarchical level of the section
- `1` = Main chapter/section (h1)
- `2` = Subsection (h2)
- `3` = Sub-subsection (h3)
- And so on...

### `startChar` (number, required)
- Character position where the section starts in the document
- 0-indexed
- Must be >= 0

### `endChar` (number, required)
- Character position where the section ends in the document
- Must be > startChar
- Must be <= document content length

## TOC Modes

### 1. Skip (Default)
- No TOC is extracted or stored
- `toc` field will be `null`
- Fastest upload time

### 2. Auto (LLM Extraction)
- TOC is automatically extracted using LLM during upload
- Adds 2-5 seconds to upload time
- Works best with structured documents (papers, textbooks, reports)
- May return empty array for unstructured documents

### 3. Manual
- User provides pre-formatted TOC JSON
- Must follow the structure above
- Instant upload (no LLM processing)
- Useful when you already have document structure metadata

## Usage Examples

### Manual TOC for a Research Paper
```json
[
  {
    "title": "Abstract",
    "level": 1,
    "startChar": 0,
    "endChar": 450
  },
  {
    "title": "1. Introduction",
    "level": 1,
    "startChar": 450,
    "endChar": 2300
  },
  {
    "title": "1.1 Motivation",
    "level": 2,
    "startChar": 2300,
    "endChar": 3500
  },
  {
    "title": "1.2 Contributions",
    "level": 2,
    "startChar": 3500,
    "endChar": 4200
  },
  {
    "title": "2. Related Work",
    "level": 1,
    "startChar": 4200,
    "endChar": 7800
  }
]
```

### Manual TOC for a Book Chapter
```json
[
  {
    "title": "Chapter 5: Machine Learning Basics",
    "level": 1,
    "startChar": 0,
    "endChar": 25000
  },
  {
    "title": "5.1 Supervised Learning",
    "level": 2,
    "startChar": 500,
    "endChar": 8000
  },
  {
    "title": "5.1.1 Classification",
    "level": 3,
    "startChar": 1200,
    "endChar": 4500
  },
  {
    "title": "5.1.2 Regression",
    "level": 3,
    "startChar": 4500,
    "endChar": 8000
  },
  {
    "title": "5.2 Unsupervised Learning",
    "level": 2,
    "startChar": 8000,
    "endChar": 15000
  }
]
```

## Validation Rules

When providing manual TOC, ensure:
1. All required fields are present
2. `level` is a positive integer
3. `startChar` >= 0
4. `endChar` > `startChar`
5. `endChar` <= document content length
6. Sections don't overlap (optional but recommended)
7. Sections are in order by `startChar` (optional but recommended)
