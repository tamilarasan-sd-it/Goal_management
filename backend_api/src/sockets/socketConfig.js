import { Server } from 'socket.io'; // import Server class from socket io package

const socketsConfig = (server) => {
    const io = new Server(server, { // pass constructor to Server class 
        transports: ['websocket', 'polling'],
        credentials: true,
        cors: {
            origin: "*",
            methods: ["GET", "POST", "PUT"]
        }
    });

    io.on('connection', (socket) => {
        console.log('A user connected');

        socket.on('message', (message) => {
            console.log(`Message from ${socket.id}: ${message}`);
        });

        socket.on('disconnect', () => {
            console.log(`Socket ${socket.id} disconnected`);
        });
    });

    return io;
};

export { socketsConfig };
