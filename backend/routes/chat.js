const express = require('express');
const router = express.Router();
const Conversation = require('../models/Conversation');
const { GoogleGenAI } = require('@google/genai');
const { toolDeclarations, executeTool } = require('../tools');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

router.post('/', async (req, res) => {
  const { conversationId, message } = req.body;

  // Set up SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const sendEvent = (type, data) => {
    res.write(`data: ${JSON.stringify({ type, ...data })}\n\n`);
  };

  try {
    let conversation;
    if (conversationId) {
      conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        throw new Error('Conversation not found');
      }
    } else {
      conversation = new Conversation({
        title: message.substring(0, 30) + '...',
        messages: []
      });
    }

    // Add user message
    conversation.messages.push({
      role: 'user',
      content: message
    });

    // We only need to send the recent messages to the model. 
    // Format them for the Gemini SDK.
    const history = conversation.messages.map(msg => {
      if (msg.role === 'user') {
        return { role: 'user', parts: [{ text: msg.content }] };
      } else if (msg.role === 'model') {
        if (msg.toolCalls && msg.toolCalls.length > 0) {
          return { role: 'model', parts: msg.toolCalls.map(tc => ({ functionCall: { name: tc.name, args: tc.args } })) };
        } else {
          return { role: 'model', parts: [{ text: msg.content }] };
        }
      } else if (msg.role === 'system' || msg.role === 'tool') { // Map 'system' tool result to 'user' role with functionResponse for new SDK
        return { role: 'user', parts: msg.toolResults.map(tr => ({ functionResponse: { name: tr.name, response: { result: tr.result } } })) };
      }
      return null;
    }).filter(Boolean);

    let isAgentDone = false;
    let currentHistory = [...history];

    while (!isAgentDone) {
      sendEvent('thinking', { status: 'thinking' });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: currentHistory,
        config: {
          tools: [{ functionDeclarations: toolDeclarations }],
        }
      });

      const responseMessage = response.candidates[0].content;
      const parts = responseMessage.parts;
      
      const functionCalls = parts.filter(part => part.functionCall);
      const textParts = parts.filter(part => part.text);

      if (functionCalls.length > 0) {
        const dbToolCalls = [];
        const dbToolResults = [];
        const modelParts = [];
        const toolResponseParts = [];

        for (const call of functionCalls) {
          const fnName = call.functionCall.name;
          const fnArgs = call.functionCall.args;
          
          sendEvent('tool_call', { tool: fnName, args: fnArgs });
          
          dbToolCalls.push({ name: fnName, args: fnArgs });
          modelParts.push({ functionCall: { name: fnName, args: fnArgs } });

          // Execute the tool
          const result = await executeTool(fnName, fnArgs);
          
          sendEvent('tool_result', { tool: fnName, result });
          
          dbToolResults.push({ name: fnName, result });
          toolResponseParts.push({ functionResponse: { name: fnName, response: { result } } });
        }

        // Save tool call message to db
        conversation.messages.push({
          role: 'model',
          toolCalls: dbToolCalls
        });
        
        // Save tool result message to db
        conversation.messages.push({
          role: 'system', // saving as system/tool role
          toolResults: dbToolResults
        });

        // Update history for next iteration
        currentHistory.push({ role: 'model', parts: modelParts });
        currentHistory.push({ role: 'user', parts: toolResponseParts });

      } else if (textParts.length > 0) {
        const finalContent = textParts.map(p => p.text).join('\\n');
        
        sendEvent('text', { content: finalContent });
        
        conversation.messages.push({
          role: 'model',
          content: finalContent
        });

        isAgentDone = true;
      } else {
        // Fallback
        isAgentDone = true;
      }
    }

    await conversation.save();
    sendEvent('done', { conversationId: conversation._id });

  } catch (error) {
    console.error("Chat Error:", error);
    sendEvent('error', { message: error.message });
  } finally {
    res.end();
  }
});

router.get('/conversations', async (req, res) => {
  try {
    const convos = await Conversation.find().sort({ updatedAt: -1 }).select('title updatedAt');
    res.json(convos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/conversations/:id', async (req, res) => {
  try {
    const convo = await Conversation.findById(req.params.id);
    res.json(convo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
