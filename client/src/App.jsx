import { useEffect, useState, useRef } from "react";
import { joinRoom, sendSocketMessage } from "./network/chat.api.js";
import { socket } from "./network/chat.api.js";

function App() {
	const [messages, setMessages] = useState([]);
	const [typing, setTyping] = useState(false);
	const [typingUserId, setTypingUserId] = useState(null);
	const input = useRef();
	const currentRoom = useRef("general");

	useEffect(() => {
		socket.on("server-msg", (data) => {
			setMessages((messages) => [...messages, data.message]);
		});

		socket.on("user_is_typing", ({ userId }) => {
			if (userId !== socket.id) {
				setTyping(true);
				setTypingUserId(userId);
			}
		});

		socket.on("user_stopped_typing", ({ userId }) => {
			if (userId === typingUserId) {
				setTyping(false);
				setTypingUserId(null);
			}
		});

		return () => {
			socket.off("server-msg");
			socket.off("user_is_typing");
			socket.off("user_stopped_typing");
		};
	}, [typingUserId]);

	const handleKeyDown = () => {
		clearTimeout(window.typingTimeout);
		socket.emit("typing", {
			id: socket.id,
			room: currentRoom.current,
		});
		window.typingTimeout = setTimeout(() => {
			socket.emit("stopped-typing", {
				id: socket.id,
				room: currentRoom.current,
			});
		}, 2000);
	};

	const onSubmit = async (event) => {
		event.preventDefault();
		await sendSocketMessage(input.current.value, currentRoom.current);
		input.current.value = "";
	};

	const onChannelsClick = (event) => {
		currentRoom.current = event.target.dataset.room;
		joinRoom(event.target.dataset.room);
	};

	return (
		<div className="main">
			{typing && typingUserId !== socket.id && (
				<div className="show-typing">{`User ${typingUserId} is typing...`}</div>
			)}
			<form className="write-form" onSubmit={onSubmit}>
				<textarea
					className="output"
					readOnly
					value={messages.join("\n")}
				></textarea>
				<div className="bottom-box">
					<input
						ref={input}
						placeholder="Write a message..."
						className="input"
						onKeyDown={handleKeyDown}
					/>
					<button type="submit">Send</button>
				</div>
			</form>
			<div className="channels" onClick={onChannelsClick}>
				<button className="channel" data-room="news">
					News
				</button>
				<button className="channel" data-room="random">
					Random
				</button>
				<button className="channel" data-room="tech">
					Tech
				</button>
			</div>
		</div>
	);
}

export default App;
