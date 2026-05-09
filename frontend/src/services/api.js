export const API_URL = 'http://localhost:5000/api';

export const fetchConversations = async () => {
  const res = await fetch(`${API_URL}/chat/conversations`);
  return res.json();
};

export const fetchConversation = async (id) => {
  const res = await fetch(`${API_URL}/chat/conversations/${id}`);
  return res.json();
};

export const fetchNotes = async () => {
  const res = await fetch(`${API_URL}/notes`);
  return res.json();
};
