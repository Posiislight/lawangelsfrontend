"""
RAG Service for Angel AI

Provides retrieval-augmented generation using Law Angels textbooks.
Uses simple JSON-based storage with numpy for cosine similarity search.
No external vector database required.
"""

import os
import json
import logging
from typing import List, Dict
from django.conf import settings

logger = logging.getLogger(__name__)

# File-based storage for embeddings
EMBEDDINGS_FILE = os.path.join(settings.BASE_DIR, 'textbook_embeddings.json')

# Cache for loaded embeddings
_embeddings_cache = None


def get_openai_client():
    """Get OpenAI client for embeddings."""
    from openai import OpenAI
    api_key = os.environ.get('OPENROUTER_API_KEY')
    if not api_key:
        raise ValueError("OPENROUTER_API_KEY not set")
    return OpenAI(
        base_url='https://openrouter.ai/api/v1',
        api_key=api_key
    )


def extract_text_from_pdf(pdf_path: str) -> str:
    """Extract text from a PDF file using PyMuPDF."""
    import fitz  # PyMuPDF
    
    text_parts = []
    try:
        doc = fitz.open(pdf_path)
        for page in doc:
            text_parts.append(page.get_text())
        doc.close()
    except Exception as e:
        logger.error(f"Error extracting text from {pdf_path}: {e}")
        return ""
    
    return "\n".join(text_parts)


def chunk_text(text: str, chunk_size: int = 1500, overlap: int = 200) -> List[str]:
    """Split text into overlapping chunks for better context."""
    if not text:
        return []
    
    chunks = []
    start = 0
    text_len = len(text)
    
    while start < text_len:
        end = start + chunk_size
        chunk = text[start:end]
        
        # Try to break at sentence boundary
        if end < text_len:
            last_period = chunk.rfind('.')
            last_newline = chunk.rfind('\n')
            break_point = max(last_period, last_newline)
            if break_point > chunk_size // 2:
                chunk = chunk[:break_point + 1]
                end = start + break_point + 1
        
        if chunk.strip():
            chunks.append(chunk.strip())
        
        start = end - overlap
    
    return chunks


def get_embedding(text: str) -> List[float]:
    """Get embedding for a text using OpenAI."""
    client = get_openai_client()
    
    # Truncate if too long (max 8191 tokens for embedding model)
    if len(text) > 30000:
        text = text[:30000]
    
    response = client.embeddings.create(
        model="openai/text-embedding-3-small",
        input=text
    )
    
    return response.data[0].embedding


def cosine_similarity(a: List[float], b: List[float]) -> float:
    """Calculate cosine similarity between two vectors."""
    dot_product = sum(x * y for x, y in zip(a, b))
    norm_a = sum(x * x for x in a) ** 0.5
    norm_b = sum(x * x for x in b) ** 0.5
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot_product / (norm_a * norm_b)


def load_embeddings() -> Dict:
    """Load embeddings from file (cached in memory)."""
    global _embeddings_cache
    
    if _embeddings_cache is not None:
        return _embeddings_cache
    
    if os.path.exists(EMBEDDINGS_FILE):
        try:
            with open(EMBEDDINGS_FILE, 'r', encoding='utf-8') as f:
                _embeddings_cache = json.load(f)
                return _embeddings_cache
        except Exception as e:
            logger.error(f"Error loading embeddings: {e}")
    
    _embeddings_cache = {"chunks": []}
    return _embeddings_cache


def save_embeddings(data: Dict):
    """Save embeddings to file."""
    global _embeddings_cache
    _embeddings_cache = data
    
    with open(EMBEDDINGS_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f)


def index_textbook(textbook) -> int:
    """Index a single textbook. Returns number of chunks indexed."""
    pdf_path = textbook.file_path
    
    if not os.path.exists(pdf_path):
        logger.warning(f"PDF not found: {pdf_path}")
        return 0
    
    logger.info(f"Extracting text from: {textbook.title}")
    text = extract_text_from_pdf(pdf_path)
    
    if not text:
        logger.warning(f"No text extracted from: {textbook.title}")
        return 0
    
    logger.info(f"Chunking text for: {textbook.title}")
    chunks = chunk_text(text)
    
    if not chunks:
        return 0
    
    # Load existing embeddings
    data = load_embeddings()
    
    # Remove old chunks for this textbook
    data["chunks"] = [c for c in data["chunks"] if c.get("textbook_id") != textbook.id]
    
    logger.info(f"Indexing {len(chunks)} chunks for: {textbook.title}")
    
    indexed = 0
    for i, chunk in enumerate(chunks):
        try:
            embedding = get_embedding(chunk)
            data["chunks"].append({
                "textbook_id": textbook.id,
                "textbook_title": textbook.title,
                "subject": textbook.subject,
                "chunk_index": i,
                "content": chunk,
                "embedding": embedding
            })
            indexed += 1
            
            # Log progress every 10 chunks
            if (i + 1) % 10 == 0:
                logger.info(f"  Progress: {i + 1}/{len(chunks)} chunks")
                
        except Exception as e:
            logger.error(f"Error embedding chunk {i}: {e}")
            continue
    
    # Save updated embeddings
    save_embeddings(data)
    
    logger.info(f"Indexed {indexed} chunks for: {textbook.title}")
    return indexed


def search_relevant_content(query: str, top_k: int = 3) -> List[Dict]:
    """
    Search for relevant textbook content based on the query.
    Returns list of {content, textbook_title, subject}.
    
    Fast because embeddings are cached in memory after first load.
    """
    try:
        data = load_embeddings()
        
        if not data.get("chunks"):
            logger.info("No indexed content found")
            return []
        
        # Get embedding for query
        query_embedding = get_embedding(query)
        
        # Calculate similarities
        scored_chunks = []
        for chunk in data["chunks"]:
            similarity = cosine_similarity(query_embedding, chunk["embedding"])
            scored_chunks.append((similarity, chunk))
        
        # Sort by similarity and take top_k
        scored_chunks.sort(key=lambda x: x[0], reverse=True)
        top_chunks = scored_chunks[:top_k]
        
        # Format results
        results = []
        for score, chunk in top_chunks:
            if score > 0.3:  # Only include reasonably relevant results
                results.append({
                    'content': chunk['content'],
                    'textbook_title': chunk['textbook_title'],
                    'subject': chunk['subject'],
                    'score': score
                })
        
        return results
    
    except Exception as e:
        logger.error(f"Error searching content: {e}")
        return []


def format_context_for_prompt(results: List[Dict]) -> str:
    """Format search results as context for the LLM prompt."""
    if not results:
        return ""
    
    context_parts = []
    
    for i, result in enumerate(results, 1):
        context_parts.append(f"**Source {i}: {result['textbook_title']} ({result['subject']})**")
        context_parts.append(result['content'])
        context_parts.append("")
    
    return "\n".join(context_parts)
