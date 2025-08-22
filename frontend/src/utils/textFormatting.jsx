import React from "react";

// Utility function to format text for display (without JSX)
export const formatTextForDisplay = (text) => {
  if (!text) return "";

  let formattedText = text.toString();

  // Handle the specific format: content='...' additional_kwargs={} response_metadata=...
  const contentMatch = formattedText.match(
    /content='(.*?)'\s+additional_kwargs/s
  );
  if (contentMatch) {
    formattedText = contentMatch[1];
  } else {
    // Fallback: Extract content from content='...' pattern
    const simpleContentMatch = formattedText.match(
      /content='([^']*(?:\\.[^']*)*)'/s
    );
    if (simpleContentMatch) {
      formattedText = simpleContentMatch[1];
    } else {
      // Fallback: Extract content from content="..." pattern
      const contentMatchDouble = formattedText.match(
        /content="([^"]*(?:\\.[^"]*)*)"/s
      );
      if (contentMatchDouble) {
        formattedText = contentMatchDouble[1];
      }
    }
  }

  // Clean up formatting and escaped characters
  formattedText = formattedText
    // Replace escaped newlines with actual newlines
    .replace(/\\n/g, "\n")
    // Replace escaped quotes
    .replace(/\\'/g, "'")
    .replace(/\\"/g, '"')
    // Remove extra whitespace and clean formatting
    .replace(/\s+/g, " ")
    .trim();

  return (
    formattedText
      // Ensure proper line breaks
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .join("\n")
  );
};

// Utility function to render formatted text as JSX
export const renderFormattedText = (text) => {
  if (!text) return null;

  const formattedText = formatTextForDisplay(text);

  return formattedText.split("\n").map((line, index) => {
    // Handle HTML tags
    if (line.includes("<strong>") || line.includes("<em>")) {
      return (
        <p
          key={index}
          className="mb-2"
          dangerouslySetInnerHTML={{ __html: line }}
        />
      );
    }

    // Handle bullet points
    if (line.startsWith("• ")) {
      return (
        <p key={index} className="mb-1 ml-4">
          {line}
        </p>
      );
    }

    // Regular paragraphs
    return (
      <p key={index} className="mb-2">
        {line}
      </p>
    );
  });
};
