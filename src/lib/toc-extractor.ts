import { OpenAI } from "@llamaindex/openai";
import { logger } from "./logger";

export interface TOCSection {
    title: string;
    level: number; // 1 = h1/chapter, 2 = h2/section, 3 = h3/subsection, etc.
    startChar: number;
    endChar: number;
}

/**
 * Extracts Table of Contents from document content using LLM
 * @param content - The full document content
 * @returns Array of TOC sections with character positions
 */
export async function extractTOC(content: string): Promise<TOCSection[]> {
    try {
        // Truncate very large documents for TOC extraction
        const maxLength = 50000; // ~50k chars for TOC extraction
        const truncatedContent = content.length > maxLength
            ? content.substring(0, maxLength) + "\n\n[Content truncated for TOC extraction]"
            : content;

        const llm = new OpenAI({ model: "gpt-4o-mini" }); // Use mini for cost efficiency

        const prompt = `You are a document structure analyzer. Extract the table of contents from the following document.

Identify all major sections, subsections, and their hierarchical levels. For each section, provide:
1. title: The section title/heading
2. level: Hierarchical level (1 for main chapters/sections, 2 for subsections, 3 for sub-subsections, etc.)
3. startChar: Approximate character position where the section starts in the document
4. endChar: Approximate character position where the section ends (before next section or end of document)

Return ONLY a JSON array of objects with these fields. Do not include any markdown formatting or explanations.

If the document has no clear structure or sections, return an empty array [].

Document:
${truncatedContent}`;

        const response = await llm.complete({ prompt });
        const text = response.text;

        // Parse JSON response
        try {
            const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
            const sections: TOCSection[] = JSON.parse(jsonStr);

            // Validate and sanitize sections
            const validSections = sections.filter(s =>
                s.title &&
                typeof s.level === 'number' &&
                typeof s.startChar === 'number' &&
                typeof s.endChar === 'number' &&
                s.startChar >= 0 &&
                s.endChar > s.startChar &&
                s.endChar <= content.length
            );

            logger.info({
                totalSections: validSections.length,
                contentLength: content.length
            }, "TOC extracted successfully");

            return validSections;
        } catch (parseError) {
            logger.error({ error: parseError, text }, "Failed to parse TOC from LLM response");
            return []; // Return empty TOC on parse error
        }
    } catch (error) {
        logger.error({ error }, "Failed to extract TOC");
        return []; // Return empty TOC on error
    }
}

/**
 * Extracts content for a specific section based on TOC metadata
 * @param content - Full document content
 * @param section - TOC section metadata
 * @returns Section content
 */
export function extractSectionContent(content: string, section: TOCSection): string {
    return content.substring(section.startChar, section.endChar);
}

/**
 * Extracts content for multiple sections
 * @param content - Full document content
 * @param sections - Array of TOC sections
 * @returns Combined content from all sections
 */
export function extractMultipleSections(content: string, sections: TOCSection[]): string {
    return sections
        .map(section => extractSectionContent(content, section))
        .join("\n\n");
}
