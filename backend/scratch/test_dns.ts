import dns from "dns";
import https from "https";

dns.resolve4("api.pinata.cloud", (err, addresses) => {
  console.log("DNS IPv4 for api.pinata.cloud:", err ? err.message : addresses);
});

dns.resolve4("gateway.pinata.cloud", (err, addresses) => {
  console.log("DNS IPv4 for gateway.pinata.cloud:", err ? err.message : addresses);
});
