from tavily import TavilyClient
import os
from dotenv import load_dotenv

load_dotenv()
client = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))

def web_search(query:str)->list[dict]:
    response = client.search(query,max_results=5)
    
    results = []
    for r in response["results"]:
        results.append({
            "text":r["content"],
            "source":r["url"],
            "chunk_id":hash(r["url"]),
            "page_number":"web"
        })
    return results