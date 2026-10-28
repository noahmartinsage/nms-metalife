import { useEffect, useState } from "react";
import { getP2PNode } from "@/lib/p2p";

/** P2P 节点状态（每个标签页一个节点，多标签页互为对等节点） */
export function useP2P() {
  const [node] = useState(() => getP2PNode());
  const [peers, setPeers] = useState(() => node?.getPeers() ?? []);
  const [ledger, setLedger] = useState(() => node?.getLedger() ?? []);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    if (!node) return undefined;
    const offs = [
      node.on("peers", setPeers),
      node.on("ledger", setLedger),
      node.on("sync", (s) =>
        setEvents((list) => [{ ...s, ts: Date.now(), id: `${s.from}-${Date.now()}` }, ...list].slice(0, 20))
      ),
    ];
    const t = setInterval(() => setPeers(node.getPeers()), 2000);
    return () => {
      offs.forEach((off) => off());
      clearInterval(t);
    };
  }, [node]);

  return {
    node,
    nodeId: node?.nodeId || "—",
    enabled: !!node?.enabled,
    peers,
    ledger,
    events,
    height: ledger.length,
    broadcast: (type, payload) => node?.broadcast(type, payload),
    requestSync: () => node?.requestSync(),
  };
}

export default useP2P;
