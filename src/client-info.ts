let _clientName: string | null = null;
let _clientVersion: string | null = null;

export function setClientInfo(name: string, version: string) {
  _clientName = name;
  _clientVersion = version;
}

export function getClientInfo(): { name: string; version: string } | null {
  if (!_clientName) return null;
  return { name: _clientName, version: _clientVersion || "unknown" };
}
