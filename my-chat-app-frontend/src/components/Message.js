function Message({ message }) {
  return (
    <li>
      <strong>{message.user}</strong>: {message.text}
    </li>
  );
}

export default Message;
