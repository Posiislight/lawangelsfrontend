"""
RAG Models for storing textbook embeddings in the database.
Replaces JSON file storage for production persistence on Render.
"""
from django.db import models
from django.contrib.postgres.fields import ArrayField


class TextbookChunk(models.Model):
    """
    Stores chunked textbook content with embeddings for RAG search.
    Embeddings are stored as an array of floats in PostgreSQL.
    """
    textbook = models.ForeignKey(
        'Textbook',
        on_delete=models.CASCADE,
        related_name='chunks'
    )
    chunk_index = models.IntegerField()
    content = models.TextField()
    # Embedding vector (1536 dimensions for text-embedding-3-small)
    embedding = ArrayField(
        models.FloatField(),
        size=1536,
        null=True,
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['textbook', 'chunk_index']
        unique_together = ['textbook', 'chunk_index']
        verbose_name = 'Textbook Chunk'
        verbose_name_plural = 'Textbook Chunks'
        indexes = [
            models.Index(fields=['textbook']),
        ]
    
    def __str__(self):
        return f"{self.textbook.title} - Chunk {self.chunk_index}"
