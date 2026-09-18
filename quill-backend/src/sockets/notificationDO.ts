export class NotificationDO {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.socket = null;
    this.timeoutId = null;
  }

  resetIdleTimer() {
    if (this.timeoutId) clearTimeout(this.timeoutId);
    this.timeoutId = setTimeout(
      () => {
        if (this.socket) this.socket.close();
      },
      5 * 60 * 1000
    ); // 5 min idle
  }

  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/connect") {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);
      server.accept();
      this.socket = server;
      this.resetIdleTimer();

      server.addEventListener("message", () => {
        this.resetIdleTimer(); // any activity pushes the timeout back
      });

      server.addEventListener("close", () => {
        this.socket = null;
        if (this.timeoutId) clearTimeout(this.timeoutId);
      });

      return new Response(null, { status: 101, webSocket: client });
    }

    if (url.pathname === "/notify") {
      const data = await request.json();
      if (this.socket) {
        this.socket.send(JSON.stringify(data));
      }
      return new Response("ok");
    }

    return new Response("Not found", { status: 404 });
  }
}
