from fastapi import FastAPI, Request, Query
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse
from typing import AsyncGenerator
import asyncio
import json
from agent import agent

graph = agent()

app = FastAPI()

# Enable CORS from all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "server is running"}



def clean_chunk(obj):
    if isinstance(obj, dict):
        return {k: clean_chunk(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [clean_chunk(v) for v in obj]
    elif isinstance(obj, (str, int, float, bool, type(None))):
        return obj
    else:
        return str(obj)
 
@app.get("/stream")
async def stream_response(query: str = Query(...)):
    async def event_generator():
        try:
            async for chunk in graph.astream({"query": query, "top_k": 10, "retry_counter": 0}):
                # Clean complex types
                clean = clean_chunk(chunk[list(chunk.keys())[0]])
                # Just yield JSON (EventSourceResponse will wrap it in `data: ...`)
                yield json.dumps(clean)
        except asyncio.CancelledError:
            print("Client disconnected")
        except Exception as e:
            yield json.dumps({"error": str(e)})
        finally:
            yield json.dumps({"status": "complete"})

    return EventSourceResponse(event_generator())

# Do NOT use __main__ if you're running with uvicorn externally
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)