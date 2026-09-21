interface Ticket {
  value: string;
  expiresAt: number;
}

export class NotificationDO {
  state: DurableObjectState;
  env: unknown;
  socket: WebSocket | null;
  timeoutId: number | null;
  pendingTicket: Ticket | null;
  constructor(state: DurableObjectState, env: unknown) {
    this.state = state;
    this.env = env;
    this.socket = null;
    this.timeoutId = null;
    this.pendingTicket = null;
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

  async fetch(request: any) {
    const url = new URL(request.url);

    if (url.pathname === "/generate-ticket") {
      const ticket = crypto.randomUUID();
      this.pendingTicket = { value: ticket, expiresAt: Date.now() + 30_000 };
      return new Response(JSON.stringify({ ticket }));
    }

    if (url.pathname === "/connect") {
      const ticket = url.searchParams.get("ticket");
      const valid =
        this.pendingTicket &&
        this.pendingTicket.value === ticket &&
        Date.now() < this.pendingTicket.expiresAt;

      this.pendingTicket = null; // single-use, always discard

      if (!valid) {
        return new Response("Unauthorized", { status: 401 });
      }
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
