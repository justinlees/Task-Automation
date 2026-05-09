const axios = require('axios');
const Note = require('../models/Note');
const { evaluate } = require('mathjs');

/**
 * Perform a web search using the Serper API.
 * @param {string} query The search query.
 */
async function web_search(query) {
  try {
    if (!process.env.SERPER_API_KEY) {
      return "Error: SERPER_API_KEY is not configured.";
    }

    const response = await axios.post(
      'https://google.serper.dev/search',
      { q: query },
      {
        headers: {
          'X-API-KEY': process.env.SERPER_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    const data = response.data;
    let resultText = "";

    if (data.answerBox && data.answerBox.snippet) {
      resultText += `Answer Box: ${data.answerBox.snippet}\n\n`;
    }

    if (data.organic && data.organic.length > 0) {
      resultText += "Top Results:\n";
      data.organic.slice(0, 3).forEach((item, index) => {
        resultText += `${index + 1}. ${item.title}\n${item.snippet}\nLink: ${item.link}\n\n`;
      });
    }

    return resultText || "No relevant search results found.";
  } catch (error) {
    console.error("Web search error:", error.message);
    return `Error performing web search: ${error.message}`;
  }
}

/**
 * Save a note to the database.
 * @param {string} title The title of the note.
 * @param {string} content The content of the note.
 */
async function save_note(title, content) {
  try {
    const note = new Note({ title, content });
    await note.save();
    return `Successfully saved note: "${title}"`;
  } catch (error) {
    console.error("Save note error:", error.message);
    return `Error saving note: ${error.message}`;
  }
}

/**
 * Calculate a math expression using mathjs.
 * @param {string} expression The math expression.
 */
async function calculate(expression) {
  try {
    const result = evaluate(expression);
    return String(result);
  } catch (error) {
    console.error("Calculate error:", error.message);
    return `Error calculating expression: ${error.message}`;
  }
}

const toolDeclarations = [
  {
    name: "web_search",
    description: "Search the web for real-time information or answering questions.",
    parameters: {
      type: "OBJECT",
      properties: {
        query: {
          type: "STRING",
          description: "The search query to look up."
        }
      },
      required: ["query"]
    }
  },
  {
    name: "save_note",
    description: "Save a structured note to the database. Use this when the user asks to remember something or save information.",
    parameters: {
      type: "OBJECT",
      properties: {
        title: {
          type: "STRING",
          description: "The title of the note."
        },
        content: {
          type: "STRING",
          description: "The content of the note."
        }
      },
      required: ["title", "content"]
    }
  },
  {
    name: "calculate",
    description: "Calculate a mathematical expression.",
    parameters: {
      type: "OBJECT",
      properties: {
        expression: {
          type: "STRING",
          description: "The mathematical expression to evaluate (e.g. '2 + 2', '25 * 43')."
        }
      },
      required: ["expression"]
    }
  }
];

const executeTool = async (name, args) => {
  switch (name) {
    case 'web_search':
      return await web_search(args.query);
    case 'save_note':
      return await save_note(args.title, args.content);
    case 'calculate':
      return await calculate(args.expression);
    default:
      throw new Error(`Tool ${name} not found`);
  }
};

module.exports = {
  web_search,
  save_note,
  calculate,
  toolDeclarations,
  executeTool
};
