import asyncio
import time
import urllib.request

URL = "http://127.0.0.1:8000/api/preferences"
TOTAL_REQUESTS = 20

def make_request():
    start = time.perf_counter()

    request = urllib.request.Request(
        URL,
        headers={
            "Cookie": "access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2YWNmYTNkMjJmZTUyYWY2NDRkNmQ0NzkiLCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNzkxOTk3Mjc0LCJleHAiOjE3OTE5OTkwNzQsImp0aSI6ImRhZjNmMTU1ZGY0YTRiMTA5Zjg1MmU1NjJkNjM3MTNiIn0.Gb0wro7xs-OdHHbmSL5TroPQAHPZX1k4O7XUwsRaves"
        }
    )

    try:
        with urllib.request.urlopen(request, timeout=15) as response:
            response.read()
            return response.status, (time.perf_counter() - start) * 1000
    except Exception as error:
        print(f"Error: {error}")
        return None, (time.perf_counter() - start) * 1000

async def main():
    start = time.perf_counter()
    results = await asyncio.gather(
        *(asyncio.to_thread(make_request) for _ in range(TOTAL_REQUESTS))
    )
    elapsed = time.perf_counter() - start

    successes = sum(status == 200 for status, _ in results)
    failures = TOTAL_REQUESTS - successes
    times = [ms for status, ms in results if status is not None]

    print("\n--- CONCURRENCY TEST ---")
    print(f"Total requests: {TOTAL_REQUESTS}")
    print(f"HTTP 200: {successes}")
    print(f"Failed requests: {failures}")
    print(f"Total duration: {elapsed:.3f} seconds")

    if times:
        print(f"Average response: {sum(times) / len(times):.2f} ms")
        print(f"Maximum response: {max(times):.2f} ms")

    for i, (status, ms) in enumerate(results, 1):
        print(f"Request {i:02}: HTTP {status} | {ms:.2f} ms")

asyncio.run(main())
