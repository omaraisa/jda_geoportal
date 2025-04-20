// pages/api/proxy.ts

export default async function handler(req, res) {
    console.log('Request received:', req);
    const { url } = req.query;
    console.log('URL from query:', url);
    if (!url || Array.isArray(url)) {
      console.log('Invalid URL detected');
      return res.status(400).json({ error: "Invalid URL" });
    }
  
    try {
      console.log('Attempting to fetch:', url);
      const response = await fetch(url);
      console.log('Response received:', response);
      const contentType = response.headers.get("content-type");
      console.log('Content Type:', contentType);
  
      res.setHeader("Access-Control-Allow-Origin", "*");
      console.log('CORS header set');
  
      if (contentType?.includes("application/json")) {
        console.log('Content type is JSON');
        const data = await response.json();
        console.log('JSON data:', data);
        res.status(response.status).json(data);
      } else {
        console.log('Content type is not JSON');
        const text = await response.text();
        console.log('Text data:', text);
        res.status(response.status).send(text);
      }
    } catch (err) {
      console.error('Proxy request failed:', err);
      res.status(500).json({ error: "Failed to proxy request", details: err });
    }
  }
  