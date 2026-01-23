"""
Pinecone RAG Service for Angel AI

Provides retrieval-augmented generation using legal resources (cases and statutes).
Uses Pinecone vector database for fast semantic search.
"""

import os
import logging
from typing import List, Dict, Optional

logger = logging.getLogger(__name__)

# Constants
CHUNK_SIZE = 1500
CHUNK_OVERLAP = 200
EMBEDDING_DIMENSION = 1536
LEGAL_RESOURCES_DIR = os.path.join(
    os.path.dirname(os.path.dirname(__file__)),
    'angel-ai resources',
    'LAW ANGEL AI RESOURCE'
)


def get_pinecone_client():
    """Get Pinecone client instance."""
    from pinecone import Pinecone
    
    api_key = os.environ.get('PINECONE_API_KEY')
    if not api_key:
        raise ValueError("PINECONE_API_KEY environment variable is not set")
    
    return Pinecone(api_key=api_key)


def get_pinecone_index():
    """Get or create the Pinecone index."""
    pc = get_pinecone_client()
    index_name = os.environ.get('PINECONE_INDEX_NAME', 'law-angels-ai')
    
    return pc.Index(index_name)


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


def chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> List[str]:
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
    
    # Truncate if too long
    if len(text) > 30000:
        text = text[:30000]
    
    response = client.embeddings.create(
        model="openai/text-embedding-3-small",
        input=text
    )
    
    return response.data[0].embedding


def get_subject_from_filename(filename: str) -> str:
    """Extract subject from PDF filename."""
    name = filename.replace('.pdf', '').replace('_', ' ').title()
    
    # Map filenames to proper subject names
    subject_map = {
        'Contract': 'Contract Law',
        'Criminal Law': 'Criminal Law',
        'Criminal Practice': 'Criminal Practice',
        'Dispute Resolution': 'Dispute Resolution',
        'Ethics': 'Professional Ethics',
        'Land Law': 'Land Law',
        'Property Practice': 'Property Practice',
        'Solicitors Accounts': "Solicitors' Accounts",
        'Solicitors Account Mantra': "Solicitors' Accounts",
        'Summary': 'General Summary',
        'Tort': 'Tort Law',
    }
    
    return subject_map.get(name, name)


def index_legal_resources() -> Dict[str, int]:
    """
    Index all legal resource PDFs into Pinecone.
    Returns dict with filename -> chunk count.
    """
    if not os.path.exists(LEGAL_RESOURCES_DIR):
        logger.error(f"Legal resources directory not found: {LEGAL_RESOURCES_DIR}")
        return {}
    
    index = get_pinecone_index()
    results = {}
    
    # Get all PDF files
    pdf_files = [f for f in os.listdir(LEGAL_RESOURCES_DIR) if f.endswith('.pdf')]
    logger.info(f"Found {len(pdf_files)} PDF files to index")
    
    for pdf_file in pdf_files:
        pdf_path = os.path.join(LEGAL_RESOURCES_DIR, pdf_file)
        subject = get_subject_from_filename(pdf_file)
        
        logger.info(f"Processing: {pdf_file} ({subject})")
        
        # Extract text
        text = extract_text_from_pdf(pdf_path)
        if not text:
            logger.warning(f"No text extracted from: {pdf_file}")
            results[pdf_file] = 0
            continue
        
        # Chunk the text
        chunks = chunk_text(text)
        logger.info(f"  Created {len(chunks)} chunks")
        
        # Create vectors for upsert
        vectors_to_upsert = []
        for i, chunk in enumerate(chunks):
            try:
                embedding = get_embedding(chunk)
                
                vector_id = f"{pdf_file.replace('.pdf', '')}_{i}"
                vectors_to_upsert.append({
                    'id': vector_id,
                    'values': embedding,
                    'metadata': {
                        'source': pdf_file,
                        'subject': subject,
                        'chunk_index': i,
                        'content': chunk[:1000]  # Store first 1000 chars in metadata
                    }
                })
                
                # Batch upsert every 50 vectors
                if len(vectors_to_upsert) >= 50:
                    index.upsert(vectors=vectors_to_upsert)
                    logger.info(f"  Upserted batch of {len(vectors_to_upsert)} vectors")
                    vectors_to_upsert = []
                    
            except Exception as e:
                logger.error(f"Error embedding chunk {i} of {pdf_file}: {e}")
                continue
        
        # Upsert remaining vectors
        if vectors_to_upsert:
            index.upsert(vectors=vectors_to_upsert)
            logger.info(f"  Upserted final batch of {len(vectors_to_upsert)} vectors")
        
        results[pdf_file] = len(chunks)
        logger.info(f"  Completed indexing {pdf_file}: {len(chunks)} chunks")
    
    return results


def search_relevant_content(query: str, top_k: int = 3) -> List[Dict]:
    """
    Search Pinecone for relevant legal content based on the query.
    Returns list of {content, source, subject, score}.
    """
    try:
        # Get embedding for query
        query_embedding = get_embedding(query)
        
        # Search Pinecone
        index = get_pinecone_index()
        results = index.query(
            vector=query_embedding,
            top_k=top_k,
            include_metadata=True
        )
        
        # Format results
        formatted_results = []
        for match in results.matches:
            if match.score > 0.3:  # Only include reasonably relevant results
                formatted_results.append({
                    'content': match.metadata.get('content', ''),
                    'source': match.metadata.get('source', 'Unknown'),
                    'subject': match.metadata.get('subject', 'Unknown'),
                    'score': match.score
                })
        
        logger.info(f"Pinecone search found {len(formatted_results)} relevant results")
        return formatted_results
    
    except Exception as e:
        logger.error(f"Error searching Pinecone: {e}")
        return []


def format_context_for_prompt(results: List[Dict]) -> str:
    """Format search results as context for the LLM prompt."""
    if not results:
        return ""
    
    context_parts = []
    
    for i, result in enumerate(results, 1):
        context_parts.append(f"From {result['subject']} ({result['source']}):")
        context_parts.append(result['content'])
        context_parts.append("")
    
    return "\n".join(context_parts)
