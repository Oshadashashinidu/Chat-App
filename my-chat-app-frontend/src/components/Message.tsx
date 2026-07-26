import type { PublicMessage } from '../types';

interface MessageProps {
  message: PublicMessage;
}

function Message({ message }: MessageProps) {
  return (
    <li>
      <strong>{message.user}</strong>: {message.text}
    </li>
  );
}

export default Message;
