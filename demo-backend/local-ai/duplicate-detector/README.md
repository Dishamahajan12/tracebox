# Local Duplicate Detector

This service runs the ticket duplicate check model locally so ticket data does not need to be sent to OpenAI or another external AI provider.

## Model

- Default model: `sentence-transformers/all-MiniLM-L6-v2`
- Language focus: English
- Privacy model: ticket text is processed on your own machine/server

## First-time setup

1. Create and activate a Python virtual environment.
2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Start the service:

```bash
uvicorn app:app --host 127.0.0.1 --port 8001
```

## Important note

The first time the service starts, Hugging Face will download the model files to the local machine cache. After that, the model is reused locally from cache.

## Endpoints

- `GET /health`
- `POST /api/similarity/duplicate-ticket`

## Example request

```json
{
  "draftText": "Title: Login button not working\nTitle: Login button not working\nDescription: Users cannot sign in on the portal.",
  "candidates": [
    {
      "ticketId": 101,
      "text": "Title: Unable to login\nTitle: Unable to login\nDescription: Portal sign in fails for all users."
    }
  ]
}
```
