const socket = io();

const form = document.getElementById('chat-form');
const messagesEl = document.getElementById('messages');
const userInput = document.getElementById('user');
const textInput = document.getElementById('text');

function appendMessage(message) {
  const li = document.createElement('li');
  li.textContent = `${message.user}: ${message.text}`;
  messagesEl.appendChild(li);
}

socket.on('chat:history', (history) => {
  messagesEl.innerHTML = '';
  history.forEach(appendMessage);
});

socket.on('chat:message', appendMessage);

form.addEventListener('submit', (event) => {
  event.preventDefault();

  socket.emit('chat:message', {
    user: userInput.value || 'Anonymous',
    text: textInput.value
  });

  textInput.value = '';
});
